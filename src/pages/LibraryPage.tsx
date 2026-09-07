import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Download,
  Heart,
  ArrowRight,
} from "lucide-react";
import BookCard from "../components/BookCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/DesignPrimitives";
import { readingProgressRepository } from "../features/reader/services/readingProgressService";
import { apiReadingProgressRepository } from "../services/repositories/readingProgressApiRepository";
import { bookRepository } from "../services/repositories";
import type { CommonProps } from "../types";

type Tab = "reading" | "favorites" | "completed" | "downloads";

export default function LibraryPage({
  navigate,
  isLoggedIn,
  libraryBooks,
}: CommonProps) {
  const [tab, setTab] = useState<Tab>("reading");
  const [apiProgress, setApiProgress] =
    useState<ReturnType<typeof readingProgressRepository.getRecentReading>>();

  const books = useMemo(() => bookRepository.getBooks(), []);
  const readingProgress = useMemo(
    () =>
      Object.fromEntries(
        (apiProgress ?? readingProgressRepository.getRecentReading()).map(
          (entry) => [entry.bookId, entry],
        ),
      ),
    [apiProgress],
  );

  useEffect(() => {
    if (import.meta.env.VITE_USE_API_AUTH !== "true" || !isLoggedIn) return;
    void apiReadingProgressRepository
      .getRecent()
      .then(setApiProgress)
      .catch(() => setApiProgress([]));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-5 px-8 text-center bg-[var(--color-background)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface)]">
          <BookOpen size={36} color="var(--color-text-muted)" />
        </div>
        <div>
          <h2 className="mb-2 font-display text-xl font-bold text-[var(--color-text-primary)]">
            Your Library
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Sign in to save books, track progress, and keep your personal shelf
            close at hand.
          </p>
        </div>
        <button
          onClick={() => navigate("auth")}
          className="somi-primary-button w-full justify-center"
        >
          Sign In to SOMI
        </button>
        <button
          onClick={() => navigate("discover")}
          className="somi-text-link text-sm"
        >
          Browse without account
        </button>
      </div>
    );
  }

  const savedBooks = books.filter((book) => libraryBooks.includes(book.id));
  const readingBooks = books.filter(
    (book) => readingProgress[book.id] !== undefined,
  );
  const completedBooks = books
    .filter((book) => book.status === "COMPLETED")
    .slice(0, 2);
  const favoriteBooks = savedBooks.slice(0, 4);

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      id: "reading",
      label: "Reading",
      icon: <BookOpen size={14} />,
      count: readingBooks.length,
    },
    {
      id: "favorites",
      label: "Saved",
      icon: <Heart size={14} />,
      count: favoriteBooks.length,
    },
    {
      id: "completed",
      label: "Done",
      icon: <CheckCircle size={14} />,
      count: completedBooks.length,
    },
    {
      id: "downloads",
      label: "Offline",
      icon: <Download size={14} />,
      count: 0,
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-[var(--color-background)]">
      <div className="px-5 pb-4 pt-12">
        <p className="somi-eyebrow">Reader shelf</p>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          My Library
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your personal bookshelf
        </p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95"
            style={{
              background:
                tab === item.id
                  ? "var(--color-accent-primary)"
                  : "var(--color-surface)",
              color:
                tab === item.id
                  ? "var(--color-background)"
                  : "var(--color-text-muted)",
              border:
                tab === item.id
                  ? "1px solid transparent"
                  : "1px solid var(--color-border-default)",
            }}
          >
            {item.icon}
            {item.label}
            {item.count > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{
                  background:
                    tab === item.id
                      ? "rgba(13,11,24,0.2)"
                      : "var(--color-surface-muted)",
                  color:
                    tab === item.id
                      ? "var(--color-background)"
                      : "var(--color-text-muted)",
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 px-5 pb-8">
        {tab === "reading" && (
          <div className="space-y-3">
            {readingBooks.length === 0 ? (
              <EmptyState
                title="Your library is waiting for your next story."
                description="Pick a story and keep the next chapter close."
                action={
                  <button
                    className="somi-quiet-button"
                    onClick={() => navigate("discover")}
                  >
                    Browse stories
                  </button>
                }
              />
            ) : (
              readingBooks.map((book) => {
                const progressEntry = readingProgress[book.id];
                const progress = progressEntry?.progressPercentage ?? 0;
                const chapterLabel = progressEntry?.chapterId
                  ? `Ch. ${progressEntry.chapterId.split("-").at(-1) ?? 1}`
                  : "Ch. 1";
                return (
                  <div
                    key={book.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate("book", book.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate("book", book.id);
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3 text-left transition-transform active:scale-[0.98]"
                  >
                    <div className="h-[82px] w-[56px] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-muted)]">
                      <img
                        src={book.cover || undefined}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {book.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {book.author}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-default)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            background:
                              "linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-active))",
                          }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                        <span>{chapterLabel}</span>
                        <span className="font-bold text-[var(--color-accent-primary)]">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate("reader", book.id, book.chapters[0].id);
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-primary)] text-[var(--color-background)]"
                      aria-label={`Continue reading ${book.title}`}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "favorites" &&
          (favoriteBooks.length === 0 ? (
            <EmptyState
              title="No saved books yet"
              description="Save titles you want to revisit later."
              action={
                <button
                  className="somi-quiet-button"
                  onClick={() => navigate("discover")}
                >
                  Find stories
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {favoriteBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  navigate={navigate}
                  size="sm"
                />
              ))}
            </div>
          ))}

        {tab === "completed" && (
          <div className="space-y-3">
            {completedBooks.length === 0 ? (
              <EmptyState
                title="Finished stories will appear here."
                description="Complete a chapter and your reading history will settle here."
              />
            ) : (
              completedBooks.map((book) => (
                <div
                  key={book.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("book", book.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate("book", book.id);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3 text-left transition-transform active:scale-[0.98]"
                >
                  <div className="h-[82px] w-[56px] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-muted)]">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {book.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {book.author}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                      <CheckCircle
                        size={12}
                        color="var(--color-status-success)"
                      />
                      <span>Finished</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "downloads" && (
          <EmptyState
            title="Reading offline"
            description="Downloaded chapters will appear here once the offline feature is enabled."
          />
        )}
      </div>
    </div>
  );
}
