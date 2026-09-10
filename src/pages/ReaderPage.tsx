import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import EmojiPicker from "emoji-picker-react";
import ChapterContent from "../components/reader/ChapterContent";
import GiphyPicker from "../components/reader/GiphyPicker";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Lock as LockIcon,
  List,
  MessageSquare,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import {
  getChapterProgress,
  resolveChapterNavigation,
} from "../features/reader/engine/chapterNavigation";
import {
  hydrateReadingProgress,
  persistReadingProgress,
} from "../features/reader/services/readingProgressService";
import { readerPreferencesStorage } from "../features/reader/services/persistence";
import type { ReaderFontFamily, ReaderTheme } from "../features/reader/types";
import {
  apiCommentsRepository,
  type Book,
  type ChapterComment,
  type GiphyGif,
} from "../services/repositories";
import type { CommonProps } from "../types";

interface Props extends CommonProps {
  book: Book;
  chapterId: string;
}

type Theme = "light" | "sepia" | "dark";
type FontSize = 14 | 16 | 18 | 20;
type FontFamily = "lora" | "fraunces" | "nunito";

interface ThemeConfig {
  surfaceCls: string;
  text: string;
  muted: string;
  controlBg: string;
  controlText: string;
  name: string;
  icon: ReactNode;
}

const themes: Record<Theme, ThemeConfig> = {
  light: {
    surfaceCls: "reader-surface-light",
    text: "#2C1A0A",
    muted: "#8A6840",
    controlBg: "rgba(44,26,10,0.92)",
    controlText: "#F6F1E4",
    name: "Paper",
    icon: <Sun size={13} />,
  },

  sepia: {
    surfaceCls: "reader-surface-sepia",
    text: "#4A2A06",
    muted: "#7A5828",
    controlBg: "rgba(74,42,6,0.94)",
    controlText: "#EDD9A3",
    name: "Sepia",
    icon: <Coffee size={13} />,
  },

  dark: {
    surfaceCls: "reader-surface-dark",
    text: "#E8E0CC",
    muted: "#9A8E78",
    controlBg: "rgba(18,15,10,0.96)",
    controlText: "#E8E0CC",
    name: "Night",
    icon: <Moon size={13} />,
  },
};

const fontFamilies: Record<FontFamily, { css: string; name: string }> = {
  lora: {
    css: "'Lora', Georgia, serif",
    name: "Lora",
  },

  fraunces: {
    css: "'Fraunces', Georgia, serif",
    name: "Fraunces",
  },

  nunito: {
    css: "'Nunito', system-ui, sans-serif",
    name: "Nunito",
  },
};

const fontSizes: FontSize[] = [14, 16, 18, 20];

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("button, a, input, select, textarea"));

/*
 * ============================================================
 * COMMENT TREE HELPERS
 * ============================================================
 */

/**
 * Inserts a newly-created comment into the correct place
 * in the nested comment tree.
 *
 * Root comment:
 *   [comment, ...existing]
 *
 * Reply:
 *   Finds the parent recursively and prepends the reply
 *   to that parent's replies.
 */
const appendCommentToTree = (
  items: ChapterComment[],
  comment: ChapterComment,
): ChapterComment[] => {
  if (!comment.parentId) {
    return [comment, ...items];
  }

  let inserted = false;

  const walk = (nodes: ChapterComment[]): ChapterComment[] =>
    nodes.map((node) => {
      if (node.id === comment.parentId) {
        inserted = true;

        return {
          ...node,
          replies: [comment, ...node.replies],
        };
      }

      if (node.replies.length > 0) {
        return {
          ...node,
          replies: walk(node.replies),
        };
      }

      return node;
    });

  const next = walk(items);

  /*
   * This fallback should normally never be needed because
   * the backend validates parentId, but if a parent cannot
   * be found locally we still show the new comment instead
   * of silently losing it.
   */
  return inserted ? next : [comment, ...items];
};

