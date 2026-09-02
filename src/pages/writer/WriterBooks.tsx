import { useMemo, useState } from "react";
import {
  BookOpen,
  PenLine,
  MoreVertical,
  Plus,
  ChevronRight,
  Lock as LockIcon,
  Eye,
  Search,
  X,
} from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import { statusToneFor } from "../../config/designSystem";
import { EmptyState, StatusBadge } from "../../components/DesignPrimitives";

type StatusFilter =
  | "all"
  | "DRAFT"
  | "EDITING"
  | "PROOFREADING"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "ARCHIVED";

export default function WriterBooks({ navigate }: CommonProps) {
  const books = writerRepository.getWriterBooks();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      books.filter((book) => {
        const matchesFilter = filter === "all" || book.status === filter;
        const search = query.trim().toLowerCase();
        const matchesQuery =
          !search ||
          `${book.title} ${book.genres.join(" ")}`
            .toLowerCase()
            .includes(search);
        return matchesFilter && matchesQuery;
      }),
    [books, filter, query],
  );

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-background)" }}
    >
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-widest font-bold mb-0.5"
            style={{ color: "var(--color-accent-primary)" }}
          >
            Writer Studio
          </p>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            My books
          </h1>
        </div>
        <button
          onClick={() => navigate("writer-create")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{
            background: "var(--color-accent-primary)",
            color: "var(--color-background)",
          }}
        >
          <Plus size={14} /> New Book
        </button>
      </div>

      <div
        className="mx-5 mb-3 flex h-10 items-center gap-3 rounded-xl border px-3"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border-default)",
        }}
      >
        <Search size={15} style={{ color: "var(--color-text-muted)" }} />
        <input
          aria-label="Search your books"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your books..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-muted)]"
          style={{ color: "var(--color-text-primary)" }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear book search"
          >
            <X size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>
        )}
      </div>

      <div className="flex gap-2 px-5 mb-5 overflow-x-auto">
        {(
          [
            "all",
            "DRAFT",
            "EDITING",
            "READY_FOR_REVIEW",
            "SCHEDULED",
            "PUBLISHED",
          ] as StatusFilter[]
        ).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
            style={{
              background:
                filter === s
                  ? "var(--color-accent-primary)"
                  : "var(--color-surface)",
              color:
                filter === s
                  ? "var(--color-background)"
                  : "var(--color-text-muted)",
              border:
                filter === s ? "none" : "1px solid var(--color-border-default)",
            }}
          >
            {s === "all"
              ? "All"
              : s
                  .replace("_", " ")
                  .replace(/([A-Z])/g, " $1")
                  .trim()}
          </button>
        ))}
      </div>

      <div className="px-5 flex flex-col gap-4 pb-8">
        {filtered.length === 0 ? (
          <EmptyState
            title={
              books.length === 0
                ? "No books yet"
                : "No books match these filters"
            }
            description={
              books.length === 0
                ? "Create your first SOMI story to begin writing."
                : "Try a different search or clear the current filter."
            }
            action={
              <button
                type="button"
                className="somi-primary-button"
                onClick={() =>
                  books.length === 0
                    ? navigate("writer-create")
                    : (setFilter("all"), setQuery(""))
                }
              >
                {books.length === 0 ? "Create a book" : "Clear filters"}
              </button>
            }
          />
        ) : (
          filtered.map((book) => {
            const chapterCount = book.chapters.length;
            const readers = Math.max(120, chapterCount * 220);
            const unlocks = Math.max(80, chapterCount * 180);
            return (
              <div
                key={book.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <div className="flex gap-3 p-4">
                  <div
                    className="rounded-xl overflow-hidden flex-shrink-0"
                    style={{ width: 64, height: 96 }}
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="font-display font-semibold text-sm leading-tight"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {book.title}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {book.genres.join(" • ")}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === book.id ? null : book.id)
                        }
                        className="flex-shrink-0 p-1"
                      >
                        <MoreVertical
                          size={16}
                          color="var(--color-text-muted)"
                        />
                      </button>
                    </div>

                    <div className="mt-2">
                      <StatusBadge
                        label={book.status.replaceAll("_", " ")}
                        tone={statusToneFor(book.status)}
                        compact
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        {
                          label: "Chapters",
                          value: chapterCount,
                          icon: <BookOpen size={9} />,
                        },
                        {
                          label: "Readers",
                          value:
                            readers >= 1000
                              ? `${(readers / 1000).toFixed(1)}k`
                              : readers,
                          icon: <Eye size={9} />,
                        },
                        {
                          label: "Unlocks",
                          value:
                            unlocks >= 1000
                              ? `${(unlocks / 1000).toFixed(1)}k`
                              : unlocks,
                          icon: <LockIcon size={9} />,
                        },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center">
                          <div
                            className="flex items-center justify-center gap-0.5 mb-0.5"
                            style={{ color: "#4a6540" }}
                          >
                            {stat.icon}
                            <span className="text-[9px]">{stat.label}</span>
                          </div>
                          <p
                            className="text-sm font-bold"
                            style={{ color: "#f0ece4" }}
                          >
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] mt-2" style={{ color: "#4a6540" }}>
                      Updated {book.updatedAt.slice(0, 10)}
                    </p>
                  </div>
                </div>

                {menuOpen === book.id && (
                  <div
                    className="mx-4 mb-3 rounded-xl overflow-hidden"
                    style={{ background: "#2a3525" }}
                  >
                    {[
                      {
                        label: "Add chapter",
                        icon: <PenLine size={13} />,
                        action: () => {
                          const newChapter = writerRepository.createChapter(
                            book.id,
                            { title: `Chapter ${book.chapters.length + 1}` },
                          );
                          navigate("writer-editor", book.id, newChapter.id);
                          setMenuOpen(null);
                        },
                      },
                      {
                        label: "Open book",
                        icon: <Eye size={13} />,
                        action: () => {
                          navigate(
                            "writer-editor",
                            book.id,
                            book.chapters[0]?.id ?? "",
                          );
                          setMenuOpen(null);
                        },
                      },
                      {
                        label: "Analytics",
                        icon: <ChevronRight size={13} />,
                        action: () => {
                          navigate("writer-analytics");
                          setMenuOpen(null);
                        },
                      },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm active:bg-black/10"
                        style={{
                          color: "#f0ece4",
                          borderBottom:
                            i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        }}
                      >
                        <span style={{ color: "#4ade80" }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className="flex border-t"
                  style={{ borderColor: "#2a3525" }}
                >
                  <button
                    onClick={() =>
                      navigate(
                        "writer-editor",
                        book.id,
                        book.chapters[0]?.id ?? "",
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold active:bg-white/5"
                    style={{ color: "#4ade80" }}
                  >
                    <PenLine size={13} /> Write
                  </button>
                  <div style={{ width: 1, background: "#2a3525" }} />
                  <button
                    onClick={() => navigate("writer-analytics")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold active:bg-white/5"
                    style={{ color: "#a8c0a0" }}
                  >
                    <Eye size={13} /> Stats
                  </button>
                </div>
              </div>
            );
          })
        )}

        <button
          onClick={() => navigate("writer-create")}
          className="flex items-center justify-center gap-3 p-5 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: "transparent", border: "2px dashed #2a3525" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#1e2118" }}
          >
            <Plus size={18} color="#4ade80" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>
              Start a new book
            </p>
            <p className="text-xs" style={{ color: "#6a8060" }}>
              Begin your next SOMI story
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
