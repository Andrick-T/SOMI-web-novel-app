import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Eye,
  Lock as LockIcon,
  MoreVertical,
  PenLine,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import { statusToneFor } from "../../config/designSystem";
import { EmptyState, StatusBadge } from "../../components/DesignPrimitives";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";

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

type BookAnalytics = {
  bookId: string;
  views: number;
  readers: number;
  unlocks: number;
};

const visibleStatusFilters: StatusFilter[] = [
  "all",
  "DRAFT",
  "EDITING",
  "READY_FOR_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
];

const formatStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatMetric = (value: number | undefined) => {
  if (value === undefined) {
    return "—";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
};

export default function WriterBooks({ navigate }: CommonProps) {
  const [books, setBooks] = useState(() =>
    useApiWriterContent ? [] : writerRepository.getWriterBooks(),
  );

  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<BookAnalytics[]>([]);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  /*
   * Load the writer's books and the real book-level analytics.
   */
  useEffect(() => {
    if (!useApiWriterContent) {
      return;
    }

    let cancelled = false;

    Promise.all([
      apiWriterRepository.getWriterBooks(),
      apiWriterRepository.getBookAnalytics(),
    ])
      .then(([writerBooks, analyticsResult]) => {
        if (cancelled) {
          return;
        }

        setBooks(writerBooks);
        setAnalytics(analyticsResult.analytics);
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }

        setLoadError(
          caught instanceof Error ? caught.message : "Unable to load books.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * API covers may point to private writer assets.
   * Resolve those assets through the authenticated repository.
   */
  useEffect(() => {
    if (!useApiWriterContent || books.length === 0) {
      return;
    }

    let cancelled = false;
    const objectUrls: string[] = [];

    const loadDraftCovers = async () => {
      const entries = await Promise.all(
        books
          .filter((book) => book.cover)
          .map(async (book) => {
            const match = book.cover.match(
              /\/writer\/assets\/([^/]+)\/public$/,
            );

            if (!match) {
              return null;
            }

            try {
              const url = await apiWriterRepository.getPrivateAssetBlobUrl(
                match[1],
              );

              objectUrls.push(url);

              return {
                bookId: book.id,
                url,
              };
            } catch {
              return null;
            }
          }),
      );

      if (cancelled) {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      const nextUrls: Record<string, string> = {};

      for (const entry of entries) {
        if (entry) {
          nextUrls[entry.bookId] = entry.url;
        }
      }

      setCoverUrls(nextUrls);
    };

    void loadDraftCovers();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [books]);

  const filteredBooks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return books.filter((book) => {
      const matchesFilter = filter === "all" || book.status === filter;

      const searchableText = [book.title, ...book.genres, ...book.tags]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !search || searchableText.includes(search);

      return matchesFilter && matchesQuery;
    });
  }, [books, filter, query]);

  const createChapter = async (bookId: string, chapterCount: number) => {
    try {
      const nextChapterNumber = chapterCount + 1;

      const newChapter = useApiWriterContent
        ? await apiWriterRepository.createChapter(bookId, {
            title: `Chapter ${nextChapterNumber}`,
            number: nextChapterNumber,
            content: "Begin your chapter here.",
          })
        : writerRepository.createChapter(bookId, {
            title: `Chapter ${nextChapterNumber}`,
          });

      setMenuOpen(null);

      navigate("writer-editor", bookId, newChapter.id);
    } catch (caught) {
      setLoadError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the chapter.",
      );

      setMenuOpen(null);
    }
  };

  return (
    <div className="somi-writer-page">
      <div className="somi-writer-inner">
        <header className="somi-writer-header">
          <div>
            <p className="somi-writer-eyebrow">Writer Studio</p>

            <h1 className="somi-writer-title">My books</h1>

            <p className="somi-writer-description">
              Manage your stories, continue writing chapters, and track how
              readers are engaging with your work.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("writer-create")}
            className="somi-writer-primary-action"
          >
            <Plus size={15} />
            New Book
          </button>
        </header>

        <section className="somi-writer-section">
          <div className="somi-writer-books-toolbar">
            <label className="somi-writer-search">
              <Search size={15} />

              <input
                aria-label="Search your books"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your books..."
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear book search"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <nav
              className="somi-writer-filters"
              aria-label="Book status filters"
            >
              {visibleStatusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={
                    filter === status
                      ? "somi-writer-filter somi-writer-filter-active"
                      : "somi-writer-filter"
                  }
                >
                  {status === "all" ? "All" : formatStatus(status)}
                </button>
              ))}
            </nav>
          </div>

          {loadError && (
            <div className="somi-writer-notice">
              <p className="somi-writer-notice-title">Something went wrong</p>

              <p className="somi-writer-notice-text">{loadError}</p>
            </div>
          )}

          {filteredBooks.length === 0 ? (
            <div className="somi-writer-books-empty">
              <BookOpen size={28} color="var(--color-accent-primary)" />

              <h2 className="somi-writer-books-empty-title">
                {books.length === 0
                  ? "No books yet"
                  : "No books match these filters"}
              </h2>

              <p className="somi-writer-books-empty-text">
                {books.length === 0
                  ? "Create your first SOMI story to begin writing."
                  : "Try a different search or clear the current filter."}
              </p>

              <button
                type="button"
                className="somi-writer-primary-action"
                onClick={() => {
                  if (books.length === 0) {
                    navigate("writer-create");
                    return;
                  }

                  setFilter("all");
                  setQuery("");
                }}
              >
                {books.length === 0 ? "Create a book" : "Clear filters"}
              </button>
            </div>
          ) : (
            <div className="somi-writer-books-list">
              {filteredBooks.map((book) => {
                const chapterCount = book.chapters.length;

                const bookAnalytics = analytics.find(
                  (entry) => entry.bookId === book.id,
                );

                /*
                 * API mode uses only real analytics returned by
                 * the backend. No fabricated values are displayed
                 * when analytics are unavailable.
                 */
                const readers = useApiWriterContent
                  ? bookAnalytics?.readers
                  : Math.max(120, chapterCount * 220);

                const unlocks = useApiWriterContent
                  ? bookAnalytics?.unlocks
                  : Math.max(80, chapterCount * 180);

                const cover = useApiWriterContent
                  ? coverUrls[book.id]
                  : book.cover;

                return (
                  <article key={book.id} className="somi-writer-book-row">
                    <div className="somi-writer-book-cover">
                      {cover ? (
                        <img src={cover} alt={`${book.title} cover`} />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{
                            background: "var(--color-surface-muted)",
                            color: "var(--color-text-muted)",
                          }}
                          aria-label={`${book.title} has no cover`}
                        >
                          <BookOpen size={22} />
                        </div>
                      )}
                    </div>

                    <div className="somi-writer-book-main">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="somi-writer-book-title truncate">
                            {book.title}
                          </h2>

                          <div className="somi-writer-book-meta">
                            {book.genres.length > 0
                              ? book.genres.join(" · ")
                              : "No genre assigned"}

                            {book.tags.length > 0 && (
                              <>
                                <span className="somi-writer-book-meta-dot">
                                  ·
                                </span>

                                <span>
                                  {book.tags.length}{" "}
                                  {book.tags.length === 1 ? "tag" : "tags"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="relative flex shrink-0 items-center gap-2">
                          <StatusBadge
                            label={formatStatus(book.status)}
                            tone={statusToneFor(book.status)}
                            compact
                          />

                          <button
                            type="button"
                            className="somi-writer-book-action"
                            aria-label={`More actions for ${book.title}`}
                            aria-expanded={menuOpen === book.id}
                            onClick={() =>
                              setMenuOpen(menuOpen === book.id ? null : book.id)
                            }
                          >
                            <MoreVertical size={16} />
                          </button>

                          {menuOpen === book.id && (
                            <div className="somi-writer-book-menu">
                              <button
                                type="button"
                                onClick={() =>
                                  void createChapter(book.id, chapterCount)
                                }
                              >
                                <PenLine size={14} />
                                Add chapter
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(null);

                                  navigate(
                                    "writer-editor",
                                    book.id,
                                    book.chapters[0]?.id ?? "",
                                  );
                                }}
                              >
                                <Eye size={14} />
                                Open book
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(null);
                                  navigate("writer-analytics");
                                }}
                              >
                                <ChevronRight size={14} />
                                Analytics
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="somi-writer-book-updated">
                        Updated {formatDate(book.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="somi-writer-book-stats">
                        <div className="somi-writer-book-stat">
                          <strong className="somi-writer-book-stat-value">
                            {chapterCount}
                          </strong>

                          <div className="somi-writer-book-stat-label">
                            Chapters
                          </div>
                        </div>

                        <div className="somi-writer-book-stat">
                          <strong className="somi-writer-book-stat-value">
                            {formatMetric(readers)}
                          </strong>

                          <div className="somi-writer-book-stat-label">
                            Readers
                          </div>
                        </div>

                        <div className="somi-writer-book-stat">
                          <strong className="somi-writer-book-stat-value">
                            {formatMetric(unlocks)}
                          </strong>

                          <div className="somi-writer-book-stat-label">
                            Unlocks
                          </div>
                        </div>
                      </div>

                      <div className="somi-writer-book-actions">
                        <button
                          type="button"
                          className="somi-writer-book-action"
                          aria-label={`Write ${book.title}`}
                          title="Write"
                          onClick={() =>
                            navigate(
                              "writer-editor",
                              book.id,
                              book.chapters[0]?.id ?? "",
                            )
                          }
                        >
                          <PenLine size={15} />
                        </button>

                        <button
                          type="button"
                          className="somi-writer-book-action"
                          aria-label={`View analytics for ${book.title}`}
                          title="Analytics"
                          onClick={() => navigate("writer-analytics")}
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="somi-writer-create-row"
            onClick={() => navigate("writer-create")}
          >
            <Plus size={17} />

            <span>Start a new book</span>

            <ChevronRight size={17} />
          </button>
        </section>
      </div>
    </div>
  );
}
