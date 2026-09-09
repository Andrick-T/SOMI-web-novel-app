import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChapterContent from "../components/reader/ChapterContent";
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
  Smile,
  Sun,
  ThumbsUp,
  Heart,
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
import type { Book } from "../services/repositories";
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
  icon: React.ReactNode;
}

const themes: Record<Theme, ThemeConfig> = {
  light: {
    surfaceCls: "reader-surface-light",
    text: "#2C1A0A",
    muted: "#8A6840",
    controlBg: "rgba(44,26,10,0.88)",
    controlText: "#F6F1E4",
    name: "Paper",
    icon: <Sun size={13} />,
  },
  sepia: {
    surfaceCls: "reader-surface-sepia",
    text: "#4A2A06",
    muted: "#7A5828",
    controlBg: "rgba(74,42,6,0.9)",
    controlText: "#EDD9A3",
    name: "Sepia",
    icon: <Coffee size={13} />,
  },
  dark: {
    surfaceCls: "reader-surface-dark",
    text: "#E8E0CC",
    muted: "#9A8E78",
    controlBg: "rgba(18,15,10,0.92)",
    controlText: "#E8E0CC",
    name: "Night",
    icon: <Moon size={13} />,
  },
};

const fontFamilies: Record<FontFamily, { css: string; name: string }> = {
  lora: { css: "'Lora', Georgia, serif", name: "Lora" },
  fraunces: { css: "'Fraunces', Georgia, serif", name: "Fraunces" },
  nunito: { css: "'Nunito', system-ui, sans-serif", name: "Nunito" },
};

const reactions = [
  { icon: <Heart size={18} />, label: "Love", count: 842 },
  { icon: <Zap size={18} />, label: "Shocked", count: 213 },
  { icon: <Smile size={18} />, label: "Happy", count: 176 },
  { icon: <ThumbsUp size={18} />, label: "Great", count: 421 },
];

