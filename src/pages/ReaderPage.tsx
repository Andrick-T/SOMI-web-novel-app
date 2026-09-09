import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import ChapterContent from "../components/reader/ChapterContent";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Heart,
  List,
  Lock as LockIcon,
  MessageSquare,
  Moon,
  Settings,
  Smile,
  Sun,
  ThumbsUp,
  Zap,
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
  const [screenState, setScreenState] = useState<"reading" | "locked">(
    "reading",
  );

  const [currentTime, setCurrentTime] = useState("");
  const [battery, setBattery] = useState<number | null>(null);

  const readerShellRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const tc = themes[theme];

  const clearControlsTimer = useCallback(() => {
    if (controlsTimer.current !== null) {
      window.clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsTimer();

    controlsTimer.current = window.setTimeout(() => {
      setShowControls(false);
      setShowSettings(false);
      setShowChapterList(false);
      controlsTimer.current = null;
    }, 8000);
  }, [clearControlsTimer]);

  const closePanels = useCallback(() => {
    setShowSettings(false);
    setShowChapterList(false);
    setShowComments(false);
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls((visible) => {
      const nextVisible = !visible;

      if (!nextVisible) {
        closePanels();
        clearControlsTimer();
      } else {
        scheduleControlsHide();
      }

      return nextVisible;
    });
  }, [clearControlsTimer, closePanels, scheduleControlsHide]);

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

  useEffect(() => {
    if (!("getBattery" in navigator)) return;

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
        if (!manager) return;

        batteryManager = manager;
        updateBattery();
        manager.addEventListener("levelchange", updateBattery);
      })
      .catch(() => undefined);

    return () => {
      batteryManager?.removeEventListener("levelchange", updateBattery);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearControlsTimer();

      if (progressTimer.current !== null) {
        window.clearTimeout(progressTimer.current);
      }
    };
  }, [clearControlsTimer]);

  const chapterProgress = getChapterProgress(
    Math.max(0, chapterIndex),
    book?.chapters?.length ?? 0,
  );

  useEffect(() => {
    if (!book || !isLoggedIn) return;

    void hydrateReadingProgress(book.id)
      .then((entry) => {
        if (entry?.position !== undefined && readerShellRef.current) {
          readerShellRef.current.scrollTop = entry.position;
        }
      })
      .catch(() => undefined);
  }, [book, isLoggedIn]);

  useEffect(() => {
    if (!book || !chapter || !isLoggedIn) return;

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

  useEffect(() => {
    if (!showComments || !chapter) return;

    let cancelled = false;

    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError(null);

      try {
        const result = await apiCommentsRepository.list(book.id, chapter.id);

        if (!cancelled) {
          setComments(result);
        }
      } catch {
        if (!cancelled) {
          setCommentsError("Unable to load comments. Please try again.");
        }
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
  }, [book.id, chapter?.id, showComments]);

  const scheduleProgressSave = useCallback(() => {
    if (!isLoggedIn || !book || !chapter) return;

    if (progressTimer.current !== null) {
      window.clearTimeout(progressTimer.current);
    }

    progressTimer.current = window.setTimeout(() => {
      const shell = readerShellRef.current;

      if (!shell) return;

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

  const goToChapter = useCallback(
    (direction: "next" | "prev") => {
      if (!book || chapterIndex < 0) return;

      const navigation = resolveChapterNavigation(
        chapterIndex,
        book.chapters.length,
        direction,
      );

      if (!navigation) return;

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
      if (!book) return;

      const targetChapter = book.chapters.find(
        (entry) => entry.id === targetChapterId,
      );

      if (!targetChapter) return;

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

  const handleUnlock = useCallback(async () => {
    if (!chapter) return;

    if (coins >= chapter.price) {
      await unlockChapter(chapter.id, chapter.price);
      setScreenState("reading");
      return;
    }

    navigate("wallet");
  }, [chapter, coins, navigate, unlockChapter]);

  const handleSubmitComment = useCallback(async () => {
    if (!chapter) return;

    const content = commentText.trim();

    if (!content || commentSubmitting) {
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
      );

      setComments((current) => [comment, ...current]);
      setCommentText("");
    } catch {
      setCommentsError("Unable to post your comment. Please try again.");
    } finally {
      setCommentSubmitting(false);
    }
  }, [book.id, chapter, commentText, commentSubmitting, isLoggedIn, navigate]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!chapter) return;

      try {
        await apiCommentsRepository.remove(book.id, chapter.id, commentId);

        setComments((current) =>
          current.filter((comment) => comment.id !== commentId),
        );
      } catch {
        setCommentsError("Unable to delete the comment. Please try again.");
      }
    },
    [book.id, chapter],
  );

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

  const handleSwipe = useCallback(
    (dx: number, dy: number) => {
      if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }

      goToChapter(dx < 0 ? "next" : "prev");
    },
    [goToChapter],
  );

  const isChapterLocked =
    chapter?.accessType === "PREMIUM" && !unlockedChapters.includes(chapter.id);

  useLayoutEffect(() => {
    const shell = readerShellRef.current;

    if (!shell || isChapterLocked || screenState === "locked") {
      return;
    }

    shell.scrollTop = 0;
    shell.scrollLeft = 0;
  }, [chapter?.id, isChapterLocked, screenState]);

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
            <span className="text-sm" style={{ color: "#8b7ea8" }}>
              {book.title}
            </span>
          </button>
        </div>

        <div className="px-8 pt-4 pb-6 text-center">
          <p
            className="text-[10px] uppercase tracking-[0.3em] font-bold mb-1"
            style={{ color: "#8b7ea8" }}
          >
            Chapter {chapter.number}
          </p>

          <h2
            className="font-display text-2xl font-bold mb-1"
            style={{ color: "#f0ece4" }}
          >
            {chapter.title}
          </h2>

          <p className="text-sm" style={{ color: "#8b7ea8" }}>
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
            <span className="text-sm" style={{ color: "#8b7ea8" }}>
              Unlock this chapter
            </span>

            <span className="font-bold text-base" style={{ color: "#e8a84c" }}>
              {chapter.price}{" "}
              <span className="text-xs font-normal">Somi Coins</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-3 mb-6">
            <span className="text-sm" style={{ color: "#8b7ea8" }}>
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
          scheduleControlsHide();
          return;
        }

        toggleControls();
      }}
      tabIndex={0}
    >
      {/* Status */}
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

      {/* Top controls */}
      <div
        className="absolute top-0 left-0 right-0 z-[1000] transition-all duration-200"
        onClick={(event) => {
          event.stopPropagation();
          scheduleControlsHide();
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
          <button
            onClick={() => navigate("book", book.id)}
            className="flex items-center gap-2.5 active:scale-90"
          >
            <ArrowLeft size={18} color={tc.controlText} />

            <div>
              <p
                className="text-[13px] font-bold leading-tight max-w-[160px] truncate"
                style={{ color: tc.controlText }}
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
            <button
              onClick={(event) => {
                event.stopPropagation();
                setShowChapterList(false);
                setShowSettings((value) => !value);
                scheduleControlsHide();
              }}
              className="active:scale-90"
              aria-label="Open reader settings"
            >
              <Settings size={18} color={tc.controlText} />
            </button>

            <button
              onClick={(event) => {
                event.stopPropagation();
                setShowSettings(false);
                setShowChapterList((value) => !value);
                scheduleControlsHide();
              }}
              className="active:scale-90"
              aria-label="Open chapter list"
            >
              <List size={18} color={tc.controlText} />
            </button>

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

            <button
              onClick={(event) => {
                event.stopPropagation();

                if (!isLoggedIn) {
                  navigate("auth");
                  return;
                }

                setShowSettings(false);
                setShowChapterList(false);
                setShowComments(true);
                scheduleControlsHide();
              }}
              className="active:scale-90 transition-transform"
              aria-label="Open chapter comments"
              title="Comments"
            >
              <MessageSquare size={18} color={tc.controlText} />
            </button>
          </div>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="px-5 py-4" style={{ background: tc.controlBg }}>
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
                  onClick={() => setTheme(value)}
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
                  onClick={() => setFontFamily(value)}
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
                onClick={() =>
                  setFontSize((size) => Math.max(14, size - 2) as FontSize)
                }
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
                    onClick={() => setFontSize(size)}
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
                onClick={() =>
                  setFontSize((size) => Math.min(20, size + 2) as FontSize)
                }
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

        {showComments && (
          <div
            className="absolute inset-y-0 right-0 z-[1100] w-full max-w-md flex flex-col shadow-2xl"
            style={{
              background: tc.controlBg,
              color: tc.controlText,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{
                borderColor: `${tc.controlText}20`,
              }}
            >
              <div>
                <p
                  className="text-[9px] uppercase tracking-widest font-bold"
                  style={{ color: `${tc.controlText}66` }}
                >
                  Chapter {chapter.number}
                </p>

                <h2 className="text-base font-bold">Comments</h2>
              </div>

              <button
                onClick={() => {
                  setShowComments(false);
                  scheduleControlsHide();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                style={{
                  background: `${tc.controlText}10`,
                }}
                aria-label="Close comments"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {commentsLoading && (
                <div
                  className="py-10 text-center text-sm"
                  style={{ color: `${tc.controlText}70` }}
                >
                  Loading comments…
                </div>
              )}

              {!commentsLoading && comments.length === 0 && (
                <div
                  className="py-12 text-center"
                  style={{ color: `${tc.controlText}70` }}
                >
                  <MessageSquare
                    size={28}
                    className="mx-auto mb-3 opacity-50"
                  />

                  <p className="text-sm font-semibold">No comments yet</p>

                  <p className="text-xs mt-1">
                    Be the first to share your thoughts.
                  </p>
                </div>
              )}

              {!commentsLoading && comments.length > 0 && (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-xl p-3"
                      style={{
                        background: `${tc.controlText}08`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold">
                            {comment.author.displayName}
                          </p>

                          <p
                            className="text-[10px] mt-0.5"
                            style={{
                              color: `${tc.controlText}55`,
                            }}
                          >
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {comment.author.id ===
                          // Replace with the authenticated user's ID
                          // if it is available through your auth state.
                          "" && (
                          <button
                            className="text-[10px]"
                            style={{
                              color: `${tc.controlText}66`,
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <p
                        className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                        style={{
                          color: tc.controlText,
                        }}
                      >
                        {comment.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              {commentsError && (
                <p className="mt-4 text-xs text-red-400">{commentsError}</p>
              )}
            </div>

            <div
              className="p-4 border-t"
              style={{
                borderColor: `${tc.controlText}20`,
              }}
            >
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment…"
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  background: `${tc.controlText}0D`,
                  color: tc.controlText,
                  border: `1px solid ${tc.controlText}18`,
                }}
              />

              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-[10px]"
                  style={{
                    color: `${tc.controlText}45`,
                  }}
                >
                  {commentText.length}/2000
                </span>

                <button
                  onClick={() => void handleSubmitComment()}
                  disabled={commentSubmitting || !commentText.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40 active:scale-95"
                  style={{
                    background: "#e8a84c",
                    color: "#2C1A0A",
                  }}
                >
                  {commentSubmitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chapter list */}
        {showChapterList && (
          <div className="reader-chapter-drawer" aria-label="Chapter list">
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

      {/* Reader content */}
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

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1000] transition-all duration-200"
        onClick={(event) => {
          event.stopPropagation();
          scheduleControlsHide();
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
