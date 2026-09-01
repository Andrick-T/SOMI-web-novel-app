import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { ArrowLeft, Settings, Bookmark, MessageSquare, ChevronLeft, ChevronRight, Sun, Moon, Coffee, Lock, Smile, Heart, Zap, ThumbsUp } from "lucide-react";
import type { Book } from "../data/books";
import type { CommonProps } from "../types";

interface Props extends CommonProps {
  book: Book;
  chapterId: string;
}

type Theme = "light" | "sepia" | "dark";
type FontSize = 14 | 16 | 18 | 20;
type FontFamily = "lora" | "fraunces" | "nunito";

const FLIP_MS = 440;
const CHARS_PER_PAGE = 850;

interface ThemeConfig {
  outerCls: string;
  surfaceCls: string;
  shadowCls: string;
  text: string;
  muted: string;
  controlBg: string;
  controlText: string;
  name: string;
  icon: React.ReactNode;
}

const themes: Record<Theme, ThemeConfig> = {
  light: {
    outerCls: "reader-outer-light",
    surfaceCls: "reader-surface-light",
    shadowCls: "page-shadow-light",
    text: "#2C1A0A",
    muted: "#8A6840",
    controlBg: "rgba(44,26,10,0.88)",
    controlText: "#F6F1E4",
    name: "Paper",
    icon: <Sun size={13} />,
  },
  sepia: {
    outerCls: "reader-outer-sepia",
    surfaceCls: "reader-surface-sepia",
    shadowCls: "page-shadow-sepia",
    text: "#4A2A06",
    muted: "#7A5828",
    controlBg: "rgba(74,42,6,0.9)",
    controlText: "#EDD9A3",
    name: "Sepia",
    icon: <Coffee size={13} />,
  },
  dark: {
    outerCls: "reader-outer-dark",
    surfaceCls: "reader-surface-dark",
    shadowCls: "page-shadow-dark",
    text: "#E8E0CC",
    muted: "#9A8E78",
    controlBg: "rgba(18,15,10,0.92)",
    controlText: "#E8E0CC",
    name: "Night",
    icon: <Moon size={13} />,
  },
};

const fontFamilies: Record<FontFamily, { css: string; name: string }> = {
  lora:    { css: "'Lora', Georgia, serif",    name: "Lora" },
  fraunces:{ css: "'Fraunces', Georgia, serif", name: "Fraunces" },
  nunito:  { css: "'Nunito', system-ui, sans-serif", name: "Nunito" },
};

function splitIntoPages(content: string, charsPerPage: number): string[] {
  if (!content.trim()) return [""];
  const words = content.split(" ");
  const pages: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > charsPerPage && current.length > 0) {
      pages.push(current.trim());
      current = word;
    } else {
      current += (current ? " " : "") + word;
    }
  }
  if (current.trim()) pages.push(current.trim());
  return pages;
}

const reactions = [
  { icon: <Heart size={18} />, label: "Love", count: 842 },
  { icon: <Zap size={18} />, label: "Shocked", count: 213 },
  { icon: <Smile size={18} />, label: "Happy", count: 176 },
  { icon: <ThumbsUp size={18} />, label: "Great", count: 421 },
];

