import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  Check,
  Eye,
  Heart,
  LockKeyhole,
  Share2,
  Star,
} from "lucide-react";
import BookCard from "../components/BookCard";
import { readingProgressRepository } from "../features/reader/services/readingProgressService";
import { bookRepository } from "../services/repositories";
import type { Book } from "../services/repositories";
import type { CommonProps } from "../types";

interface Props extends CommonProps {
  book?: Book;
}

const statusLabels: Record<string, string> = {
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  UPCOMING: "Coming soon",
  PAUSED: "On hold",
};
const statusColors: Record<string, string> = {
  ONGOING: "#74c69d",
  COMPLETED: "#d6a45d",
  UPCOMING: "#e8b363",
  PAUSED: "#c96b4b",
};
const reads = (views: number) =>
  views >= 1000
    ? `${(views / 1000).toFixed(views >= 100000 ? 0 : 1)}k reads`
    : `${views} reads`;

const previewFrom = (content: string, limit = 1450) => {
  const paragraphs = content
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const preview: string[] = [];
  let length = 0;
  for (const paragraph of paragraphs) {
    if (length + paragraph.length > limit && preview.length > 0) break;
    preview.push(paragraph);
    length += paragraph.length;
    if (length >= limit) break;
  }
  return preview;
};

export default function BookDetailPage({
  book,
  navigate,
  isLoggedIn,
  libraryBooks,
  addToLibrary,
  unlockedChapters,
  unlockChapter,
  coins,
}: Props) {
  if (!book) {
    return (
      <div className="somi-home min-h-full">
        <div className="somi-home-inner flex min-h-[70vh] items-center justify-center py-16">
          <div className="w-full max-w-xl">
            <div className="somi-state">
              <h2>Book unavailable</h2>
              <p>This story is not available in the current catalog.</p>
              <button
                className="somi-quiet-button"
                onClick={() => navigate("discover")}
              >
                Explore the library
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [showAllChapters, setShowAllChapters] = useState(false);
  const [unlockingChapterId, setUnlockingChapterId] = useState<string | null>(
    null,
  );
  const inLibrary = libraryBooks.includes(book.id);
  const firstChapter = book.chapters[0];
  const readingProgress = readingProgressRepository.getBookProgress(book.id);
  const relatedBooks = bookRepository
    .getBooks()
    .filter((entry) => entry.id !== book.id);
  const authorBooks = relatedBooks.filter(
    (entry) => entry.author === book.author,
  );
  const recommendations = relatedBooks
    .filter((entry) =>
      entry.genres.some((genre) => book.genres.includes(genre)),
    )
    .slice(0, 6);
  const chapterPreview = useMemo(
    () =>
      firstChapter?.accessType === "FREE"
        ? previewFrom(firstChapter.content)
        : [],
    [firstChapter],
  );
  const visibleChapters = showAllChapters
    ? book.chapters
    : book.chapters.slice(0, 6);
  const primaryChapterId = readingProgress?.chapterId ?? firstChapter?.id;
  const primaryLabel = readingProgress
    ? `Continue from Ch. ${readingProgress.chapterId.split("-").at(-1) ?? 1}`
    : "Start reading";
  const unlockCandidate = unlockingChapterId
    ? (book.chapters.find((chapter) => chapter.id === unlockingChapterId) ??
      null)
    : null;

  const openChapter = (chapterId: string) => {
    const chapter = book.chapters.find((entry) => entry.id === chapterId);
    if (!chapter) return;
    if (
      chapter.accessType === "FREE" ||
      unlockedChapters.includes(chapter.id)
    ) {
      navigate("reader", book.id, chapter.id);
      return;
    }
    if (!isLoggedIn) {
      navigate("auth");
      return;
    }
    setUnlockingChapterId(chapter.id);
  };

  const confirmUnlock = async () => {
    if (!unlockCandidate) return;
    if (coins < unlockCandidate.price) {
      setUnlockingChapterId(null);
      navigate("wallet");
      return;
    }
    await unlockChapter(unlockCandidate.id, unlockCandidate.price);
    setUnlockingChapterId(null);
    navigate("reader", book.id, unlockCandidate.id);
  };

  return (
    <div className="somi-home min-h-full">
      <div className="somi-home-inner pb-10">
        <section className="relative border-b border-[#3b2a20] py-6 md:py-10">
          <div className="absolute inset-0 -mx-10 overflow-hidden opacity-25 md:-mx-20">
            {book.heroImage && (
              <img
                src={book.heroImage}
                alt=""
                className="h-full w-full object-cover blur-2xl"
              />
            )}
            <div className="absolute inset-0 bg-[#100d0b]/80" />
          </div>
          <div className="relative grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-center lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-14">
            <div className="mx-auto w-[190px] md:w-full">
              <div className="relative aspect-[2/3] overflow-hidden shadow-[16px_20px_35px_rgba(0,0,0,0.35)]">
                {book.cover && (
                  <img
                    src={book.cover}
                    alt={`${book.title} cover`}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#160c07]/35 to-transparent" />
              </div>
            </div>
            <div className="max-w-3xl">
              <button
                onClick={() => navigate("home")}
                className="somi-quiet-button mb-7 -ml-1"
                aria-label="Back to home"
              >
                <ArrowLeft size={15} /> Back to stories
              </button>
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                <span style={{ color: statusColors[book.status] }}>
                  {statusLabels[book.status]}
                </span>
                <span className="text-[#806e5b]">
                  Updated {book.lastUpdate}
                </span>
              </div>
              <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] text-[#f4eee3] md:text-6xl">
                {book.title}
              </h1>
              <p className="mt-3 font-serif text-base italic text-[#b7a995]">
                by {book.author}
              </p>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#c6b8a6] md:text-base md:leading-8">
                {book.synopsis}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#a99d8a]">
                <span className="flex items-center gap-1.5 text-[#e8b363]">
                  <Star size={14} fill="currentColor" />{" "}
                  {book.rating.toFixed(1)} rating
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={14} /> {reads(book.views)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart size={14} /> {book.favorites.toLocaleString()}{" "}
                  favorites
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} /> {book.totalChapters} chapters
                </span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  className="somi-primary-button"
                  onClick={() =>
                    primaryChapterId && openChapter(primaryChapterId)
                  }
                >
                  <BookOpen size={16} /> {primaryLabel}
                </button>
                <button
                  className="somi-outline-button"
                  onClick={() => addToLibrary(book.id)}
                >
                  {inLibrary ? <Check size={15} /> : <BookmarkPlus size={15} />}
                  {inLibrary ? "In your library" : "Add to library"}
                </button>
                <button
                  className="somi-icon-button"
                  aria-label="Share this book"
                  title="Share this book"
                >
                  <Share2 size={16} />
                </button>
              </div>
              <div className="mt-7 flex flex-wrap gap-2 border-t border-[#3b2a20] pt-5">
                {[...book.genres, ...book.tags].map((tag) => (
                  <span
                    key={tag}
                    className="border-b border-[#715137] px-1 pb-1 text-[11px] text-[#d6a45d]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        {chapterPreview.length > 0 && (
          <section className="somi-section max-w-4xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="somi-eyebrow">A taste of the story</p>
                <h2 className="font-display text-3xl font-semibold text-[#f4eee3]">
                  Chapter {firstChapter.number}: {firstChapter.title}
                </h2>
              </div>
              <span className="hidden text-xs text-[#8f8371] sm:block">
                {firstChapter.readingTime} min read
              </span>
            </div>
            <article className="border-y border-[#443126] py-8 md:px-10 md:py-12">
              <div className="max-w-2xl font-serif text-[1.05rem] leading-[2] text-[#ddcfbd] md:text-lg">
                {chapterPreview.map((paragraph, index) => (
                  <p
                    key={`${paragraph.slice(0, 24)}-${index}`}
                    className="mb-6 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="somi-continue">
                <div>
                  <p className="somi-eyebrow mb-1">Keep reading</p>
                  <p className="font-display text-xl text-[#f4eee3]">
                    The story is just beginning.
                  </p>
                </div>
                <button
                  className="somi-primary-button shrink-0"
                  onClick={() => openChapter(firstChapter.id)}
                >
                  Continue reading <ArrowRight size={15} />
                </button>
              </div>
            </article>
          </section>
        )}
        <section className="somi-section border-t border-[#443126] pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="somi-eyebrow">The reader signal</p>
              <h2 className="font-display text-3xl font-semibold text-[#f4eee3]">
                Why readers stay
              </h2>
            </div>
            <div className="text-right">
              <p className="font-serif text-3xl text-[#e8b363]">
                {book.rating.toFixed(1)}
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8f8371]">
                reader rating
              </p>
            </div>
          </div>
          <div className="grid gap-6 border-y border-[#443126] py-6 text-sm text-[#b7a995] md:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#8f8371]">
                Reach
              </p>
              <p className="font-serif text-lg text-[#f4eee3]">
                {reads(book.views)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#8f8371]">
                Loved by
              </p>
              <p className="font-serif text-lg text-[#f4eee3]">
                {book.favorites.toLocaleString()} readers
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#8f8371]">
                Commitment
              </p>
              <p className="font-serif text-lg text-[#f4eee3]">
                {book.totalChapters} chapters to discover
              </p>
            </div>
          </div>
        </section>
        <section className="somi-section">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="somi-eyebrow">Follow the thread</p>
              <h2 className="font-display text-3xl font-semibold text-[#f4eee3]">
                Chapters
              </h2>
            </div>
            <span className="text-xs text-[#8f8371]">
              {book.totalChapters} chapters
            </span>
          </div>
          <div className="border-t border-[#443126]">
            {visibleChapters.map((chapter) => {
              const locked =
                chapter.accessType === "PREMIUM" &&
                !unlockedChapters.includes(chapter.id);
              const current = readingProgress?.chapterId === chapter.id;
              return (
                <button
                  key={chapter.id}
                  onClick={() => openChapter(chapter.id)}
                  className="group flex w-full items-center gap-4 border-b border-[#34271f] py-4 text-left transition-colors hover:bg-[#1c1510] md:gap-6"
                >
                  <span className="w-8 font-serif text-lg text-[#806e5b]">
                    {String(chapter.number).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base text-[#f4eee3]">
                      {chapter.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#8f8371]">
                      {chapter.readingTime} min ·{" "}
                      {chapter.wordCount.toLocaleString()} words
                    </span>
                  </span>
                  {current && (
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-[#e8b363] sm:block">
                      Current
                    </span>
                  )}
                  <span
                    className={
                      locked
                        ? "flex items-center gap-1 text-xs text-[#c96b4b]"
                        : "text-xs text-[#8f8371]"
                    }
                  >
                    {locked ? (
                      <>
                        <LockKeyhole size={13} /> {chapter.price} coins
                      </>
                    ) : (
                      "Read"
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {book.chapters.length > 6 && (
            <button
              className="somi-text-link mt-5"
              onClick={() => setShowAllChapters((value) => !value)}
            >
              {showAllChapters
                ? "Show fewer"
                : `View all ${book.chapters.length} chapters`}{" "}
              <ArrowRight size={14} />
            </button>
          )}
        </section>
        {authorBooks.length > 0 && (
          <section className="somi-section">
            <p className="somi-eyebrow">From the same author</p>
            <h2 className="mb-5 font-display text-3xl font-semibold text-[#f4eee3]">
              More from {book.author}
            </h2>
            <div className="somi-shelf">
              {authorBooks.map((entry) => (
                <BookCard
                  key={entry.id}
                  book={entry}
                  navigate={navigate}
                  size="md"
                />
              ))}
            </div>
          </section>
        )}
        {recommendations.length > 0 && (
          <section className="somi-section">
            <p className="somi-eyebrow">Keep exploring</p>
            <h2 className="mb-5 font-display text-3xl font-semibold text-[#f4eee3]">
              You&apos;ll also like
            </h2>
            <div className="somi-shelf">
              {recommendations.map((entry) => (
                <BookCard
                  key={entry.id}
                  book={entry}
                  navigate={navigate}
                  size="md"
                />
              ))}
            </div>
          </section>
        )}
        <footer className="somi-footer">
          <div>
            <p className="font-display text-2xl font-semibold text-[#f4eee3]">
              SOMI
            </p>
            <p className="mt-2 max-w-xs text-xs leading-5 text-[#8f8371]">
              A home for stories that stay with you.
            </p>
          </div>
          <div className="somi-footer-links">
            <button onClick={() => navigate("discover")}>Discover</button>
            <button onClick={() => navigate("library")}>Library</button>
            <button onClick={() => navigate("profile")}>Profile</button>
            <button onClick={() => navigate("auth")}>For authors</button>
          </div>
          <p className="text-[10px] text-[#716756]">© 2024 SOMI</p>
        </footer>
      </div>
      {unlockCandidate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#100d0b]/75 px-4 pb-6 pt-10 backdrop-blur-sm">
          <div className="w-full max-w-md border border-[#5a402b] bg-[#211710] p-5">
            <p className="somi-eyebrow">Unlock chapter</p>
            <h2 className="font-display text-2xl text-[#f4eee3]">
              {unlockCandidate.title}
            </h2>
            <p className="mt-3 text-sm text-[#b7a995]">
              This chapter costs {unlockCandidate.price} coins. Your balance:{" "}
              {coins} coins.
            </p>
            <div className="mt-6 flex gap-4">
              <button
                className="somi-quiet-button flex-1"
                onClick={() => setUnlockingChapterId(null)}
              >
                Cancel
              </button>
              <button
                className="somi-primary-button flex-1"
                onClick={confirmUnlock}
              >
                {coins >= unlockCandidate.price ? "Unlock" : "Top up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