export default function ReaderPage({
  book,
  chapterId,
  navigate,
  isLoggedIn,
  unlockedChapters,
  coins,
  unlockChapter,
}: Props) {
  if (!book || !book.chapters.length) {
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

  const chapterIndex = book.chapters.findIndex(
    (chapter) => chapter.id === chapterId,
  );
  const chapter = book.chapters[chapterIndex] ?? book.chapters[0];
  const nextChapter = book.chapters[chapterIndex + 1];
  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [fontFamily, setFontFamily] = useState<FontFamily>("lora");
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [screenState, setScreenState] = useState<"reading" | "locked">(
    "reading",
  );
  const [currentTime, setCurrentTime] = useState("");
  const [battery, setBattery] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const controlsTimer = useRef<number | null>(null);
  const readerShellRef = useRef<HTMLDivElement>(null);
  const progressTimer = useRef<number | null>(null);
  const tc = themes[theme];

  useEffect(() => {
    const preferences = readerPreferencesStorage.get();
    setTheme(preferences.theme as Theme);
    setFontFamily(preferences.fontFamily as FontFamily);
    setFontSize(
      ({ small: 14, medium: 16, large: 18, xlarge: 20 } as const)[
        preferences.fontSize
      ],
    );
  }, []);

  useEffect(() => {
    readerPreferencesStorage.save({
      theme: theme as ReaderTheme,
      fontFamily: fontFamily as ReaderFontFamily,
      fontSize: (
        { 14: "small", 16: "medium", 18: "large", 20: "xlarge" } as const
      )[fontSize],
    });
  }, [fontFamily, fontSize, theme]);

  const chapterProgress = getChapterProgress(
    chapterIndex,
    book.chapters.length,
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    };

    updateTime();
    const interval = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("getBattery" in navigator) {
      (
        navigator as typeof navigator & {
          getBattery: () => Promise<{ level: number }>;
        }
      )
        .getBattery()
        .then((level) => setBattery(Math.round(level.level * 100)));
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    void hydrateReadingProgress(book.id)
      .then((entry) => {
        if (entry?.position !== undefined && readerShellRef.current) {
          readerShellRef.current.scrollTop = entry.position;
        }
      })
      .catch(() => undefined);
  }, [book.id, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    persistReadingProgress({
      userId: "authenticated-user",
      bookId: book.id,
      chapterId: chapter.id,
      page: chapter.number,
      totalPages: book.chapters.length,
      progressPercentage: chapterProgress,
      lastReadAt: new Date().toISOString(),
    });
  }, [
    book.id,
    book.chapters.length,
    chapter.id,
    chapter.number,
    chapterProgress,
    isLoggedIn,
  ]);

  const scheduleProgressSave = () => {
    if (!isLoggedIn) return;
    if (progressTimer.current) window.clearTimeout(progressTimer.current);
    progressTimer.current = window.setTimeout(() => {
      persistReadingProgress({
        userId: "authenticated-user",
        bookId: book.id,
        chapterId: chapter.id,
        page: chapter.number,
        totalPages: book.chapters.length,
        progressPercentage: Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((readerShellRef.current?.scrollTop ?? 0) /
                Math.max(
                  1,
                  (readerShellRef.current?.scrollHeight ?? 1) -
                    (readerShellRef.current?.clientHeight ?? 0),
                )) *
                100,
            ),
          ),
        ),
        position: readerShellRef.current?.scrollTop ?? 0,
        lastReadAt: new Date().toISOString(),
      });
    }, 800);
  };

  const resetControlsTimer = useCallback(() => {
    if (controlsTimer.current) {
      window.clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = window.setTimeout(() => {
      setShowControls(false);
      setShowSettings(false);
    }, 4500);
  }, []);

  const goToChapter = (direction: "next" | "prev") => {
    const navigation = resolveChapterNavigation(
      chapterIndex,
      book.chapters.length,
      direction,
    );

    if (!navigation) {
      return;
    }

    const nextChapterEntry = book.chapters[navigation.targetIndex];

    if (
      nextChapterEntry.accessType === "PREMIUM" &&
      !unlockedChapters.includes(nextChapterEntry.id)
    ) {
      if (!isLoggedIn) {
        navigate("auth");
        return;
      }
      navigate("reader", book.id, nextChapterEntry.id);
      setScreenState("locked");
      return;
    }

    navigate("reader", book.id, nextChapterEntry.id);
  };

  const selectChapter = (targetChapterId: string) => {
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
    setShowChapterList(false);
    navigate("reader", book.id, targetChapter.id);
  };

  const handleUnlock = async () => {
    if (coins >= chapter.price) {
      await unlockChapter(chapter.id, chapter.price);
      setScreenState("reading");
      return;
    }
    navigate("wallet");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToChapter("next");
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToChapter("prev");
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (showChapterList || showSettings) {
        setShowChapterList(false);
        setShowSettings(false);
      } else {
        navigate("book", book.id);
      }
    }
  };

  const handleSwipe = (dx: number, dy: number) => {
    if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy)) return;
    goToChapter(dx < 0 ? "next" : "prev");
  };

  const isChapterLocked =
    chapter.accessType === "PREMIUM" && !unlockedChapters.includes(chapter.id);

  useLayoutEffect(() => {
    const readerShell = readerShellRef.current;
    if (!readerShell || isChapterLocked || screenState === "locked") return;

    readerShell.scrollTop = 0;
    readerShell.scrollLeft = 0;
  }, [chapter.id, isChapterLocked, screenState]);

  if (isChapterLocked || screenState === "locked") {
    return (
      <div
        className="flex flex-col overflow-hidden select-none"
        style={{ width: "100vw", height: "100dvh", background: "#0d0b18" }}
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
              style={{ color: coins >= chapter.price ? "#3ecf8e" : "#c9603a" }}
            >
              {coins.toLocaleString()} coins
            </span>
          </div>

          <button
            onClick={handleUnlock}
            className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: "#e8a84c", color: "#0d0b18" }}
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
      style={{ width: "100vw", height: "100dvh" }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 transition-opacity duration-300"
        style={{
          opacity: showControls ? 0 : 0.7,
          pointerEvents: "none",
          paddingTop: "max(env(safe-area-inset-top, 12px), 18px)",
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
              style={{ color: tc.text, fontFamily: "'Nunito', sans-serif" }}
            >
              {battery}%
            </span>
            <div
              className="relative flex items-center"
              style={{ width: 22, height: 11 }}
            >
              <div
                className="w-full h-full rounded-sm"
                style={{ border: `1px solid ${tc.text}50` }}
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
                style={{ width: 3, height: 6, background: `${tc.text}45` }}
              />
            </div>
          </div>
        )}
      </div>

      <div
        className="absolute top-0 left-0 right-0 z-30 transition-all duration-250"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transform: showControls ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 pb-4"
          style={{
            background: `linear-gradient(to bottom, ${tc.controlBg}f0, ${tc.controlBg}aa, transparent)`,
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
                style={{ color: `${tc.controlText}70` }}
              >
                Ch.{chapter.number} · {chapter.title}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowSettings((state) => !state);
                setShowChapterList(false);
                resetControlsTimer();
              }}
              className="active:scale-90"
              aria-label="Open reader settings"
            >
              <Settings size={18} color={tc.controlText} />
            </button>
            <button
              onClick={() => {
                setShowChapterList((state) => !state);
                setShowSettings(false);
                resetControlsTimer();
              }}
              className="active:scale-90"
              aria-label="Open chapter list"
            >
              <List size={18} color={tc.controlText} />
            </button>
            <button className="active:scale-90" aria-label="Bookmark chapter">
              <Bookmark size={18} color={tc.controlText} />
            </button>
            <button className="active:scale-90" aria-label="Open reader notes">
              <MessageSquare size={18} color={tc.controlText} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="px-5 py-4" style={{ background: tc.controlBg }}>
            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-2"
              style={{ color: `${tc.controlText}55` }}
            >
              Theme
            </p>
            <div className="flex gap-2 mb-4">
              {(["light", "sepia", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95"
                  style={{
                    background:
                      t === "light"
                        ? "#F2ECD6"
                        : t === "sepia"
                          ? "#E8D4A2"
                          : "#1E1A12",
                    color:
                      t === "light"
                        ? "#2C1A0A"
                        : t === "sepia"
                          ? "#4A2A06"
                          : "#E8E0CC",
                    border:
                      theme === t
                        ? "2px solid #e8a84c"
                        : "2px solid transparent",
                  }}
                >
                  {themes[t].icon} {themes[t].name}
                </button>
              ))}
            </div>
            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-2"
              style={{ color: `${tc.controlText}55` }}
            >
              Font
            </p>
            <div className="flex gap-2 mb-4">
              {(["lora", "fraunces", "nunito"] as FontFamily[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className="flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    fontFamily: fontFamilies[f].css,
                    background:
                      fontFamily === f
                        ? "rgba(232,168,76,0.2)"
                        : "rgba(255,255,255,0.06)",
                    color: tc.controlText,
                    border:
                      fontFamily === f
                        ? "1px solid rgba(232,168,76,0.5)"
                        : "1px solid transparent",
                  }}
                >
                  {fontFamilies[f].name}
                </button>
              ))}
            </div>
            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-2"
              style={{ color: `${tc.controlText}55` }}
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
              >
                A
              </button>
              <div className="flex-1 flex gap-1">
                {([14, 16, 18, 20] as FontSize[]).map((size) => (
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
              >
                A
              </button>
            </div>
          </div>
        )}

        {showChapterList && (
          <div className="reader-chapter-drawer" aria-label="Chapter list">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-[9px] uppercase tracking-[0.24em] font-bold"
                  style={{ color: `${tc.controlText}55` }}
                >
                  Contents
                </p>
                <p
                  className="font-display text-lg font-semibold"
                  style={{ color: tc.controlText }}
                >
                  {book.title}
                </p>
              </div>
              <span
                className="text-[10px]"
                style={{ color: `${tc.controlText}70` }}
              >
                {book.chapters.length} chapters
              </span>
            </div>
            <div className="reader-chapter-list mt-3">
              {book.chapters.map((entry) => {
                const locked =
                  entry.accessType === "PREMIUM" &&
                  !unlockedChapters.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    onClick={() => selectChapter(entry.id)}
                    className={`reader-chapter-list-item ${entry.id === chapter.id ? "is-current" : ""}`}
                    aria-current={entry.id === chapter.id ? "page" : undefined}
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

      <div
        className="reader-horizontal-shell"
        ref={readerShellRef}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button, a")) {
            return;
          }
          setShowControls((value) => !value);
          setShowSettings(false);
          resetControlsTimer();
        }}
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
                style={{ color: tc.muted, fontFamily: "'Nunito', sans-serif" }}
              >
                Chapter {chapter.number}
              </p>
              <h1
                className="font-display text-3xl font-semibold leading-tight"
                style={{ color: tc.text, marginTop: 10 }}
              >
                {chapter.title}
              </h1>
              <p
                className="mt-3 text-xs"
                style={{ color: tc.muted, fontFamily: "'Nunito', sans-serif" }}
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
                style={{ background: `${tc.text}25` }}
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

            {nextChapter && (
              <div className="reader-end-of-chapter">
                <div
                  className="reader-divider"
                  style={{ background: `${tc.text}18` }}
                />
                <p
                  className="text-[10px] uppercase tracking-[0.3em] font-bold"
                  style={{ color: tc.muted }}
                >
                  End of chapter
                </p>
                <h2
                  className="font-display text-2xl font-semibold leading-tight"
                  style={{ color: tc.text, marginTop: 10 }}
                >
                  {nextChapter.title}
                </h2>
                <button
                  onClick={() => goToChapter("next")}
                  className="reader-continue-button"
                  style={{ background: "#e8a84c", color: "#0d0b18" }}
                  aria-label={`Continue reading chapter ${nextChapter.number}: ${nextChapter.title}`}
                >
                  Continue Reading
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </article>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-30 transition-all duration-250"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transform: showControls ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <div
          className="px-5 pb-safe pt-4"
          style={{
            background: `linear-gradient(to top, ${tc.controlBg}f0, ${tc.controlBg}aa, transparent)`,
            paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
          }}
        >
          <div className="mb-3">
            <div
              className="h-px rounded-full overflow-hidden mb-1.5"
              style={{ background: `${tc.text}15` }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${chapterProgress}%`, background: "#e8a84c" }}
              />
            </div>
            <div className="flex justify-between">
              <span
                className="text-[10px]"
                style={{ color: `${tc.controlText}55` }}
              >
                Ch. {chapter.number} / {book.chapters.length}
              </span>
              <span
                className="text-[10px]"
                style={{ color: `${tc.controlText}55` }}
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
              <ChevronLeft size={12} /> Prev
            </button>
            <div className="text-center">
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "#e8a84c" }}
              >
                Chapter {chapter.number}
              </p>
              <p
                className="text-[9px]"
                style={{ color: `${tc.controlText}50` }}
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
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