export default function ReaderPage({ book, chapterId, navigate, isLoggedIn, unlockedChapters, coins, unlockChapter }: Props) {
  const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
  const chapter = book.chapters[chapterIndex] ?? book.chapters[0];

  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [fontFamily, setFontFamily] = useState<FontFamily>("lora");
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [displayedIdx, setDisplayedIdx] = useState(0);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [screenState, setScreenState] = useState<"reading" | "chapter-end" | "locked">("reading");
  const [currentTime, setCurrentTime] = useState("");
  const [battery, setBattery] = useState<number | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const touchStartX = useRef(0);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tc = themes[theme];
  const pages = useMemo(() => splitIntoPages(chapter.content, CHARS_PER_PAGE), [chapter.content, fontSize]);
  const totalPages = pages.length;
  const progress = totalPages > 1 ? Math.round((currentPage / (totalPages - 1)) * 100) : 100;

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setCurrentTime(n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as typeof navigator & { getBattery: () => Promise<{ level: number }> })
        .getBattery().then(b => setBattery(Math.round(b.level * 100)));
    }
  }, []);

  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowSettings(false);
    }, 4500);
  };

  const flipPage = useCallback((dir: "next" | "prev") => {
    if (isFlipping || screenState !== "reading") return;
    const nextIdx = currentPage + (dir === "next" ? 1 : -1);

    if (dir === "next" && currentPage === totalPages - 1) {
      setScreenState("chapter-end");
      return;
    }
    if (dir === "prev" && currentPage <= 0) return;

    setFlipDir(dir);
    setIsFlipping(true);
    setPendingIdx(nextIdx);

    setTimeout(() => {
      setCurrentPage(nextIdx);
      setDisplayedIdx(nextIdx);
      setPendingIdx(null);
      setIsFlipping(false);
    }, FLIP_MS);
  }, [isFlipping, currentPage, totalPages, screenState]);

  const goToChapter = (dir: "next" | "prev") => {
    const nextIdx = chapterIndex + (dir === "next" ? 1 : -1);
    if (nextIdx < 0 || nextIdx >= book.chapters.length) return;
    const nextChapter = book.chapters[nextIdx];

    if (nextChapter.accessType === "PREMIUM" && !unlockedChapters.includes(nextChapter.id)) {
      if (!isLoggedIn) {
        navigate("auth");
        return;
      }
      navigate("reader", book.id, nextChapter.id);
      setScreenState("locked");
      setCurrentPage(0);
      setDisplayedIdx(0);
      return;
    }

    navigate("reader", book.id, nextChapter.id);
    setScreenState("reading");
    setCurrentPage(0);
    setDisplayedIdx(0);
  };

  const handleUnlock = () => {
    const ch = book.chapters[chapterIndex];
    if (coins >= ch.price) {
      unlockChapter(ch.id, ch.price);
      setScreenState("reading");
    } else {
      navigate("wallet");
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    if (screenState !== "reading") return;
    const x = e.clientX;
    const w = (e.currentTarget as HTMLElement).offsetWidth;
    if (x < w * 0.22) flipPage("prev");
    else if (x > w * 0.78) flipPage("next");
    else {
      setShowControls(p => !p);
      setShowSettings(false);
      resetControlsTimer();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 55) flipPage(dx < 0 ? "next" : "prev");
  };

  const isChapterLocked = chapter.accessType === "PREMIUM" && !unlockedChapters.includes(chapter.id);

  // ── LOCKED CHAPTER SCREEN ──────────────────────────
  if (isChapterLocked || screenState === "locked") {
    return (
      <div
        className="flex flex-col overflow-hidden select-none"
        style={{ width: "100vw", height: "100dvh", background: "#0d0b18" }}
      >
        {/* Back */}
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

        {/* Blurred chapter teaser — full width, atmospheric */}
        <div
          className="mx-0 flex-shrink-0 relative overflow-hidden"
          style={{ height: 180 }}
        >
          <div
            className="absolute inset-0 px-8 py-6 select-none"
            style={{ filter: "blur(4px)", userSelect: "none", opacity: 0.5 }}
          >
            <p className="font-serif text-sm leading-relaxed" style={{ color: "#f0ece4" }}>
              The door opened before she could knock. Standing in the threshold was someone she had not seen in fifteen years — someone she had been told was dead. The air between them held the weight of all those missing years, pressing against her chest like a physical thing. She opened her mouth to speak and found that all her prepared words had simply evaporated...
            </p>
          </div>
          {/* Gradient fade to lock UI */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 0%, #0d0b18 85%)" }}
          />
          {/* Lock icon centered over blur */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)" }}
            >
              <Lock size={22} color="#e8a84c" />
            </div>
          </div>
        </div>

        {/* Chapter info */}
        <div className="px-8 pt-4 pb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-1" style={{ color: "#8b7ea8" }}>
            Chapter {chapter.number}
          </p>
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: "#f0ece4" }}>
            {chapter.title}
          </h2>
          <p className="text-sm" style={{ color: "#8b7ea8" }}>
            {chapter.readingTime} min · {chapter.wordCount.toLocaleString()} words
          </p>
        </div>

        {/* Unlock UI */}
        <div className="flex-1 flex flex-col justify-end px-8 pb-12">
          <div
            className="flex items-center justify-between py-3 mb-2"
            style={{ borderTop: "1px solid #2e2945", borderBottom: "1px solid #2e2945" }}
          >
            <span className="text-sm" style={{ color: "#8b7ea8" }}>Unlock this chapter</span>
            <span className="font-bold text-base" style={{ color: "#e8a84c" }}>
              {chapter.price} <span className="text-xs font-normal">Somi Coins</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-3 mb-6">
            <span className="text-sm" style={{ color: "#8b7ea8" }}>Your balance</span>
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
            <Lock size={14} />
            {coins >= chapter.price
              ? `Unlock for ${chapter.price} Somi Coins`
              : "Get More Coins"}
          </button>

          {coins < chapter.price && (
            <p className="text-[11px] text-center mt-3" style={{ color: "#8b7ea8" }}>
              You need {(chapter.price - coins).toLocaleString()} more coins · from 100 CFA
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── CHAPTER END SCREEN ─────────────────────────────
  if (screenState === "chapter-end") {
    const nextChapter = book.chapters[chapterIndex + 1];
    const nextIsLocked = nextChapter && nextChapter.accessType === "PREMIUM" && !unlockedChapters.includes(nextChapter.id);

    return (
      <div
        className={`flex flex-col overflow-hidden ${tc.surfaceCls}`}
        style={{ width: "100vw", height: "100dvh" }}
      >
        {/* Minimal header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
          <button onClick={() => navigate("book", book.id)} className="active:scale-90 flex items-center gap-2">
            <ArrowLeft size={18} color={tc.text} />
            <span className="text-xs" style={{ color: tc.muted }}>Back to book</span>
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tc.muted }}>
            End of chapter
          </p>
          <div style={{ width: 80 }} />
        </div>

        {/* Divider */}
        <div className="mx-10 h-px mb-8" style={{ background: `${tc.text}14` }} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8">
          <div className="max-w-[480px] mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: tc.muted }}>
              Chapter {chapter.number}
            </p>
            <h2 className="font-display text-3xl font-bold mb-1 leading-tight" style={{ color: tc.text }}>
              {chapter.title}
            </h2>
            <p className="text-sm mb-8" style={{ color: tc.muted }}>
              {chapter.wordCount.toLocaleString()} words · {chapter.readingTime} min read
            </p>

            {/* Ornamental divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px" style={{ background: `${tc.text}18` }} />
              <span className="font-display text-base" style={{ color: `${tc.muted}80` }}>✦</span>
              <div className="flex-1 h-px" style={{ background: `${tc.text}18` }} />
            </div>

            {/* Author note */}
            <p
              className="text-sm italic leading-[1.8] mb-8"
              style={{ color: tc.text, borderLeft: `2px solid ${tc.muted}30`, paddingLeft: 16 }}
            >
              "Thank you for reading. What do you think will happen next?"
            </p>

            {/* Reactions */}
            <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: tc.muted }}>
              React to this chapter
            </p>
            <div className="flex gap-3 mb-10">
              {reactions.map(r => (
                <button
                  key={r.label}
                  onClick={() => setSelectedReaction(r.label)}
                  className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background: selectedReaction === r.label ? `${tc.text}18` : `${tc.text}06`,
                      border: selectedReaction === r.label ? `1.5px solid ${tc.text}35` : `1.5px solid ${tc.text}10`,
                      color: tc.text,
                    }}
                  >
                    {r.icon}
                  </div>
                  <span className="text-[9px]" style={{ color: tc.muted }}>{r.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Next chapter CTA — anchored to bottom */}
        <div
          className="flex-shrink-0 px-8 py-6"
          style={{ borderTop: `1px solid ${tc.text}0e` }}
        >
          <div className="max-w-[480px] mx-auto">
            {nextChapter ? (
              <>
                <p className="text-[10px] uppercase tracking-widest text-center mb-3" style={{ color: tc.muted }}>
                  Continue reading
                </p>
                <button
                  onClick={() => goToChapter("next")}
                  className="w-full h-13 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                  style={{ background: "#e8a84c", color: "#0d0b18", height: 48 }}
                >
                  {nextIsLocked ? <Lock size={14} /> : <ChevronRight size={14} />}
                  {nextIsLocked
                    ? `Unlock Chapter ${nextChapter.number} · ${nextChapter.price} Coins`
                    : `Chapter ${nextChapter.number}: ${nextChapter.title}`}
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="font-display text-lg font-semibold mb-2" style={{ color: tc.text }}>
                  You've reached the latest chapter
                </p>
                <p className="text-sm mb-4" style={{ color: tc.muted }}>New chapters are added regularly.</p>
                <button
                  onClick={() => navigate("book", book.id)}
                  className="px-8 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: `${tc.text}10`, color: tc.text, border: `1px solid ${tc.text}20` }}
                >
                  Back to Book
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── READING SCREEN ─────────────────────────────────
  return (
    <div
      className={`relative overflow-hidden select-none ${tc.surfaceCls}`}
      style={{ width: "100vw", height: "100dvh" }}
    >
      {/* SOMI status bar — time + battery, NOT OS chrome */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-safe transition-opacity duration-300"
        style={{
          opacity: showControls ? 0 : 0.55,
          pointerEvents: "none",
          paddingTop: "env(safe-area-inset-top, 12px)",
        }}
      >
        <span
          className="text-[11px] font-semibold tabular-nums"
          style={{ color: tc.text, fontFamily: "'Nunito', sans-serif", letterSpacing: "0.04em" }}
        >
          {currentTime}
        </span>
        {battery !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]" style={{ color: tc.text, fontFamily: "'Nunito', sans-serif" }}>
              {battery}%
            </span>
            <div className="relative flex items-center" style={{ width: 22, height: 11 }}>
              <div className="w-full h-full rounded-sm" style={{ border: `1px solid ${tc.text}50` }}>
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${battery}%`,
                    background: battery <= 20 ? "#c9603a" : battery <= 50 ? "#e8a84c" : tc.text,
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

      {/* TOP CONTROLS — revealed on tap */}
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
            paddingTop: "max(env(safe-area-inset-top, 12px), 40px)",
          }}
        >
          <button
            onClick={() => navigate("book", book.id)}
            className="flex items-center gap-2.5 active:scale-90"
          >
            <ArrowLeft size={18} color={tc.controlText} />
            <div>
              <p className="text-[13px] font-bold leading-tight max-w-[160px] truncate" style={{ color: tc.controlText }}>
                {book.title}
              </p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: `${tc.controlText}70` }}>
                Ch.{chapter.number} · {chapter.title}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => { setShowSettings(s => !s); resetControlsTimer(); }} className="active:scale-90">
              <Settings size={18} color={tc.controlText} />
            </button>
            <button className="active:scale-90">
              <Bookmark size={18} color={tc.controlText} />
            </button>
            <button className="active:scale-90">
              <MessageSquare size={18} color={tc.controlText} />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="px-5 py-4" style={{ background: tc.controlBg }}>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: `${tc.controlText}55` }}>
              Theme
            </p>
            <div className="flex gap-2 mb-4">
              {(["light", "sepia", "dark"] as Theme[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: t === "light" ? "#F2ECD6" : t === "sepia" ? "#E8D4A2" : "#1E1A12",
                    color: t === "light" ? "#2C1A0A" : t === "sepia" ? "#4A2A06" : "#E8E0CC",
                    border: theme === t ? "2px solid #e8a84c" : "2px solid transparent",
                  }}
                >
                  {themes[t].icon} {themes[t].name}
                </button>
              ))}
            </div>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: `${tc.controlText}55` }}>
              Font
            </p>
            <div className="flex gap-2 mb-4">
              {(["lora", "fraunces", "nunito"] as FontFamily[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className="flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    fontFamily: fontFamilies[f].css,
                    background: fontFamily === f ? "rgba(232,168,76,0.2)" : "rgba(255,255,255,0.06)",
                    color: tc.controlText,
                    border: fontFamily === f ? "1px solid rgba(232,168,76,0.5)" : "1px solid transparent",
                  }}
                >
                  {fontFamilies[f].name}
                </button>
              ))}
            </div>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: `${tc.controlText}55` }}>
              Size
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(s => Math.max(14, s - 2) as FontSize)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: tc.controlText }}
              >
                A
              </button>
              <div className="flex-1 flex gap-1">
                {([14, 16, 18, 20] as FontSize[]).map(s => (
                  <div
                    key={s}
                    className="flex-1 h-1.5 rounded-full cursor-pointer"
                    onClick={() => setFontSize(s)}
                    style={{ background: fontSize >= s ? "#e8a84c" : "rgba(255,255,255,0.18)" }}
                  />
                ))}
              </div>
              <button
                onClick={() => setFontSize(s => Math.min(20, s + 2) as FontSize)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: tc.controlText }}
              >
                A
              </button>
            </div>
          </div>
        )}
      </div>

      {/* READING CANVAS — full viewport, tap to navigate or reveal controls */}
      <div
        className="absolute inset-0"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* OUTGOING page — fills the full screen */}
        <div
          key={`p-${displayedIdx}`}
          className={`absolute inset-0 ${tc.surfaceCls} ${
            isFlipping ? (flipDir === "next" ? "page-curl-out" : "page-curl-out-prev") : ""
          }`}
        >
          {/* Lift-shadow overlay — bottom darkens as page pulls away */}
          {isFlipping && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: flipDir === "next"
                  ? "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 50%)"
                  : "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 50%)",
              }}
            />
          )}
          <PageContent
            page={pages[displayedIdx]}
            pageNumber={displayedIdx}
            totalPages={totalPages}
            chapter={chapter}
            fontSize={fontSize}
            fontFamily={fontFamilies[fontFamily].css}
            theme={tc}
            isFirst={displayedIdx === 0}
          />
        </div>

        {/* INCOMING page — slides in from behind */}
        {isFlipping && pendingIdx !== null && (
          <div
            key={`p-in-${pendingIdx}`}
            className={`absolute inset-0 ${tc.surfaceCls} ${
              flipDir === "next" ? "page-curl-in" : "page-curl-in-prev"
            }`}
          >
            <PageContent
              page={pages[pendingIdx]}
              pageNumber={pendingIdx}
              totalPages={totalPages}
              chapter={chapter}
              fontSize={fontSize}
              fontFamily={fontFamilies[fontFamily].css}
              theme={tc}
              isFirst={pendingIdx === 0}
            />
          </div>
        )}
      </div>

      {/* Hint — only on very first page, fades after */}
      {!showControls && currentPage === 0 && (
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-1.5 anim-pulse-soft pointer-events-none z-5">
          <ChevronLeft size={10} color={`${tc.text}35`} />
          <span className="text-[9px] tracking-widest uppercase" style={{ color: `${tc.text}35` }}>
            swipe to turn pages
          </span>
          <ChevronRight size={10} color={`${tc.text}35`} />
        </div>
      )}

      {/* BOTTOM CONTROLS — revealed on tap */}
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
          {/* Reading progress bar */}
          <div className="mb-3">
            <div className="h-px rounded-full overflow-hidden mb-1.5" style={{ background: `${tc.text}15` }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "#e8a84c" }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-[10px]" style={{ color: `${tc.controlText}55` }}>
                p.{currentPage + 1} / {totalPages}
              </span>
              <span className="text-[10px]" style={{ color: `${tc.controlText}55` }}>{progress}%</span>
            </div>
          </div>

          {/* Chapter navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => goToChapter("prev")}
              disabled={chapterIndex === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-25"
              style={{ background: "rgba(255,255,255,0.08)", color: tc.controlText }}
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#e8a84c" }}>
                Chapter {chapter.number}
              </p>
              <p className="text-[9px]" style={{ color: `${tc.controlText}50` }}>
                {chapterIndex + 1} of {book.chapters.length}
              </p>
            </div>
            <button
              onClick={() => goToChapter("next")}
              disabled={chapterIndex === book.chapters.length - 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-25"
              style={{ background: "rgba(255,255,255,0.08)", color: tc.controlText }}
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Minimal page counter — always visible, very subtle */}
      <div
        className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none transition-opacity"
        style={{ opacity: showControls ? 0 : 0.25 }}
      >
        <span className="text-[9px]" style={{ color: tc.text, fontFamily: "'Nunito', sans-serif" }}>
          {currentPage + 1} · {totalPages}
        </span>
      </div>
    </div>
  );
}

interface PageContentProps {
  page: string;
  pageNumber: number;
  totalPages: number;
  chapter: { number: number; title: string };
  fontSize: number;
  fontFamily: string;
  theme: ThemeConfig;
  isFirst: boolean;
}

function PageContent({ page, chapter, fontSize, fontFamily, theme, isFirst }: PageContentProps) {
  return (
    <div className="absolute inset-0 flex flex-col px-6 py-6 overflow-hidden">
      {/* Chapter header (first page only) */}
      {isFirst && (
        <div className="text-center mb-6 flex-shrink-0">
          <p
            className="text-[9px] uppercase tracking-[0.35em] font-bold mb-1"
            style={{ color: theme.muted, fontFamily: "'Nunito', sans-serif" }}
          >
            Chapter {chapter.number}
          </p>
          <p
            className="font-display text-base font-semibold leading-snug"
            style={{ color: theme.text, opacity: 0.9 }}
          >
            {chapter.title}
          </p>
          <div className="w-10 h-px mx-auto mt-3" style={{ background: `${theme.text}25` }} />
        </div>
      )}

      {/* Story text */}
      <div className="flex-1 overflow-hidden">
        <p
          className="leading-relaxed"
          style={{
            fontFamily,
            fontSize,
            color: theme.text,
            lineHeight: 1.9,
            whiteSpace: "pre-wrap",
          }}
        >
          {page}
        </p>
      </div>
    </div>
  );
}
