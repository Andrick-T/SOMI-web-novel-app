import {
  ArrowRight,
  Feather,
  Flame,
  Library,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import BookCard from "../components/BookCard";
import { EmptyState } from "../components/DesignPrimitives";
import { bookRepository } from "../services/repositories";
import type { Book } from "../data/books";
import type { CommonProps } from "../types";

const reads = (views: number) =>
  views >= 1000
    ? `${(views / 1000).toFixed(views >= 100000 ? 0 : 1)}k reads`
    : `${views} reads`;

function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: () => void;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="somi-eyebrow">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-[#f4eee3] md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[#9d927f]">{description}</p>
        )}
      </div>
      {action && (
        <button className="somi-text-link" onClick={action}>
          View all <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function Shelf({
  books,
  navigate,
  size = "md",
}: {
  books: Book[];
  navigate: CommonProps["navigate"];
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="somi-shelf">
      {books.map((book) => (
        <BookCard key={book.id} book={book} navigate={navigate} size={size} />
      ))}
    </div>
  );
}

function RatedCard({
  book,
  navigate,
}: {
  book: Book;
  navigate: CommonProps["navigate"];
}) {
  return (
    <button
      className="somi-rated-card"
      onClick={() => navigate("book", book.id)}
    >
      {book.cover && (
        <img src={book.cover} alt={`${book.title} cover`} loading="lazy" />
      )}
      <div className="min-w-0 text-left">
        <p className="truncate font-display text-lg font-semibold text-[#f4eee3]">
          {book.title}
        </p>
        <p className="mt-1 text-xs text-[#a99d8a]">{book.author}</p>
        <div className="mt-3 flex items-center gap-1 text-xs text-[#e8b363]">
          <Star size={12} fill="currentColor" /> {book.rating.toFixed(1)}
          <span className="ml-1 text-[#827766]">{reads(book.views)}</span>
        </div>
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#b7ac9b]">
          {book.synopsis}
        </p>
      </div>
    </button>
  );
}

function UpdateItem({
  book,
  navigate,
}: {
  book: Book;
  navigate: CommonProps["navigate"];
}) {
  const chapter = book.chapters[book.chapters.length - 1] ?? book.chapters[0];
  return (
    <button
      className="somi-update-item"
      onClick={() => navigate("book", book.id)}
    >
      {book.cover && (
        <img src={book.cover} alt={`${book.title} cover`} loading="lazy" />
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-display text-base font-semibold text-[#f4eee3]">
          {book.title}
        </span>
        <span className="mt-1 block text-xs text-[#998d7c]">{book.author}</span>
        <span className="mt-2 block text-xs text-[#e8b363]">
          Chapter {chapter?.number}: {chapter?.title}
        </span>
      </span>
      <span className="shrink-0 text-right text-[10px] uppercase tracking-wider text-[#827766]">
        {book.lastUpdate}
      </span>
    </button>
  );
}

export default function HomePage({
  navigate,
  isLoggedIn,
  isWriter,
}: CommonProps) {
  const books = bookRepository.getBooks();
  const featured = bookRepository.getFeaturedBook();
  const trending = bookRepository.getPopularBooks();
  const topRated = bookRepository.getTopRatedBooks();
  const updates = bookRepository.getRecentlyUpdatedBooks();
  const genres = bookRepository.getGenres().filter((genre) => genre !== "All");
  const newBooks = books.slice(-4).reverse();
  const shortStories = books.filter((book) => book.totalChapters <= 24);

  if (!featured) {
    return (
      <div className="somi-home">
        <div className="somi-home-inner">
          <div className="py-16">
            <EmptyState
              title="The catalog is empty"
              description="New stories will appear here once the API returns published books."
              action={
                <button
                  className="somi-quiet-button"
                  onClick={() => navigate("discover")}
                >
                  Browse discovery
                </button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="somi-home">
      <div className="somi-home-inner">
        <div className="somi-mobile-intro md:hidden">
          <div>
            <p className="font-display text-2xl font-semibold text-[#f4eee3]">
              SOMI
            </p>
            <p className="mt-1 text-xs text-[#a99d8a]">
              African stories, beautifully read
            </p>
          </div>
          <button
            className="somi-icon-button"
            onClick={() => navigate("discover")}
            aria-label="Search stories"
          >
            <Search size={17} />
          </button>
        </div>
        <section className="somi-hero" aria-labelledby="home-heading">
          <div className="somi-hero-copy">
            <p className="somi-eyebrow">
              <Sparkles size={13} /> SOMI EDITORIAL
            </p>
            <h1
              id="home-heading"
              className="font-display text-4xl leading-[0.98] text-[#fff8ed] md:text-6xl"
            >
              Stories with
              <br />
              <em>something to say.</em>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#c6bbaa] md:text-base">
              Discover powerful fiction, contemporary voices, and unforgettable
              worlds from Africa and beyond.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                className="somi-primary-button"
                onClick={() => navigate("book", featured.id)}
              >
                Read the featured story <ArrowRight size={16} />
              </button>
              <button
                className="somi-quiet-button"
                onClick={() => navigate("discover")}
              >
                Explore the library
              </button>
            </div>
          </div>
          <button
            className="somi-featured-book"
            onClick={() => navigate("book", featured.id)}
            aria-label={`Read ${featured.title}`}
          >
            <div className="somi-featured-art">
              {featured.heroImage && (
                <img src={featured.heroImage} alt={`${featured.title} cover`} />
              )}
              <span className="somi-featured-stamp">
                Editor's
                <br />
                choice
              </span>
            </div>
            <div className="mt-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#d6a45d]">
                Featured story
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-[#fff8ed]">
                {featured.title}
              </p>
              <p className="mt-1 text-xs text-[#aa9d8b]">
                {featured.author} · {featured.rating.toFixed(1)} rating
              </p>
            </div>
          </button>
        </section>
        <section
          className="somi-stat-strip"
          aria-label="SOMI reading highlights"
        >
          <div>
            <span className="somi-stat-value">{books.length}</span>
            <span>Original stories</span>
          </div>
          <div>
            <span className="somi-stat-value">{genres.length}</span>
            <span>Worlds to explore</span>
          </div>
          <div>
            <span className="somi-stat-value">
              {books.reduce((sum, book) => sum + book.totalChapters, 0)}
            </span>
            <span>Chapters waiting</span>
          </div>
          <div>
            <span className="somi-stat-value">4.8</span>
            <span>Community pulse</span>
          </div>
        </section>
        {isLoggedIn && (
          <section className="somi-continue" aria-labelledby="continue-heading">
            <div>
              <p className="somi-eyebrow">
                <Library size={13} /> YOUR LIBRARY
              </p>
              <h2
                id="continue-heading"
                className="font-display text-2xl font-semibold text-[#f4eee3]"
              >
                Welcome back to your shelf.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#a99d8a]">
                Your library is ready when you are. Pick up a story or discover
                your next one.
              </p>
            </div>
            <button
              className="somi-outline-button"
              onClick={() => navigate("library")}
            >
              Open library <ArrowRight size={15} />
            </button>
          </section>
        )}
        <section className="somi-section">
          <Heading
            eyebrow="WHAT READERS ARE INTO"
            title="Trending on SOMI"
            description="Stories readers can't stop reading."
            action={() => navigate("discover")}
          />
          <Shelf books={trending.slice(0, 6)} navigate={navigate} />
        </section>
        <section className="somi-section somi-tinted-section">
          <Heading
            eyebrow="THE COMMUNITY HAS SPOKEN"
            title="Readers' Choice"
            description="The stories our community rated highest."
            action={() => navigate("discover")}
          />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topRated.slice(0, 6).map((book) => (
              <RatedCard key={book.id} book={book} navigate={navigate} />
            ))}
          </div>
        </section>
        <section className="somi-section">
          <Heading
            eyebrow="JUST ARRIVED"
            title="New & Noteworthy"
            description="Fresh stories worth discovering."
            action={() => navigate("discover")}
          />
          <Shelf books={newBooks} navigate={navigate} size="lg" />
        </section>
        <section className="somi-section">
          <Heading
            eyebrow={isLoggedIn ? "BASED ON YOUR TASTE" : "A PLACE TO START"}
            title={isLoggedIn ? "Picked for You" : "You Might Love"}
            description={
              isLoggedIn
                ? "A considered place to find your next favorite."
                : "Popular stories with a little something extra."
            }
            action={() => navigate("discover")}
          />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topRated.slice(0, 3).map((book) => (
              <RatedCard key={book.id} book={book} navigate={navigate} />
            ))}
          </div>
        </section>
        <section className="somi-section somi-short-section">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="somi-eyebrow">
                <Feather size={13} /> BITE-SIZE FICTION
              </p>
              <h2 className="font-display text-2xl font-semibold text-[#f4eee3] md:text-3xl">
                Short Stories
              </h2>
              <p className="mt-1 text-sm text-[#a99d8a]">
                A whole world in a few quiet minutes.
              </p>
            </div>
            <button
              className="somi-text-link"
              onClick={() => navigate("discover")}
            >
              Explore all <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-6 grid gap-x-8 md:grid-cols-2">
            {shortStories.slice(0, 4).map((book) => (
              <RatedCard key={book.id} book={book} navigate={navigate} />
            ))}
          </div>
        </section>
        <section className="somi-section">
          <Heading
            eyebrow="FIND YOUR NEXT FIXATION"
            title="Explore by genre"
            description="Follow the feeling, wherever it leads."
          />
          <div className="somi-genre-grid">
            {genres.map((genre, index) => (
              <button
                key={genre}
                className={`somi-genre genre-${index % 4}`}
                onClick={() => navigate("discover")}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{genre}</strong>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </section>
        <section className="somi-section">
          <Heading
            eyebrow="KEEP READING"
            title="Latest Updates"
            description="New chapters from stories you don't want to miss."
            action={() => navigate("discover")}
          />
          <div className="somi-updates">
            {updates.slice(0, 5).map((book) => (
              <UpdateItem key={book.id} book={book} navigate={navigate} />
            ))}
          </div>
        </section>
        {!isWriter && (
          <section className="somi-writer-cta">
            <div>
              <p className="somi-eyebrow">
                <Flame size={13} /> FOR STORYTELLERS
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#fff8ed] md:text-4xl">
                Your story could be
                <br />
                <em>someone's next obsession.</em>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#c4b49e]">
                Bring your voice to a growing community of readers looking for
                something real.
              </p>
            </div>
            <button
              className="somi-primary-button"
              onClick={() => navigate("auth")}
            >
              Start writing <ArrowRight size={16} />
            </button>
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
    </div>
  );
}
