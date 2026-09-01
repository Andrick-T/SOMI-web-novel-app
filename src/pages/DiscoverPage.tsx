import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import BookCard from "../components/BookCard";
import { books, genres } from "../data/books";
import type { CommonProps } from "../types";

type SortBy = "popular" | "rating" | "new" | "updated";
type FilterStatus = "all" | "ONGOING" | "COMPLETED" | "UPCOMING";

export default function DiscoverPage({ navigate }: CommonProps) {
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = books
    .filter(b => {
      if (query && !b.title.toLowerCase().includes(query.toLowerCase()) && !b.author.toLowerCase().includes(query.toLowerCase())) return false;
      if (activeGenre !== "All" && !b.genres.includes(activeGenre as never)) return false;
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.views - a.views;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "new") return b.id.localeCompare(a.id);
      return 0;
    });

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold mb-4" style={{ color: "#f0ece4" }}>Discover</h1>

        {/* Search */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 h-11"
          style={{ background: "#1a1726", border: "1px solid #2e2945" }}
        >
          <Search size={16} color="#8b7ea8" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b7ea8]"
            style={{ color: "#f0ece4" }}
            placeholder="Search by title or author..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={14} color="#8b7ea8" />
            </button>
          )}
        </div>
      </div>

      {/* Genre pills */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-3">
        {["All", ...genres].map(g => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
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

      {/* Sort & Filter bar */}
      <div className="flex items-center gap-2 px-5 mb-4">
        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {(["popular", "rating", "new", "updated"] as SortBy[]).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="flex-shrink-0 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: sortBy === s ? "#231f35" : "transparent",
                color: sortBy === s ? "#e8a84c" : "#8b7ea8",
                border: sortBy === s ? "1px solid #2e2945" : "1px solid transparent",
              }}
            >
              {{
                popular: "🔥 Popular",
                rating: "⭐ Top Rated",
                new: "✨ Newest",
                updated: "🔄 Updated",
              }[s]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center"
          style={{
            background: showFilters ? "#231f35" : "#1a1726",
            border: "1px solid #2e2945",
            color: showFilters ? "#e8a84c" : "#8b7ea8",
          }}
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Status filter (expanded) */}
      {showFilters && (
        <div className="flex gap-2 px-5 mb-4">
          {(["all", "ONGOING", "COMPLETED", "UPCOMING", "PAUSED"] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all"
              style={{
                background: filterStatus === s ? "#c9603a" : "#1a1726",
                color: filterStatus === s ? "#f0ece4" : "#8b7ea8",
                border: "1px solid #2e2945",
              }}
            >
              {s === "all" ? "Any Status" : s}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="px-5 mb-3">
        <span className="text-[11px]" style={{ color: "#8b7ea8" }}>
          {filtered.length} {filtered.length === 1 ? "story" : "stories"} found
        </span>
      </div>

      {/* Books grid */}
      <div className="flex-1 px-5 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl">📚</div>
            <p className="font-display text-lg" style={{ color: "#f0ece4" }}>No stories found</p>
            <p className="text-sm text-center" style={{ color: "#8b7ea8" }}>Try a different genre or search term</p>
            <button
              onClick={() => { setQuery(""); setActiveGenre("All"); setFilterStatus("all"); }}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#1a1726", color: "#e8a84c", border: "1px solid #2e2945" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {filtered.map((book, i) => (
              <div key={book.id} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <BookCard book={book} navigate={navigate} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
