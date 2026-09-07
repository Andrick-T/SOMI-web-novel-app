import { books } from "../../data/books";
import { appConfig } from "../../config/env";

export type {
  Book,
  Chapter,
  Genre,
  BookStatus,
  AccessType,
} from "../../data/books";

const useApiContent = import.meta.env.VITE_USE_API_CONTENT === "true";

type ApiChapter = {
  id: string;
  number: number;
  title: string;
  status?: string;
  accessType?: string;
  price?: number;
  wordCount?: number;
  readingTime?: number;
  publishedAt?: string | null;
  content?: string;
};

type ApiAuthor = {
  id?: string;
  email?: string;
  displayName?: string;
};

type ApiBook = {
  id: string;
  title: string;
  slug?: string;
  synopsis?: string | null;
  cover?: string | null;
  heroImage?: string | null;
  status?: string;
  rating?: number | null;
  views?: number | null;
  favorites?: number | null;
  totalChapters?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  author?: ApiAuthor;
  genres?: string[];
  tags?: string[];
  chapters?: ApiChapter[];
};

const sortByViews = (a: (typeof books)[number], b: (typeof books)[number]) =>
  b.views - a.views;
const sortByRating = (a: (typeof books)[number], b: (typeof books)[number]) =>
  b.rating - a.rating;

export const resolveSelectedBook = (
  catalog: (typeof books)[number][],
  requestedId?: string,
) => {
  if (requestedId) {
    return (
      catalog.find((book) => book.id === requestedId) ?? catalog[0] ?? undefined
    );
  }

  return catalog[0] ?? undefined;
};

export const resolveFeaturedBook = (catalog: (typeof books)[number][]) =>
  [...catalog].sort(sortByViews)[0] ?? undefined;

const normalizeStatus = (value?: string): (typeof books)[number]["status"] => {
  switch (value?.toUpperCase()) {
    case "COMPLETED":
      return "COMPLETED";
    case "UPCOMING":
      return "UPCOMING";
    case "PAUSED":
      return "PAUSED";
    case "DRAFT":
    case "PUBLISHED":
    case "ONGOING":
    default:
      return "ONGOING";
  }
};

const relativeLabel = (value?: string | null) => {
  if (!value) return "Recently";

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Recently";

  const diffMinutes = Math.max(1, Math.round((Date.now() - parsed) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
};

const normalizeGenreList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
};

const normalizeApiBook = (apiBook: ApiBook | null | undefined) => {
  if (!apiBook) return undefined;

  return {
    id: apiBook.id,
    title: apiBook.title,
    author:
      apiBook.author?.displayName ?? apiBook.author?.email ?? "Unknown Author",
    cover: apiBook.cover ?? apiBook.heroImage ?? "",
    heroImage: apiBook.heroImage ?? apiBook.cover ?? "",
    genres: normalizeGenreList(apiBook.genres),
    status: normalizeStatus(apiBook.status),
    synopsis: apiBook.synopsis ?? "",
    totalChapters: Number(
      apiBook.totalChapters ?? apiBook.chapters?.length ?? 0,
    ),
    lastUpdate: relativeLabel(apiBook.updatedAt ?? apiBook.publishedAt),
    rating: Number(apiBook.rating ?? 0),
    views: Number(apiBook.views ?? 0),
    favorites: Number(apiBook.favorites ?? 0),
    tags: normalizeGenreList(apiBook.tags),
    chapters: (apiBook.chapters ?? []).map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      accessType: (chapter.accessType as "FREE" | "PREMIUM") ?? "FREE",
      price: chapter.price ?? 0,
      wordCount: chapter.wordCount ?? 0,
      readingTime: chapter.readingTime ?? 0,
      publishedAt: chapter.publishedAt ?? apiBook.publishedAt ?? "",
      content: chapter.content ?? "",
    })),
  } satisfies (typeof books)[number];
};

class ApiBookRepository {
  private cache: (typeof books)[number][] = [];
  error: Error | null = null;

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(
      `${appConfig.apiBaseUrl.replace(/\/$/, "")}/api/v1${path}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? "Failed to load books.");
    }

    return response.json() as Promise<T>;
  }

  async loadBooks(): Promise<(typeof books)[number][]> {
    try {
      const response = await this.request<{ books?: ApiBook[] | unknown }>('/books');
      const rawBooks = Array.isArray(response.books) ? response.books : [];
      this.cache = rawBooks
        .map(normalizeApiBook)
        .filter((book): book is (typeof books)[number] => Boolean(book));
      this.error = null;
      return this.cache;
    } catch (error) {
      this.cache = [];
      this.error =
        error instanceof Error ? error : new Error("Failed to load books.");
      return this.cache;
    }
  }

  async getBookDetail(id: string) {
    try {
      const response = await this.request<{ book: ApiBook }>(
        `/books/${encodeURIComponent(id)}`,
      );
      return normalizeApiBook(response.book);
    } catch (error) {
      this.error =
        error instanceof Error ? error : new Error("Failed to load book.");
      return undefined;
    }
  }

  getBooks(): (typeof books)[number][] {
    return this.cache;
  }

  getBookById(id: string): (typeof books)[number] | undefined {
    return resolveSelectedBook(this.cache, id);
  }

  getFeaturedBook(): (typeof books)[number] | undefined {
    return resolveFeaturedBook(this.cache);
  }

  getPopularBooks(): (typeof books)[number][] {
    return [...this.cache].sort(sortByViews);
  }

  getRecentlyUpdatedBooks(): (typeof books)[number][] {
    return [...this.cache].sort((a, b) => b.views - a.views);
  }

  getTopRatedBooks(): (typeof books)[number][] {
    return [...this.cache].sort(sortByRating);
  }

  getGenres(): string[] {
    const genres = this.cache.flatMap((book) =>
      Array.isArray(book.genres) ? book.genres : [],
    );
    return ["All", ...new Set(genres)];
  }
}

export const apiBookRepository = new ApiBookRepository();

export const mockBookRepository = {
  getBooks: () => books,
  getBookById: (id: string) => resolveSelectedBook(books, id),
  getFeaturedBook: () => resolveFeaturedBook(books),
  getPopularBooks: () => [...books].sort(sortByViews),
  getRecentlyUpdatedBooks: () => [...books].sort((a, b) => b.views - a.views),
  getTopRatedBooks: () => [...books].sort(sortByRating),
  getGenres: () => {
    const genres = books.flatMap((book) =>
      Array.isArray(book.genres) ? book.genres : [],
    );
    return ["All", ...new Set(genres)];
  },
};

export const bookRepository = useApiContent
  ? apiBookRepository
  : mockBookRepository;
