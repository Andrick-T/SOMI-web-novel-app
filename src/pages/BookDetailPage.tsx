import { useState } from "react";
import {
  ArrowLeft, Star, Eye, Heart, BookOpen, Lock, Unlock, ChevronDown, ChevronUp,
  BookmarkPlus, Share2, Clock, FileText
} from "lucide-react";
import { books } from "../data/books";
import type { Book } from "../data/books";
import type { CommonProps } from "../types";

interface Props extends CommonProps {
  book: Book;
}

const statusLabels: Record<string, string> = {
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  UPCOMING: "Coming Soon",
  PAUSED: "On Hold",
};
const statusColors: Record<string, string> = {
  ONGOING: "#3ecf8e",
  COMPLETED: "#8b7ea8",
  UPCOMING: "#e8a84c",
  PAUSED: "#c9603a",
};

export default function BookDetailPage({
  book, navigate, isLoggedIn, libraryBooks, addToLibrary, unlockedChapters, unlockChapter, coins
}: Props) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chapters" | "about" | "similar">("chapters");
  const [showUnlockModal, setShowUnlockModal] = useState<string | null>(null);

  const inLibrary = libraryBooks.includes(book.id);
  const firstChapter = book.chapters[0];

  const handleChapterTap = (chapterId: string, accessType: string, price: number) => {
    if (accessType === "FREE" || unlockedChapters.includes(chapterId)) {
      navigate("reader", book.id, chapterId);
    } else if (!isLoggedIn) {
      navigate("auth");
    } else {
      setShowUnlockModal(chapterId);
    }
  };

  const confirmUnlock = (chapterId: string, price: number) => {
    unlockChapter(chapterId, price);
    setShowUnlockModal(null);
    navigate("reader", book.id, chapterId);
  };

  const unlockChapterData = showUnlockModal
    ? book.chapters.find(c => c.id === showUnlockModal)
    : null;

  return (
    <div className="relative flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Hero */}
      <div className="relative" style={{ height: 280 }}>
        <img
          src={book.heroImage}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(13,11,24,0.3) 0%, rgba(13,11,24,0.85) 60%, #0d0b18 100%)" }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate("home")}
          className="absolute top-12 left-4 w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
          style={{ background: "rgba(13,11,24,0.6)", backdropFilter: "blur(8px)" }}
        >
          <ArrowLeft size={18} color="#f0ece4" />
        </button>

        {/* Share */}
        <button
          className="absolute top-12 right-4 w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
          style={{ background: "rgba(13,11,24,0.6)", backdropFilter: "blur(8px)" }}
        >
          <Share2 size={16} color="#f0ece4" />
        </button>

        {/* Book cover floating */}
        <div className="absolute left-5 bottom-0 translate-y-1/3">
          <div
            className="rounded-xl overflow-hidden book-shadow"
            style={{ width: 100, height: 150, background: "#1a1726" }}
          >
            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Book Info */}
      <div className="px-5 pt-16 pb-4">
        {/* Status + genre row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: `${statusColors[book.status]}22`, color: statusColors[book.status], border: `1px solid ${statusColors[book.status]}44` }}
          >
            {statusLabels[book.status]}
          </span>
          {book.genres.map(g => (
            <span
              key={g}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "#231f35", color: "#8b7ea8" }}
            >
              {g}
            </span>
          ))}
        </div>

        <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: "#f0ece4" }}>
          {book.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8b7ea8" }}>by {book.author}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Star size={13} fill="#e8a84c" color="#e8a84c" />
            <span className="text-sm font-bold" style={{ color: "#e8a84c" }}>{book.rating}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={13} color="#8b7ea8" />
            <span className="text-sm" style={{ color: "#8b7ea8" }}>{(book.views / 1000).toFixed(0)}k reads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={13} color="#8b7ea8" />
            <span className="text-sm" style={{ color: "#8b7ea8" }}>{(book.favorites / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} color="#8b7ea8" />
            <span className="text-sm" style={{ color: "#8b7ea8" }}>{book.totalChapters} ch.</span>
          </div>
        </div>

        {/* Last update */}
        <p className="text-[11px] mt-2" style={{ color: "#8b7ea8" }}>Updated {book.lastUpdate}</p>

        {/* CTA Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => navigate("reader", book.id, firstChapter.id)}
            className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: "#e8a84c", color: "#0d0b18" }}
          >
            <BookOpen size={16} />
            Start Reading
          </button>
          <button
            onClick={() => addToLibrary(book.id)}
            className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: inLibrary ? "#231f35" : "#1a1726",
              border: "1px solid #2e2945",
              color: inLibrary ? "#e8a84c" : "#8b7ea8",
            }}
          >
            {inLibrary ? <BookmarkPlus size={18} fill="#e8a84c" /> : <BookmarkPlus size={18} />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-1 mb-4 border-b" style={{ borderColor: "#2e2945" }}>
        {(["chapters", "about", "similar"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-xs font-semibold capitalize transition-all"
            style={{
              color: activeTab === tab ? "#e8a84c" : "#8b7ea8",
              borderBottom: activeTab === tab ? "2px solid #e8a84c" : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Chapters */}
      {activeTab === "chapters" && (
        <div className="flex-1 px-5 pb-8">
          <div className="flex flex-col gap-2">
            {book.chapters.map((ch, i) => {
              const isOwned = ch.accessType === "FREE" || unlockedChapters.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => handleChapterTap(ch.id, ch.accessType, ch.price)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left active:scale-[0.98] transition-transform"
                  style={{ background: "#1a1726", border: "1px solid #2e2945" }}
                >
                  {/* Chapter number */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-display"
                    style={{
                      background: isOwned ? "rgba(232,168,76,0.15)" : "#231f35",
                      color: isOwned ? "#e8a84c" : "#8b7ea8",
                    }}
                  >
                    {ch.number}
                  </div>

                  {/* Chapter info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isOwned ? "#f0ece4" : "#8b7ea8" }}
                    >
                      {ch.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Clock size={9} color="#8b7ea8" />
                        <span className="text-[9px]" style={{ color: "#8b7ea8" }}>{ch.readingTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText size={9} color="#8b7ea8" />
                        <span className="text-[9px]" style={{ color: "#8b7ea8" }}>{ch.wordCount.toLocaleString()} words</span>
                      </div>
                      <span className="text-[9px]" style={{ color: "#8b7ea8" }}>{ch.publishedAt}</span>
                    </div>
                  </div>

                  {/* Access indicator */}
                  <div className="flex-shrink-0">
                    {ch.accessType === "FREE" ? (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(62,207,142,0.15)", color: "#3ecf8e" }}
                      >
                        FREE
                      </span>
                    ) : isOwned ? (
                      <Unlock size={14} color="#e8a84c" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Lock size={12} color="#8b7ea8" />
                        <span className="text-[10px] font-bold" style={{ color: "#8b7ea8" }}>{ch.price}🪙</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: About */}
      {activeTab === "about" && (
        <div className="flex-1 px-5 pb-8">
          <div className="rounded-xl p-4 mb-4" style={{ background: "#1a1726", border: "1px solid #2e2945" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#c9b8e8" }}>
              {synopsisExpanded ? book.synopsis : `${book.synopsis.slice(0, 180)}${book.synopsis.length > 180 ? "..." : ""}`}
            </p>
            {book.synopsis.length > 180 && (
              <button
                onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                className="flex items-center gap-1 mt-2 text-xs font-semibold"
                style={{ color: "#e8a84c" }}
              >
                {synopsisExpanded ? "Show less" : "Read more"}
                {synopsisExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          {/* Tags */}
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8b7ea8" }}>Tags</h4>
          <div className="flex flex-wrap gap-2 mb-5">
            {book.tags.map(t => (
              <span
                key={t}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#231f35", color: "#8b7ea8", border: "1px solid #2e2945" }}
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Stats card */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Chapters", value: book.totalChapters },
              { label: "Total Views", value: `${(book.views / 1000).toFixed(0)}k` },
              { label: "Favorites", value: `${(book.favorites / 1000).toFixed(1)}k` },
              { label: "Rating", value: `${book.rating}/5.0` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#1a1726", border: "1px solid #2e2945" }}>
                <p className="font-display text-xl font-bold" style={{ color: "#e8a84c" }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#8b7ea8" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Similar */}
      {activeTab === "similar" && (
        <div className="flex-1 px-5 pb-8">
          <div className="grid grid-cols-3 gap-3">
            {books.filter(b => b.id !== book.id && b.genres.some(g => book.genres.includes(g))).map(b => (
              <button key={b.id} onClick={() => navigate("book", b.id)} className="flex flex-col gap-2 active:scale-95 transition-transform">
                <div className="rounded-xl overflow-hidden book-shadow" style={{ height: 130, background: "#1a1726" }}>
                  <img src={b.cover} alt={b.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-semibold leading-tight" style={{ color: "#f0ece4" }}>{b.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && unlockChapterData && (
        <div className="absolute inset-0 flex items-end z-50" style={{ background: "rgba(6,4,15,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="w-full rounded-t-2xl p-6" style={{ background: "#1a1726", border: "1px solid #2e2945" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#2e2945" }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,168,76,0.15)" }}>
                <Lock size={20} color="#e8a84c" />
              </div>
              <div>
                <p className="font-display text-base font-semibold" style={{ color: "#f0ece4" }}>Unlock Chapter</p>
                <p className="text-sm" style={{ color: "#8b7ea8" }}>{unlockChapterData.title}</p>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ background: "#231f35" }}>
              <span className="text-sm" style={{ color: "#8b7ea8" }}>Cost</span>
              <span className="font-bold" style={{ color: "#e8a84c" }}>{unlockChapterData.price} Somi Coins</span>
            </div>

            <div className="rounded-xl p-3 mb-5 flex items-center justify-between" style={{ background: "#231f35" }}>
              <span className="text-sm" style={{ color: "#8b7ea8" }}>Your balance</span>
              <span className="font-bold" style={{ color: coins >= unlockChapterData.price ? "#3ecf8e" : "#c9603a" }}>
                {coins} Somi Coins
              </span>
            </div>

            {coins < unlockChapterData.price ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center" style={{ color: "#8b7ea8" }}>Not enough coins.</p>
                <button
                  onClick={() => { setShowUnlockModal(null); navigate("wallet"); }}
                  className="w-full h-12 rounded-xl font-bold text-sm"
                  style={{ background: "#e8a84c", color: "#0d0b18" }}
                >
                  Buy Somi Coins
                </button>
                <button onClick={() => setShowUnlockModal(null)} className="w-full h-10 text-sm" style={{ color: "#8b7ea8" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnlockModal(null)}
                  className="flex-1 h-12 rounded-xl text-sm font-semibold"
                  style={{ background: "#231f35", color: "#8b7ea8" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmUnlock(showUnlockModal, unlockChapterData.price)}
                  className="flex-1 h-12 rounded-xl font-bold text-sm"
                  style={{ background: "#e8a84c", color: "#0d0b18" }}
                >
                  Unlock Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
