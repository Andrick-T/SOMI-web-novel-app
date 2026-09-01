import { useState } from "react";
import { BookOpen, Download, Heart, CheckCircle } from "lucide-react";
import BookCard from "../components/BookCard";
import { books } from "../data/books";
import type { CommonProps } from "../types";

type Tab = "reading" | "favorites" | "completed" | "downloads";

const readingProgress: Record<string, number> = {
  "midnight-throne": 68,
  "sins-of-father": 32,
  "baobab-kingdom": 15,
};

export default function LibraryPage({ navigate, isLoggedIn, libraryBooks }: CommonProps) {
  const [tab, setTab] = useState<Tab>("reading");

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-8 text-center gap-5" style={{ background: "#0d0b18" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#1a1726" }}>
          <BookOpen size={36} color="#8b7ea8" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: "#f0ece4" }}>Your Library</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8b7ea8" }}>
            Sign in to save books, track your reading progress, and access your personal collection.
          </p>
        </div>
        <button
          onClick={() => navigate("auth")}
          className="w-full h-12 rounded-xl font-bold text-sm"
          style={{ background: "#e8a84c", color: "#0d0b18" }}
        >
          Sign In to SOMI
        </button>
        <button
          onClick={() => navigate("discover")}
          className="text-sm"
          style={{ color: "#8b7ea8" }}
        >
          Browse without account
        </button>
      </div>
    );
  }

  const savedBooks = libraryBooks.length > 0
    ? books.filter(b => libraryBooks.includes(b.id))
    : books.slice(0, 3);

  const readingBooks = books.filter(b => readingProgress[b.id] !== undefined);
  const completedBooks = books.filter(b => b.status === "COMPLETED").slice(0, 2);
  const favBooks = savedBooks.slice(0, 4);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "reading", label: "Reading", icon: <BookOpen size={14} />, count: readingBooks.length },
    { id: "favorites", label: "Saved", icon: <Heart size={14} />, count: favBooks.length },
    { id: "completed", label: "Done", icon: <CheckCircle size={14} />, count: completedBooks.length },
    { id: "downloads", label: "Offline", icon: <Download size={14} />, count: 1 },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>My Library</h1>
        <p className="text-sm mt-1" style={{ color: "#8b7ea8" }}>Your reading collection</p>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{
              background: tab === t.id ? "#e8a84c" : "#1a1726",
              color: tab === t.id ? "#0d0b18" : "#8b7ea8",
              border: tab === t.id ? "none" : "1px solid #2e2945",
            }}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  background: tab === t.id ? "rgba(13,11,24,0.2)" : "#231f35",
                  color: tab === t.id ? "#0d0b18" : "#8b7ea8",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        {tab === "reading" && (
          <div className="flex flex-col gap-3">
            {readingBooks.map(book => (
              <button
                key={book.id}
                onClick={() => navigate("book", book.id)}
                className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-transform"
                style={{ background: "#1a1726", border: "1px solid #2e2945" }}
              >
                <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 52, height: 78 }}>
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#f0ece4" }}>{book.title}</p>
                  <p className="text-xs mb-2" style={{ color: "#8b7ea8" }}>{book.author}</p>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#2e2945" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${readingProgress[book.id]}%`, background: "linear-gradient(90deg, #e8a84c, #c4882e)" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px]" style={{ color: "#8b7ea8" }}>Ch. {Math.ceil(readingProgress[book.id] / 14)}</span>
                    <span className="text-[10px] font-bold" style={{ color: "#e8a84c" }}>{readingProgress[book.id]}%</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("reader", book.id, book.chapters[0].id); }}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#e8a84c" }}
                >
                  <BookOpen size={14} color="#0d0b18" />
                </button>
              </button>
            ))}
          </div>
        )}

        {tab === "favorites" && (
          favBooks.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Heart size={36} color="#2e2945" />
              <p className="font-display text-base" style={{ color: "#8b7ea8" }}>No saved books yet</p>
              <p className="text-sm" style={{ color: "#8b7ea8" }}>Tap the bookmark icon on any book</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {favBooks.map(book => (
                <BookCard key={book.id} book={book} navigate={navigate} size="sm" />
              ))}
            </div>
          )
        )}

        {tab === "completed" && (
          <div className="flex flex-col gap-3">
            {completedBooks.map(book => (
              <button
                key={book.id}
                onClick={() => navigate("book", book.id)}
                className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98]"
                style={{ background: "#1a1726", border: "1px solid #2e2945" }}
              >
                <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 52, height: 78 }}>
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: "#f0ece4" }}>{book.title}</p>
                  <p className="text-xs" style={{ color: "#8b7ea8" }}>{book.author}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle size={11} color="#3ecf8e" />
                    <span className="text-[10px]" style={{ color: "#3ecf8e" }}>Completed · {book.totalChapters} chapters</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "downloads" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("book", books[0].id)}
              className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98]"
              style={{ background: "#1a1726", border: "1px solid #2e2945" }}
            >
              <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 52, height: 78 }}>
                <img src={books[0].cover} alt={books[0].title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: "#f0ece4" }}>{books[0].title}</p>
                <p className="text-xs" style={{ color: "#8b7ea8" }}>{books[0].author}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Download size={11} color="#e8a84c" />
                  <span className="text-[10px]" style={{ color: "#e8a84c" }}>3 chapters offline</span>
                </div>
              </div>
            </button>
            <div className="rounded-xl p-4 mt-3 text-center" style={{ background: "#1a1726", border: "1px dashed #2e2945" }}>
              <p className="text-sm" style={{ color: "#8b7ea8" }}>Download chapters while online to read without internet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
