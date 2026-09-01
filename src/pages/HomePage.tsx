import { useState } from "react";
import { Search, Bell, ChevronRight, Star, Eye, Flame, Bookmark, TrendingUp } from "lucide-react";
import BookCard from "../components/BookCard";
import { books, genres, popularBooks, recentlyUpdated, featuredBook } from "../data/books";
import type { CommonProps } from "../types";

const genreIcons: Record<string, string> = {
  "Fantasy": "◈",
  "Adventure": "◆",
  "Children's": "◇",
  "African Culture": "◉",
  "Thriller": "▲",
  "Family Saga": "◎",
  "Historical": "○",
  "Romance": "◇",
};

export default function HomePage({ navigate, isLoggedIn, libraryBooks }: CommonProps) {
  const [activeGenre, setActiveGenre] = useState<string>("All");
  const featured = featuredBook;

  const filteredBooks = activeGenre === "All"
    ? books
    : books.filter(b => b.genres.includes(activeGenre as never));

  const readingProgress = [
    { book: books[2], progress: 68 },
    { book: books[4], progress: 32 },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Top Bar — mobile only (TopNav handles desktop) */}
      <div className="md:hidden flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold gold-shimmer">SOMI</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#8b7ea8" }}>
            {isLoggedIn ? "Welcome back, Kemi" : "Discover African stories"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "#1a1726" }}
            onClick={() => navigate("discover")}
          >
            <Search size={16} color="#8b7ea8" />
          </button>
          {isLoggedIn && (
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center relative active:scale-90"
              style={{ background: "#1a1726" }}
            >
              <Bell size={16} color="#8b7ea8" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2" style={{ background: "#c9603a", borderColor: "#0d0b18" }} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop header — shown on md+ when TopNav is present */}
      <div className="hidden md:flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h2 className="font-display text-3xl font-bold" style={{ color: "#f0ece4" }}>
            {isLoggedIn ? "Welcome back, Kemi" : "Stories that move you"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "#8b7ea8" }}>
            Discover African literature — fantasy, thrillers, family sagas and more
          </p>
        </div>
      </div>

      {/* ── HERO FEATURED BOOK ───────────────────────────── */}
      <div className="px-4 md:px-8 mb-8">
        <button
          className="relative w-full rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
          style={{ height: "min(52vw, 340px)", minHeight: 200, background: "#1a1726" }}
          onClick={() => navigate("book", featured.id)}
        >
          <img
            src={featured.heroImage}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(105deg, rgba(13,11,24,0.94) 0%, rgba(13,11,24,0.6) 50%, transparent 100%)" }}
          />

          <div className="absolute top-4 left-4 md:top-6 md:left-6">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.35)" }}
            >
              <Flame size={10} color="#e8a84c" />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#e8a84c" }}>
                Editor's Pick
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-20 md:bottom-6 md:left-6 md:right-40">
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {featured.genres.slice(0, 2).map(g => (
                <span
                  key={g}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(240,236,228,0.8)" }}
                >
                  {g}
                </span>
              ))}
            </div>
            <h2 className="font-display text-xl md:text-3xl font-bold leading-tight" style={{ color: "#f0ece4" }}>
              {featured.title}
            </h2>
            <p className="text-xs md:text-sm mt-1" style={{ color: "rgba(240,236,228,0.6)" }}>{featured.author}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star size={10} fill="#e8a84c" color="#e8a84c" />
                <span className="text-[11px] font-bold" style={{ color: "#e8a84c" }}>{featured.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={10} color="#8b7ea8" />
                <span className="text-[11px]" style={{ color: "#8b7ea8" }}>{(featured.views / 1000).toFixed(0)}k reads</span>
              </div>
              <span className="text-[11px]" style={{ color: "#8b7ea8" }}>{featured.totalChapters} chapters</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col gap-2">
            <div
              className="px-4 py-2.5 rounded-xl text-[12px] font-bold"
              style={{ background: "#e8a84c", color: "#0d0b18" }}
            >
              Read Free
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Bookmark size={14} color="#f0ece4" />
            </button>
          </div>
        </button>
      </div>

      {/* ── CONTINUE READING ─────────────────────────────── */}
      {isLoggedIn && (
        <div className="mb-8">
          <div className="flex items-center justify-between px-4 md:px-8 mb-3">
            <h3 className="font-display text-lg font-semibold" style={{ color: "#f0ece4" }}>Continue Reading</h3>
            <button className="flex items-center gap-1" onClick={() => navigate("library")}>
              <span className="text-xs" style={{ color: "#8b7ea8" }}>Library</span>
              <ChevronRight size={13} color="#8b7ea8" />
            </button>
          </div>
          <div className="flex gap-4 px-4 md:px-8 overflow-x-auto pb-1">
            {readingProgress.map(({ book, progress }) => (
              <BookCard key={book.id} book={book} navigate={navigate} size="md" showProgress progress={progress} />
            ))}
          </div>
        </div>
      )}

      {/* ── GENRE FILTER ─────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex gap-2 px-4 md:px-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveGenre("All")}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
            style={{
              background: activeGenre === "All" ? "#e8a84c" : "#1a1726",
              color: activeGenre === "All" ? "#0d0b18" : "#8b7ea8",
              border: activeGenre === "All" ? "none" : "1px solid #2e2945",
            }}
          >
            All
          </button>
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: activeGenre === g ? "#e8a84c" : "#1a1726",
                color: activeGenre === g ? "#0d0b18" : "#8b7ea8",
                border: activeGenre === g ? "none" : "1px solid #2e2945",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── POPULAR STORIES ──────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between px-4 md:px-8 mb-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2" style={{ color: "#f0ece4" }}>
            <Flame size={15} color="#c9603a" />
            Trending Now
          </h3>
          <button className="flex items-center gap-1" onClick={() => navigate("discover")}>
            <span className="text-xs" style={{ color: "#8b7ea8" }}>See all</span>
            <ChevronRight size={13} color="#8b7ea8" />
          </button>
        </div>
        <div className="flex gap-4 px-4 md:px-8 overflow-x-auto pb-1">
          {popularBooks.slice(0, 8).map(book => (
            <BookCard key={book.id} book={book} navigate={navigate} size="md" />
          ))}
        </div>
      </div>

      {/* ── RECENTLY UPDATED ─────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between px-4 md:px-8 mb-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2" style={{ color: "#f0ece4" }}>
            <TrendingUp size={14} color="#8b7ea8" />
            New Chapters
          </h3>
          <button className="flex items-center gap-1" onClick={() => navigate("discover")}>
            <span className="text-xs" style={{ color: "#8b7ea8" }}>See all</span>
            <ChevronRight size={13} color="#8b7ea8" />
          </button>
        </div>
        <div className="flex gap-3 px-4 md:px-8 overflow-x-auto pb-1">
          {recentlyUpdated.slice(0, 6).map(book => (
            <BookCard key={book.id} book={book} navigate={navigate} size="sm" />
          ))}
        </div>
      </div>

      {/* ── GENRE BROWSE ─────────────────────────────────── */}
      {activeGenre === "All" && (
        <div className="px-4 md:px-8 mb-8">
          <h3 className="font-display text-lg font-semibold mb-4" style={{ color: "#f0ece4" }}>Browse by Genre</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genres.map((g, i) => {
              const bookCount = books.filter(b => b.genres.includes(g as never)).length;
              const colors = [
                ["#3b1d5e", "#6d28d9"],
                ["#5e2d0d", "#c2410c"],
                ["#0e3d3d", "#0f766e"],
                ["#4a1942", "#9333ea"],
                ["#1a2030", "#334155"],
                ["#1a3a1a", "#16a34a"],
                ["#3d2e00", "#ca8a04"],
                ["#3d0e15", "#be123c"],
              ];
              const [from, to] = colors[i % colors.length];
              return (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  className="relative rounded-2xl overflow-hidden px-4 py-5 text-left active:scale-[0.97] transition-transform"
                  style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`, border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-xs font-mono mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {genreIcons[g]}
                  </p>
                  <p className="font-display font-semibold text-sm" style={{ color: "#f0ece4" }}>{g}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {bookCount} {bookCount === 1 ? "story" : "stories"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtered books grid */}
      {activeGenre !== "All" && (
        <div className="px-4 md:px-8 mb-8">
          <h3 className="font-display text-lg font-semibold mb-4" style={{ color: "#f0ece4" }}>
            {activeGenre}
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} navigate={navigate} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Editorial spacer for bottom nav */}
      <div className="h-4" />
    </div>
  );
}