export default function ReaderPage({
  book,
  chapterId,
  navigate,
  isLoggedIn,
  unlockedChapters,
  coins,
  unlockChapter,
  libraryBooks,
  addToLibrary,
}: Props) {
  const chapterIndex = book?.chapters.findIndex(
    (chapter) => chapter.id === chapterId,
  );

  const chapter =
    chapterIndex >= 0 ? book.chapters[chapterIndex] : book?.chapters?.[0];

  const isBookmarked = libraryBooks.includes(book.id);

  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [fontFamily, setFontFamily] = useState<FontFamily>("lora");

  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);

  /*
   * ============================================================
   * REPLY STATE
   * ============================================================
   *
   * When replyingTo is set, the composer submits the new
   * comment with:
   *
   * parentId: replyingTo.id
   *
   * When null, the comment is a normal root comment.
   */
  const [replyingTo, setReplyingTo] = useState<ChapterComment | null>(null);

  const [screenState, setScreenState] = useState<"reading" | "locked">(
    "reading",
  );

  const [currentTime, setCurrentTime] = useState("");
  const [battery, setBattery] = useState<number | null>(null);

  const readerShellRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);

  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const tc = themes[theme];

  /*
   * ============================================================
   * READER CONTROL TIMER
   * ============================================================
   */

  const clearControlsTimer = useCallback(() => {
    if (controlsTimer.current !== null) {
      window.clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
  }, []);

  const startControlsTimer = useCallback(() => {
    clearControlsTimer();

    controlsTimer.current = window.setTimeout(() => {
      setShowControls(false);
      setShowSettings(false);
      setShowChapterList(false);
      setShowComments(false);

      controlsTimer.current = null;
    }, 8000);
  }, [clearControlsTimer]);

  const scheduleControlsHide = useCallback(() => {
    if (showSettings || showComments || showChapterList) {
      clearControlsTimer();
      return;
    }

    startControlsTimer();
  }, [
    clearControlsTimer,
    showComments,
    showChapterList,
    showSettings,
    startControlsTimer,
  ]);

  const closePanels = useCallback(() => {
    setShowSettings(false);
    setShowChapterList(false);
    setShowComments(false);

    if (showControls) {
      startControlsTimer();
    }
  }, [showControls, startControlsTimer]);

  const toggleControls = useCallback(() => {
    setShowControls((visible) => {
      const nextVisible = !visible;

      if (!nextVisible) {
        setShowSettings(false);
        setShowChapterList(false);
        setShowComments(false);
        clearControlsTimer();
      } else {
        startControlsTimer();
      }

      return nextVisible;
    });
  }, [clearControlsTimer, startControlsTimer]);

  /*
   * ============================================================
   * READER PREFERENCES
   * ============================================================
   */

  useEffect(() => {
    const preferences = readerPreferencesStorage.get();

    setTheme(preferences.theme as Theme);
    setFontFamily(preferences.fontFamily as FontFamily);

    const savedFontSize = {
      small: 14,
      medium: 16,
      large: 18,
      xlarge: 20,
    } as const;

    setFontSize(savedFontSize[preferences.fontSize]);
  }, []);

  useEffect(() => {
    readerPreferencesStorage.save({
      theme: theme as ReaderTheme,
      fontFamily: fontFamily as ReaderFontFamily,
      fontSize: (
        {
          14: "small",
          16: "medium",
          18: "large",
          20: "xlarge",
        } as const
      )[fontSize],
    });
  }, [fontFamily, fontSize, theme]);

  /*
   * ============================================================
   * STATUS BAR TIME
   * ============================================================
   */

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };

    updateTime();

    const interval = window.setInterval(updateTime, 30000);

    return () => window.clearInterval(interval);
  }, []);

  /*
   * ============================================================
   * BATTERY
   * ============================================================
   */

  useEffect(() => {
    if (!("getBattery" in navigator)) {
      return;
    }

    let batteryManager: {
      level: number;
      addEventListener: (type: "levelchange", listener: () => void) => void;
      removeEventListener: (type: "levelchange", listener: () => void) => void;
    } | null = null;

    const updateBattery = () => {
      if (batteryManager) {
        setBattery(Math.round(batteryManager.level * 100));
      }
    };

    (
      navigator as typeof navigator & {
        getBattery: () => Promise<typeof batteryManager>;
      }
    )
      .getBattery()
      .then((manager) => {
        if (!manager) {
          return;
        }

        batteryManager = manager;

        updateBattery();

        manager.addEventListener("levelchange", updateBattery);
      })
      .catch(() => undefined);

    return () => {
      batteryManager?.removeEventListener("levelchange", updateBattery);
    };
  }, []);

  /*
   * ============================================================
   * CLEANUP
   * ============================================================
   */

  useEffect(() => {
    return () => {
      clearControlsTimer();

      if (progressTimer.current !== null) {
        window.clearTimeout(progressTimer.current);
      }
    };
  }, [clearControlsTimer]);

  /*
   * ============================================================
   * CHAPTER PROGRESS
   * ============================================================
   */

  const chapterProgress = getChapterProgress(
    Math.max(0, chapterIndex),
    book?.chapters?.length ?? 0,
  );

  /*
   * ============================================================
   * READING PROGRESS HYDRATION
   * ============================================================
   */

  useEffect(() => {
    if (!book || !isLoggedIn) {
      return;
    }

    void hydrateReadingProgress(book.id)
      .then((entry) => {
        if (entry?.position !== undefined && readerShellRef.current) {
          readerShellRef.current.scrollTop = entry.position;
        }
      })
      .catch(() => undefined);
  }, [book, isLoggedIn]);

  /*
   * ============================================================
   * READING PROGRESS INITIAL SAVE
   * ============================================================
   */

  useEffect(() => {
    if (!book || !chapter || !isLoggedIn) {
      return;
    }

    persistReadingProgress({
      userId: "authenticated-user",
      bookId: book.id,
      chapterId: chapter.id,
      page: chapter.number,
      totalPages: book.chapters.length,
      progressPercentage: chapterProgress,
      lastReadAt: new Date().toISOString(),
    });
  }, [book, chapter, chapterProgress, isLoggedIn]);

  /*
   * ============================================================
   * COMMENTS
   * ============================================================
   */

  useEffect(() => {
    if (!showComments || !book || !chapter) {
      return;
    }

    let cancelled = false;

    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError(null);

      /*
       * Reset reply state when loading a chapter's comments.
       */
      setReplyingTo(null);

      setComments([]);

      try {
        const result = await apiCommentsRepository.list(book.id, chapter.id);

        if (cancelled) {
          return;
        }

        setComments(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load chapter comments:", error);

        setComments([]);

        setCommentsError(
          error instanceof Error
            ? error.message
            : "Unable to load comments. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [book, chapter, showComments]);

  /*
   * ============================================================
   * RESET COMMENT COMPOSER WHEN CHAPTER CHANGES
   * ============================================================
   */

  useEffect(() => {
    setCommentText("");
    setSelectedGif(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  }, [chapter?.id]);

  /*
   * ============================================================
   * PROGRESS SAVE
   * ============================================================
   */

  const scheduleProgressSave = useCallback(() => {
    if (!isLoggedIn || !book || !chapter) {
      return;
    }

    if (progressTimer.current !== null) {
      window.clearTimeout(progressTimer.current);
    }

    progressTimer.current = window.setTimeout(() => {
      const shell = readerShellRef.current;

      if (!shell) {
        return;
      }

      const maxScroll = shell.scrollHeight - shell.clientHeight;

      const progress =
        maxScroll > 0 ? Math.round((shell.scrollTop / maxScroll) * 100) : 0;

      persistReadingProgress({
        userId: "authenticated-user",
        bookId: book.id,
        chapterId: chapter.id,
        page: chapter.number,
        totalPages: book.chapters.length,
        progressPercentage: Math.min(100, Math.max(0, progress)),
        position: shell.scrollTop,
        lastReadAt: new Date().toISOString(),
      });
    }, 800);
  }, [book, chapter, isLoggedIn]);

  /*
   * ============================================================
   * CHAPTER NAVIGATION
   * ============================================================
   */

  const goToChapter = useCallback(
    (direction: "next" | "prev") => {
      if (!book || chapterIndex < 0) {
        return;
      }

      const navigation = resolveChapterNavigation(
        chapterIndex,
        book.chapters.length,
        direction,
      );

      if (!navigation) {
        return;
      }

      const targetChapter = book.chapters[navigation.targetIndex];

      if (
        targetChapter.accessType === "PREMIUM" &&
        !unlockedChapters.includes(targetChapter.id)
      ) {
        if (!isLoggedIn) {
          navigate("auth");
          return;
        }

        navigate("reader", book.id, targetChapter.id);

        setScreenState("locked");
        return;
      }

      navigate("reader", book.id, targetChapter.id);
    },
    [book, chapterIndex, isLoggedIn, navigate, unlockedChapters],
  );

  const selectChapter = useCallback(
    (targetChapterId: string) => {
      if (!book) {
        return;
      }

      const targetChapter = book.chapters.find(
        (entry) => entry.id === targetChapterId,
      );

      if (!targetChapter) {
        return;
      }

      if (
        targetChapter.accessType === "PREMIUM" &&
        !unlockedChapters.includes(targetChapter.id) &&
        !isLoggedIn
      ) {
        navigate("auth");
        return;
      }

      closePanels();

      navigate("reader", book.id, targetChapter.id);
    },
    [book, closePanels, isLoggedIn, navigate, unlockedChapters],
  );

  /*
   * ============================================================
   * UNLOCK
   * ============================================================
   */

  const handleUnlock = useCallback(async () => {
    if (!chapter) {
      return;
    }

    if (coins >= chapter.price) {
      await unlockChapter(chapter.id, chapter.price);

      setScreenState("reading");
      return;
    }

    navigate("wallet");
  }, [chapter, coins, navigate, unlockChapter]);

  /*
   * ============================================================
   * START REPLY
   * ============================================================
   */

  const handleReply = useCallback(
    (comment: ChapterComment) => {
      if (!isLoggedIn) {
        navigate("auth");
        return;
      }

      setReplyingTo(comment);

      /*
       * A reply should start with a clean composer state
       * except for the text/GIF the user may already have
       * intentionally entered.
       *
       * We close auxiliary pickers so the reply composer
       * gets the focus.
       */
      setShowEmojiPicker(false);
      setShowGifPicker(false);

      clearControlsTimer();

      /*
       * Focus after React has rendered the reply banner.
       */
      window.requestAnimationFrame(() => {
        commentTextareaRef.current?.focus();
      });
    },
    [clearControlsTimer, isLoggedIn, navigate],
  );

  /*
   * ============================================================
   * CANCEL REPLY
   * ============================================================
   */

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);

    window.requestAnimationFrame(() => {
      commentTextareaRef.current?.focus();
    });

    clearControlsTimer();
  }, [clearControlsTimer]);

  /*
   * ============================================================
   * CREATE COMMENT / REPLY
   * ============================================================
   */

  const handleSubmitComment = useCallback(async () => {
    if (!book || !chapter) {
      return;
    }

    const content = commentText.trim();

    /*
     * A valid submission can be:
     *
     * 1. Text only
     * 2. GIF only
     * 3. Text + GIF
     */
    if ((!content && !selectedGif) || commentSubmitting) {
      return;
    }

    if (!isLoggedIn) {
      navigate("auth");
      return;
    }

    setCommentSubmitting(true);
    setCommentsError(null);

    try {
      const comment = await apiCommentsRepository.create(
        book.id,
        chapter.id,
        content,
        {
          /*
           * THIS is the important part for nested replies.
           *
           * Root comment:
           *   parentId = null
           *
           * Reply:
           *   parentId = replyingTo.id
           */
          parentId: replyingTo?.id ?? null,
          gifId: selectedGif?.id ?? null,
          gifUrl: selectedGif?.url ?? null,
        },
      );

      /*
       * Insert the response into the correct place in the
       * existing nested comment tree.
       */
      setComments((current) => appendCommentToTree(current, comment));

      /*
       * Reset composer after successful submission.
       */
      setCommentText("");
      setSelectedGif(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
    } catch (error) {
      console.error("Failed to post chapter comment:", error);

      setCommentsError(
        error instanceof Error
          ? error.message
          : "Unable to post your comment. Please try again.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  }, [
    book,
    chapter,
    commentText,
    commentSubmitting,
    isLoggedIn,
    navigate,
    replyingTo,
    selectedGif,
  ]);

  /*
   * ============================================================
   * DELETE COMMENT
   * ============================================================
   */

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!book || !chapter) {
        return;
      }

      try {
        await apiCommentsRepository.remove(book.id, chapter.id, commentId);

        setComments((current) =>
          current.filter((comment) => comment.id !== commentId),
        );
      } catch (error) {
        console.error("Failed to delete chapter comment:", error);

        setCommentsError(
          error instanceof Error
            ? error.message
            : "Unable to delete the comment. Please try again.",
        );
      }
    },
    [book, chapter],
  );

  /*
   * ============================================================
   * KEYBOARD
   * ============================================================
   */

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToChapter("next");
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToChapter("prev");
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();

        if (showComments || showChapterList || showSettings) {
          closePanels();
          return;
        }

        navigate("book", book.id);
      }
    },
    [
      book,
      closePanels,
      goToChapter,
      navigate,
      showChapterList,
      showComments,
      showSettings,
    ],
  );

  /*
   * ============================================================
   * SWIPE
   * ============================================================
   */

  const handleSwipe = useCallback(
    (dx: number, dy: number) => {
      if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }

      goToChapter(dx < 0 ? "next" : "prev");
    },
    [goToChapter],
  );

  /*
   * ============================================================
   * CHAPTER LOCK
   * ============================================================
   */

  const isChapterLocked =
    chapter?.accessType === "PREMIUM" && !unlockedChapters.includes(chapter.id);

  /*
   * ============================================================
   * RESET READER POSITION WHEN CHAPTER CHANGES
   * ============================================================
   */

  useLayoutEffect(() => {
    const shell = readerShellRef.current;

    if (!shell || isChapterLocked || screenState === "locked") {
      return;
    }

    shell.scrollTop = 0;
    shell.scrollLeft = 0;
  }, [chapter?.id, isChapterLocked, screenState]);

  /*
   * ============================================================
   * FALLBACK
   * ============================================================
   */

  if (!book || !chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#100d0b] px-6 text-center">
        <div className="somi-state max-w-md">
          <h2>No chapter available</h2>

          <p>The selected story does not have published chapters yet.</p>

          <button
            className="somi-quiet-button"
            onClick={() => navigate("discover")}
          >
            Explore more stories
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * LOCKED CHAPTER
   * ============================================================
   */

  if (isChapterLocked || screenState === "locked") {
    return (
      <div
        className="flex flex-col overflow-hidden select-none"
        style={{
          width: "100vw",
          height: "100dvh",
          background: "#0d0b18",
        }}
      >
        <div className="flex items-center px-5 pt-12 pb-6">
          <button
            onClick={() => navigate("book", book.id)}
            className="flex items-center gap-2 active:scale-90"
          >
            <ArrowLeft size={18} color="#f0ece4" />

            <span
              className="text-sm"
              style={{
                color: "#8b7ea8",
              }}
            >
              {book.title}
            </span>
          </button>
        </div>

        <div className="px-8 pt-4 pb-6 text-center">
          <p
            className="text-[10px] uppercase tracking-[0.3em] font-bold mb-1"
            style={{
              color: "#8b7ea8",
            }}
          >
            Chapter {chapter.number}
          </p>

          <h2
            className="font-display text-2xl font-bold mb-1"
            style={{
              color: "#f0ece4",
            }}
          >
            {chapter.title}
          </h2>

          <p
            className="text-sm"
            style={{
              color: "#8b7ea8",
            }}
          >
            {chapter.readingTime} min · {chapter.wordCount.toLocaleString()}{" "}
            words
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-end px-8 pb-12">
          <div
            className="flex items-center justify-between py-3 mb-2"
            style={{
              borderTop: "1px solid #2e2945",
              borderBottom: "1px solid #2e2945",
            }}
          >
            <span
              className="text-sm"
              style={{
                color: "#8b7ea8",
              }}
            >
              Unlock this chapter
            </span>

            <span
              className="font-bold text-base"
              style={{
                color: "#e8a84c",
              }}
            >
              {chapter.price}{" "}
              <span className="text-xs font-normal">Somi Coins</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-3 mb-6">
            <span
              className="text-sm"
              style={{
                color: "#8b7ea8",
              }}
            >
              Your balance
            </span>

            <span
              className="font-bold text-sm"
              style={{
                color: coins >= chapter.price ? "#3ecf8e" : "#c9603a",
              }}
            >
              {coins.toLocaleString()} coins
            </span>
          </div>

          <button
            onClick={handleUnlock}
            className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{
              background: "#e8a84c",
              color: "#0d0b18",
            }}
          >
            <LockIcon size={14} />

            {coins >= chapter.price
              ? `Unlock for ${chapter.price} Somi Coins`
              : "Get More Coins"}
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * RECURSIVE COMMENT RENDERER
   * ============================================================
   *
   * This is what makes the nested replies visible.
   *
   * Example:
   *
   * Comment A
   *   ↳ Reply A1
   *      ↳ Reply A1.1
   *   ↳ Reply A2
   *
   * The backend already returns:
   *
   * comment.replies[]
   *
   * so we recursively render that tree here.
   */
  const renderComment = (comment: ChapterComment, depth = 0): ReactNode => {
    const indentation = Math.min(depth, 4) * 16;

    return (
      <div
        key={comment.id}
        style={{
          marginLeft: indentation,
        }}
      >
        <article
          className="rounded-xl p-3"
          style={{
            background:
              depth === 0 ? `${tc.controlText}08` : `${tc.controlText}06`,
            border: `1px solid ${tc.controlText}08`,
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: `${tc.controlText}12`,
              }}
            >
              {comment.author.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-xs font-bold"
                  style={{
                    color: tc.controlText,
                  }}
                >
                  {comment.author.displayName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* Comment body */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {comment.author.displayName}
                  </p>

                  <p
                    className="text-[10px] mt-0.5"
                    style={{
                      color: `${tc.controlText}55`,
                    }}
                  >
                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {comment.content && (
                <p
                  className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    color: tc.controlText,
                  }}
                >
                  {comment.content}
                </p>
              )}

              {comment.gifUrl && (
                <div className="mt-3 overflow-hidden rounded-xl">
                  <img
                    src={comment.gifUrl}
                    alt="GIF"
                    className="block max-h-64 w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {/* =================================================
                  COMMENT ACTIONS
                  ================================================= */}

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleReply(comment);
                  }}
                  className="text-[10px] font-bold transition-opacity hover:opacity-80 active:scale-95"
                  style={{
                    color: "#e8a84c",
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* =====================================================
            NESTED REPLIES
            ===================================================== */}

        {comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  /*
   * ============================================================
   * READER
   * ============================================================
   */

  return (
    <div
      className={`relative overflow-hidden select-none ${tc.surfaceCls}`}
      style={{
        width: "100vw",
        height: "100dvh",
      }}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (isInteractiveTarget(event.target)) {
          if (!showComments && !showSettings && !showChapterList) {
            scheduleControlsHide();
          }

          return;
        }

        if (showComments || showSettings || showChapterList) {
          return;
        }

        toggleControls();
      }}
      tabIndex={0}
    >
      {/* =======================================================
          STATUS BAR
          ======================================================= */}

      <div
        className="absolute top-0 left-0 right-0 z-[900] flex items-center justify-between px-5"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 12px), 18px)",
          pointerEvents: "none",
        }}
      >
        <span
          className="text-[11px] font-semibold tabular-nums"
          style={{
            color: tc.text,
            fontFamily: "'Nunito', sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          {currentTime}
        </span>

        {battery !== null && (
          <div className="flex items-center gap-1.5">
            <span
              className="text-[11px]"
              style={{
                color: tc.text,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {battery}%
            </span>

            <div
              className="relative flex items-center"
              style={{
                width: 22,
                height: 11,
              }}
            >
              <div
                className="w-full h-full rounded-sm"
                style={{
                  border: `1px solid ${tc.text}50`,
                }}
              >
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${battery}%`,
                    background:
                      battery <= 20
                        ? "#c9603a"
                        : battery <= 50
                          ? "#e8a84c"
                          : tc.text,
                    opacity: 0.75,
                  }}
                />
              </div>

              <div
                className="absolute -right-[3px] top-1/2 -translate-y-1/2 rounded-r-sm"
                style={{
                  width: 3,
                  height: 6,
                  background: `${tc.text}45`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
          TOP CONTROLS
          ======================================================= */}

      <div
        className="absolute top-0 left-0 right-0 z-[1000] transition-all duration-200"
        onClick={(event) => {
          event.stopPropagation();

          if (!showSettings && !showComments && !showChapterList) {
            scheduleControlsHide();
          }
        }}
        style={{
          opacity: showControls ? 1 : 0,
          visibility: showControls ? "visible" : "hidden",
          pointerEvents: showControls ? "auto" : "none",
          transform: showControls ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 pb-4"
          style={{
            background: `linear-gradient(to bottom, ${tc.controlBg}, transparent)`,
            paddingTop: "max(env(safe-area-inset-top, 12px), 20px)",
          }}
        >
          {/* Book / Back */}
          <button
            onClick={() => navigate("book", book.id)}
            className="flex items-center gap-2.5 active:scale-90"
          >
            <ArrowLeft size={18} color={tc.controlText} />

            <div>
              <p
                className="text-[13px] font-bold leading-tight max-w-[160px] truncate"
                style={{
                  color: tc.controlText,
                }}
              >
                {book.title}
              </p>

              <p
                className="text-[10px] leading-none mt-0.5"
                style={{
                  color: `${tc.controlText}70`,
                }}
              >
                Ch.{chapter.number} · {chapter.title}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-4">
            {/* Settings */}
            <button
              onClick={(event) => {
                event.stopPropagation();

                setShowChapterList(false);

                setShowSettings((value) => {
                  const next = !value;

                  if (next) {
                    clearControlsTimer();
                  } else {
                    startControlsTimer();
                  }

                  return next;
                });
              }}
              className="active:scale-90"
              aria-label="Open reader settings"
            >
              <Settings size={18} color={tc.controlText} />
            </button>

            {/* Chapter list */}
            <button
              onClick={(event) => {
                event.stopPropagation();

                setShowSettings(false);

                setShowChapterList((value) => {
                  const next = !value;

                  if (next) {
                    clearControlsTimer();
                  } else {
                    startControlsTimer();
                  }

                  return next;
                });
              }}
              className="active:scale-90"
              aria-label="Open chapter list"
            >
              <List size={18} color={tc.controlText} />
            </button>

            {/* Bookmark */}
            <button
              onClick={(event) => {
                event.stopPropagation();

                if (!isLoggedIn) {
                  navigate("auth");
                  return;
                }

                addToLibrary(book.id);
                scheduleControlsHide();
              }}
              className="active:scale-90 transition-transform"
              aria-label={
                isBookmarked
                  ? "Remove book from library"
                  : "Add book to library"
              }
              title={isBookmarked ? "Remove from library" : "Add to library"}
            >
              <Bookmark
                size={18}
                color={tc.controlText}
                fill={isBookmarked ? tc.controlText : "none"}
              />
            </button>

            {/* Comments */}
            <button
              onClick={(event) => {
                event.stopPropagation();

                setShowSettings(false);
                setShowChapterList(false);
                setShowComments(true);

                clearControlsTimer();
              }}
              className="active:scale-90 transition-transform"
              aria-label="Open chapter comments"
              title="Comments"
            >
              <MessageSquare size={18} color={tc.controlText} />
            </button>
          </div>
        </div>

        {/* =====================================================
            SETTINGS
            ===================================================== */}

        {showSettings && (
          <div
            className="px-5 py-4"
            style={{
              background: tc.controlBg,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-2"
              style={{
                color: `${tc.controlText}55`,
              }}
            >
              Theme
            </p>

            <div className="flex gap-2 mb-4">
              {(["light", "sepia", "dark"] as Theme[]).map((value) => (
                <button
                  key={value}
                  onClick={(event) => {
                    event.stopPropagation();
                    setTheme(value);
                    clearControlsTimer();
                  }}
                  className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95"
                  style={{
                    background:
                      value === "light"
                        ? "#F2ECD6"
                        : value === "sepia"
                          ? "#E8D4A2"
                          : "#1E1A12",
                    color:
                      value === "light"
                        ? "#2C1A0A"
                        : value === "sepia"
                          ? "#4A2A06"
                          : "#E8E0CC",
                    border:
                      theme === value
                        ? "2px solid #e8a84c"
                        : "2px solid transparent",
                  }}
                >
                  {themes[value].icon}
                  {themes[value].name}
                </button>
              ))}
            </div>

            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-2"
              style={{
                color: `${tc.controlText}55`,
              }}
            >
              Font
            </p>

            <div className="flex gap-2 mb-4">
              {(["lora", "fraunces", "nunito"] as FontFamily[]).map((value) => (
                <button
                  key={value}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFontFamily(value);
                    clearControlsTimer();
                  }}
                  className="flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    fontFamily: fontFamilies[value].css,
                    background:
                      fontFamily === value
                        ? "rgba(232,168,76,0.2)"
                        : "rgba(255,255,255,0.06)",
                    color: tc.controlText,
                    border:
                      fontFamily === value
                        ? "1px solid rgba(232,168,76,0.5)"
                        : "1px solid transparent",
                  }}
                >
                  {fontFamilies[value].name}
                </button>
              ))}
            </div>

            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-2"
              style={{
                color: `${tc.controlText}55`,
              }}
            >
              Size
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={(event) => {
                  event.stopPropagation();

                  setFontSize((size) => Math.max(14, size - 2) as FontSize);

                  clearControlsTimer();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: tc.controlText,
                }}
                aria-label="Decrease font size"
              >
                A
              </button>

              <div className="flex-1 flex gap-1">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    onClick={(event) => {
                      event.stopPropagation();
                      setFontSize(size);
                      clearControlsTimer();
                    }}
                    className="flex-1 h-1.5 rounded-full cursor-pointer border-0"
                    style={{
                      background:
                        fontSize >= size ? "#e8a84c" : "rgba(255,255,255,0.18)",
                    }}
                    aria-label={`Set font size ${size}`}
                  />
                ))}
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();

                  setFontSize((size) => Math.min(20, size + 2) as FontSize);

                  clearControlsTimer();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: tc.controlText,
                }}
                aria-label="Increase font size"
              >
                A
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            CHAPTER LIST
            ===================================================== */}

        {showChapterList && (
          <div
            className="reader-chapter-drawer"
            aria-label="Chapter list"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-[9px] uppercase tracking-[0.24em] font-bold"
                  style={{
                    color: `${tc.controlText}55`,
                  }}
                >
                  Contents
                </p>

                <p
                  className="font-display text-lg font-semibold"
                  style={{
                    color: tc.controlText,
                  }}
                >
                  {book.title}
                </p>
              </div>

              <span
                className="text-[10px]"
                style={{
                  color: `${tc.controlText}70`,
                }}
              >
                {book.chapters.length} chapters
              </span>
            </div>

            <div className="reader-chapter-list mt-3">
              {book.chapters.map((entry) => {
                const locked =
                  entry.accessType === "PREMIUM" &&
                  !unlockedChapters.includes(entry.id);

                const current = entry.id === chapter.id;

                return (
                  <button
                    key={entry.id}
                    onClick={() => selectChapter(entry.id)}
                    className={`reader-chapter-list-item ${
                      current ? "is-current" : ""
                    }`}
                    aria-current={current ? "page" : undefined}
                  >
                    <span>{String(entry.number).padStart(2, "0")}</span>

                    <span className="min-w-0 flex-1 truncate text-left">
                      {entry.title}
                    </span>

                    {locked && <LockIcon size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          COMMENTS DRAWER
          ========================================================= */}

      {showComments && (
        <div
          className="absolute top-0 right-0 bottom-0 z-[1100] w-full max-w-md flex flex-col shadow-2xl"
          style={{
            background: tc.controlBg,
            color: tc.controlText,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* =====================================================
              COMMENTS HEADER
              ===================================================== */}

          <div
            className="shrink-0 flex items-center justify-between px-5 py-4 border-b"
            style={{
              borderColor: `${tc.controlText}20`,
              paddingTop: "max(env(safe-area-inset-top, 12px), 20px)",
            }}
          >
            <div className="min-w-0">
              <p
                className="text-[9px] uppercase tracking-widest font-bold"
                style={{
                  color: `${tc.controlText}66`,
                }}
              >
                Chapter {chapter.number}
              </p>

              <h2 className="text-base font-bold truncate">Comments</h2>
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation();

                setShowComments(false);
                setReplyingTo(null);
                clearControlsTimer();
                startControlsTimer();
              }}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform"
              style={{
                background: `${tc.controlText}10`,
                color: tc.controlText,
              }}
              aria-label="Close comments"
            >
              ×
            </button>
          </div>

          {/* =====================================================
              COMMENTS LIST
              ===================================================== */}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {/* Loading */}
            {commentsLoading && (
              <div
                className="py-10 text-center text-sm"
                style={{
                  color: `${tc.controlText}70`,
                }}
              >
                Loading comments…
              </div>
            )}

            {/* Error */}
            {!commentsLoading && commentsError && (
              <div
                className="py-10 text-center"
                style={{
                  color: `${tc.controlText}70`,
                }}
              >
                <MessageSquare size={28} className="mx-auto mb-3 opacity-50" />

                <p className="text-sm font-semibold">Unable to load comments</p>

                <p className="text-xs mt-1 text-red-400">{commentsError}</p>
              </div>
            )}

            {/* Empty */}
            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div
                className="py-12 text-center"
                style={{
                  color: `${tc.controlText}70`,
                }}
              >
                <MessageSquare size={28} className="mx-auto mb-3 opacity-50" />

                <p className="text-sm font-semibold">No comments yet</p>

                <p className="text-xs mt-1">
                  Be the first to share your thoughts.
                </p>
              </div>
            )}

            {/* ===================================================
                COMMENT TREE
                =================================================== */}

            {!commentsLoading && !commentsError && comments.length > 0 && (
              <div className="space-y-4">
                {comments.map((comment) => renderComment(comment))}
              </div>
            )}
          </div>

          {/* =====================================================
              COMMENT COMPOSER
              ===================================================== */}

          <div
            className="shrink-0 p-4 border-t"
            style={{
              borderColor: `${tc.controlText}20`,
              background: tc.controlBg,
              paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
            }}
          >
            {isLoggedIn ? (
              <>
                {/* =================================================
                    REPLYING TO BANNER
                    ================================================= */}

                {replyingTo && (
                  <div
                    className="mb-2 flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                    style={{
                      background: `${tc.controlText}08`,
                      border: `1px solid ${tc.controlText}12`,
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[9px] uppercase tracking-widest font-bold"
                        style={{
                          color: `${tc.controlText}50`,
                        }}
                      >
                        Replying to
                      </p>

                      <p
                        className="mt-0.5 text-xs font-semibold truncate"
                        style={{
                          color: tc.controlText,
                        }}
                      >
                        {replyingTo.author.displayName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCancelReply();
                      }}
                      className="shrink-0 text-xs font-bold px-2 py-1 rounded-md active:scale-95"
                      style={{
                        color: "#e8a84c",
                      }}
                      aria-label="Cancel reply"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <p
                  className="text-[10px] uppercase tracking-widest font-bold mb-2"
                  style={{
                    color: `${tc.controlText}70`,
                  }}
                >
                  {replyingTo ? "Write your reply" : "Join the conversation"}
                </p>

                <div
                  className="relative rounded-xl overflow-visible"
                  style={{
                    background: `${tc.controlText}08`,
                    border: `1px solid ${tc.controlText}20`,
                  }}
                >
                  {/* =================================================
                      GIF PICKER
                      ================================================= */}

                  {showGifPicker && (
                    <GiphyPicker
                      onSelect={(gif) => {
                        setSelectedGif(gif);
                        setShowGifPicker(false);
                        setShowEmojiPicker(false);
                        clearControlsTimer();
                      }}
                      onClose={() => {
                        setShowGifPicker(false);
                        startControlsTimer();
                      }}
                      background={tc.controlBg}
                      textColor={tc.controlText}
                    />
                  )}

                  {/* =================================================
                      EMOJI PICKER
                      ================================================= */}

                  {showEmojiPicker && (
                    <div
                      className="absolute bottom-full right-0 mb-2 z-[1200]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setCommentText(
                            (current) => current + emojiData.emoji,
                          );
                          clearControlsTimer();
                        }}
                        width={300}
                        height={360}
                        previewConfig={{
                          showPreview: false,
                        }}
                        searchDisabled={false}
                      />
                    </div>
                  )}

                  {/* =================================================
                      SELECTED GIF PREVIEW
                      ================================================= */}

                  {selectedGif && (
                    <div
                      className="relative mx-3 mt-3 overflow-hidden rounded-xl"
                      style={{
                        background: `${tc.controlText}08`,
                      }}
                    >
                      <img
                        src={selectedGif.url}
                        alt={selectedGif.title || "Selected GIF"}
                        className="block max-h-48 w-full object-contain"
                      />

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedGif(null);
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold backdrop-blur-sm"
                        style={{
                          background: `${tc.controlBg}dd`,
                          color: tc.controlText,
                        }}
                        aria-label="Remove selected GIF"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* =================================================
                      TEXT AREA
                      ================================================= */}

                  <textarea
                    ref={commentTextareaRef}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    onFocus={() => {
                      clearControlsTimer();
                    }}
                    placeholder={
                      replyingTo
                        ? `Reply to ${replyingTo.author.displayName}…`
                        : "Share your thoughts about this chapter…"
                    }
                    maxLength={2000}
                    rows={3}
                    className="w-full resize-none bg-transparent px-3 py-3 text-sm outline-none"
                    style={{
                      color: tc.controlText,
                    }}
                    aria-label={
                      replyingTo ? "Write a reply" : "Write a comment"
                    }
                  />

                  {/* =================================================
                      COMPOSER ACTIONS
                      ================================================= */}

                  <div
                    className="flex items-center justify-between px-3 py-2 border-t"
                    style={{
                      borderColor: `${tc.controlText}12`,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {/* Emoji */}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setShowEmojiPicker((visible) => !visible);
                          setShowGifPicker(false);
                          clearControlsTimer();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition-transform active:scale-90"
                        style={{
                          background: showEmojiPicker
                            ? `${tc.controlText}15`
                            : "transparent",
                        }}
                        aria-label="Add emoji"
                        title="Add emoji"
                      >
                        😊
                      </button>

                      {/* GIF */}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setShowGifPicker((visible) => !visible);
                          setShowEmojiPicker(false);
                          clearControlsTimer();
                        }}
                        className="flex h-8 items-center justify-center rounded-lg px-2 text-[10px] font-black tracking-wide transition-transform active:scale-90"
                        style={{
                          background: showGifPicker
                            ? `${tc.controlText}15`
                            : "transparent",
                          color: tc.controlText,
                        }}
                        aria-label="Add GIF"
                        title="Add GIF"
                      >
                        GIF
                      </button>

                      <span
                        className="ml-1 text-[10px]"
                        style={{
                          color: `${tc.controlText}45`,
                        }}
                      >
                        {commentText.length}/2000
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleSubmitComment();
                      }}
                      disabled={
                        commentSubmitting ||
                        (!commentText.trim() && !selectedGif)
                      }
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-transform disabled:opacity-40 active:scale-95"
                      style={{
                        background: "#e8a84c",
                        color: "#2C1A0A",
                      }}
                    >
                      {commentSubmitting
                        ? "Posting…"
                        : replyingTo
                          ? "Post reply"
                          : "Post comment"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /*
               * =================================================
               * GUEST COMPOSER
               * =================================================
               */

              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: `${tc.controlText}08`,
                  border: `1px solid ${tc.controlText}12`,
                }}
              >
                <MessageSquare size={20} className="mx-auto mb-2 opacity-60" />

                <p className="text-xs font-semibold">Join the conversation</p>

                <p
                  className="text-[11px] mt-1 leading-relaxed"
                  style={{
                    color: `${tc.controlText}60`,
                  }}
                >
                  Sign in to share your thoughts about this chapter.
                </p>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("auth");
                  }}
                  className="mt-3 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                  style={{
                    background: "#e8a84c",
                    color: "#2C1A0A",
                  }}
                >
                  Sign in to comment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          READER CONTENT
          ========================================================= */}

      <div
        className="reader-horizontal-shell"
        ref={readerShellRef}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? 0;

          touchStartY.current = event.touches[0]?.clientY ?? 0;
        }}
        onScroll={scheduleProgressSave}
        onTouchEnd={(event) => {
          const deltaX =
            (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;

          const deltaY =
            (event.changedTouches[0]?.clientY ?? 0) - touchStartY.current;

          handleSwipe(deltaX, deltaY);
        }}
        role="region"
        aria-label={`Reader for ${chapter.title}`}
        tabIndex={0}
      >
        <div className="reader-horizontal-track">
          <article className="reader-chapter-column">
            <div className="reader-chapter-meta">
              <p
                className="text-[10px] uppercase tracking-[0.35em] font-bold"
                style={{
                  color: tc.muted,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Chapter {chapter.number}
              </p>

              <h1
                className="font-display text-3xl font-semibold leading-tight"
                style={{
                  color: tc.text,
                  marginTop: 10,
                }}
              >
                {chapter.title}
              </h1>

              <p
                className="mt-3 text-xs"
                style={{
                  color: tc.muted,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {book.author}
              </p>

              <p
                className="mt-2 text-[10px]"
                style={{
                  color: `${tc.muted}b3`,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {chapter.readingTime} min read ·{" "}
                {chapter.wordCount.toLocaleString()} words ·{" "}
                {chapter.publishedAt}
              </p>

              <div
                className="mx-auto my-4 h-px w-12"
                style={{
                  background: `${tc.text}25`,
                }}
              />
            </div>

            <ChapterContent
              content={chapter.content || "This chapter is empty."}
              className="reader-copy"
              style={{
                fontFamily: fontFamilies[fontFamily].css,
                fontSize,
                lineHeight: 1.9,
                color: tc.text,
              }}
            />

            {book.chapters[chapterIndex + 1] && (
              <div className="reader-end-of-chapter">
                <div
                  className="reader-divider"
                  style={{
                    background: `${tc.text}18`,
                  }}
                />

                <p
                  className="text-[10px] uppercase tracking-[0.3em] font-bold"
                  style={{
                    color: tc.muted,
                  }}
                >
                  End of chapter
                </p>

                <h2
                  className="font-display text-2xl font-semibold leading-tight"
                  style={{
                    color: tc.text,
                    marginTop: 10,
                  }}
                >
                  {book.chapters[chapterIndex + 1].title}
                </h2>

                <button
                  onClick={() => goToChapter("next")}
                  className="reader-continue-button"
                  style={{
                    background: "#e8a84c",
                    color: "#0d0b18",
                  }}
                  aria-label={`Continue reading chapter ${
                    book.chapters[chapterIndex + 1].number
                  }: ${book.chapters[chapterIndex + 1].title}`}
                >
                  Continue Reading
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </article>
        </div>
      </div>

      {/* =========================================================
          BOTTOM CONTROLS
          ========================================================= */}

      <div
        className="absolute bottom-0 left-0 right-0 z-[1000] transition-all duration-200"
        onClick={(event) => {
          event.stopPropagation();

          if (!showSettings && !showComments && !showChapterList) {
            scheduleControlsHide();
          }
        }}
        style={{
          opacity: showControls ? 1 : 0,
          visibility: showControls ? "visible" : "hidden",
          pointerEvents: showControls ? "auto" : "none",
          transform: showControls ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <div
          className="px-5 pt-4"
          style={{
            background: `linear-gradient(to top, ${tc.controlBg}, transparent)`,
            paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
          }}
        >
          <div className="mb-3">
            <div
              className="h-px rounded-full overflow-hidden mb-1.5"
              style={{
                background: `${tc.text}15`,
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${chapterProgress}%`,
                  background: "#e8a84c",
                }}
              />
            </div>

            <div className="flex justify-between">
              <span
                className="text-[10px]"
                style={{
                  color: `${tc.controlText}55`,
                }}
              >
                Ch. {chapter.number} / {book.chapters.length}
              </span>

              <span
                className="text-[10px]"
                style={{
                  color: `${tc.controlText}55`,
                }}
              >
                {chapterProgress}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => goToChapter("prev")}
              disabled={chapterIndex === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-25"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: tc.controlText,
              }}
              aria-label="Go to previous chapter"
            >
              <ChevronLeft size={12} />
              Prev
            </button>

            <div className="text-center">
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{
                  color: "#e8a84c",
                }}
              >
                Chapter {chapter.number}
              </p>

              <p
                className="text-[9px]"
                style={{
                  color: `${tc.controlText}50`,
                }}
              >
                {chapterIndex + 1} of {book.chapters.length}
              </p>
            </div>

            <button
              onClick={() => goToChapter("next")}
              disabled={chapterIndex === book.chapters.length - 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-25"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: tc.controlText,
              }}
              aria-label="Go to next chapter"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
