import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import BookCard from "../components/BookCard";
import { bookRepository } from "../services/repositories";
import type { CommonProps } from "../types";

type SortBy = "popular" | "rating" | "new" | "updated";
type FilterStatus = "all" | "ONGOING" | "COMPLETED" | "UPCOMING";

export default function DiscoverPage({ navigate }: CommonProps) {
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const books = bookRepository.getBooks();
  const genres = useMemo(
    () => bookRepository.getGenres().filter((genre) => genre !== "All"),
    [],
  );

  const filtered = books
    .filter((book) => {
      const matchesQuery =
        !query ||
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase());
      const matchesGenre =
        activeGenre === "All" || book.genres.includes(activeGenre as never);
      const matchesStatus =
        filterStatus === "all" || book.status === filterStatus;
      return matchesQuery && matchesGenre && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.views - a.views;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "new") return b.id.localeCompare(a.id);
      return b.lastUpdate.localeCompare(a.lastUpdate);
    });

  return (
    <div className="flex min-h-full flex-col" style={{ background: "#0d0b18" }}>
      <div className="px-5 pb-4 pt-12">
        <h1 className="mb-4 font-display text-2xl font-bold text-[#f0ece4]">
          Discover
        </h1>

        <div
          className="flex h-11 items-center gap-3 rounded-xl px-4"
          style={{ background: "#1a1726", border: "1px solid #2e2945" }}
        >
          <Search size={16} color="#8b7ea8" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b7ea8]"
            style={{ color: "#f0ece4" }}
            placeholder="Search by title or author..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search stories"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} color="#8b7ea8" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-3">
        {["All", ...genres].map((genre) => (
          <button
            key={genre}
            onClick={() => setActiveGenre(genre)}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
            style={{
              background: activeGenre === genre ? "#e8a84c" : "#1a1726",
              color: activeGenre === genre ? "#0d0b18" : "#8b7ea8",
              border: activeGenre === genre ? "none" : "1px solid #2e2945",
            }}
          >
            {genre}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2 px-5">
        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          {(["popular", "rating", "new", "updated"] as SortBy[]).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className="flex-shrink-0 rounded-lg px-3 py-1 text-[11px] font-semibold transition-all"
              style={{
                background: sortBy === sort ? "#231f35" : "transparent",
                color: sortBy === sort ? "#e8a84c" : "#8b7ea8",
                border:
                  sortBy === sort
                    ? "1px solid #2e2945"
                    : "1px solid transparent",
              }}
            >
              {
                {
                  popular: "🔥 Popular",
                  rating: "⭐ Top Rated",
                  new: "✨ Newest",
                  updated: "🔄 Updated",
                }[sort]
              }
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters((value) => !value)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            background: showFilters ? "#231f35" : "#1a1726",
            border: "1px solid #2e2945",
            color: showFilters ? "#e8a84c" : "#8b7ea8",
          }}
          aria-label="Open filters"
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 flex gap-2 px-5">
          {(
            [
              "all",
              "ONGOING",
              "COMPLETED",
              "UPCOMING",
              "PAUSED",
            ] as FilterStatus[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className="flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-all"
              style={{
                background: filterStatus === status ? "#c9603a" : "#1a1726",
                color: filterStatus === status ? "#f0ece4" : "#8b7ea8",
                border: "1px solid #2e2945",
              }}
            >
              {status === "all" ? "Any Status" : status}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 px-5">
        <span className="text-[11px]" style={{ color: "#8b7ea8" }}>
          {filtered.length} {filtered.length === 1 ? "story" : "stories"} found
        </span>
      </div>

      <div className="flex-1 px-5 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="text-4xl">📚</div>
            <p className="font-display text-lg text-[#f0ece4]">
              No stories found
            </p>
            <p className="text-center text-sm" style={{ color: "#8b7ea8" }}>
              Try a different genre or search term.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveGenre("All");
                setFilterStatus("all");
              }}
              className="mt-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{
                background: "#1a1726",
                color: "#e8a84c",
                border: "1px solid #2e2945",
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {filtered.map((book, index) => (
              <div
                key={book.id}
                className="anim-fade-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <BookCard book={book} navigate={navigate} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
