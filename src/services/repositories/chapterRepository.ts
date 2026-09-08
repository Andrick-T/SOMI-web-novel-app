import { books } from "../../data/books";
import { appConfig } from "../../config/env";
import type { Book, Chapter } from "./bookRepository";
import { apiAuthRepository } from "./authRepository";

const useApiContent = import.meta.env.VITE_USE_API_CONTENT === "true";

type ApiChapter = {
  id: string;
  bookId?: string;
  title: string;
  number: number;
  content?: string;
  status?: string;
  accessType?: string;
  price?: number;
  wordCount?: number;
  readingTime?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeApiChapter = (chapter: ApiChapter): Chapter => ({
  id: chapter.id,
  number: chapter.number,
  title: chapter.title,
  accessType: (chapter.accessType as "FREE" | "PREMIUM") ?? "FREE",
  price: chapter.price ?? 0,
  wordCount: chapter.wordCount ?? 0,
  readingTime: chapter.readingTime ?? 0,
  publishedAt: chapter.publishedAt ?? "",
  content: chapter.content ?? "",
});

class ApiChapterRepository {
  private request<T>(path: string): Promise<T> {
    return apiAuthRepository.authorizedRequest<T>(`/api/v1${path}`, {
      headers: { Accept: "application/json" },
    });
  }

  async getChaptersByBookId(bookId: string): Promise<Chapter[]> {
    try {
      const response = await this.request<{ chapters: ApiChapter[] }>(
        `/books/${encodeURIComponent(bookId)}/chapters`,
      );
      return (response.chapters ?? []).map(normalizeApiChapter);
    } catch {
      return [];
    }
  }

  async getChapterById(
    bookId: string,
    chapterId: string,
  ): Promise<Chapter | undefined> {
    try {
      const response = await this.request<{ chapter: ApiChapter }>(
        `/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}`,
      );
      return response.chapter
        ? normalizeApiChapter(response.chapter)
        : undefined;
    } catch {
      return undefined;
    }
  }

  async getBookForChapter(chapterId: string): Promise<Book | undefined> {
    try {
      const response = await this.request<{
        books: Array<{ id: string; title: string; chapters?: ApiChapter[] }>;
      }>("/books");
      const found = (response.books ?? []).find((book) =>
        (book.chapters ?? []).some((chapter) => chapter.id === chapterId),
      );

      if (!found) {
        return undefined;
      }

      return {
        id: found.id,
        title: found.title,
        author: "",
        cover: "",
        heroImage: "",
        genres: [],
        status: "ONGOING",
        synopsis: "",
        totalChapters: found.chapters?.length ?? 0,
        lastUpdate: "Recently",
        rating: 0,
        views: 0,
        favorites: 0,
        tags: [],
        chapters: (found.chapters ?? []).map(normalizeApiChapter),
      };
    } catch {
      return undefined;
    }
  }
}

export const apiChapterRepository = new ApiChapterRepository();

export const mockChapterRepository = {
  getChaptersByBookId: (bookId: string): Chapter[] => {
    const book = books.find((entry) => entry.id === bookId);
    return book?.chapters ?? [];
  },
  getChapterById: (bookId: string, chapterId: string): Chapter | undefined => {
    const book = books.find((entry) => entry.id === bookId);
    return book?.chapters.find((chapter) => chapter.id === chapterId);
  },
  getBookForChapter: (chapterId: string): Book | undefined =>
    books.find((book) =>
      book.chapters.some((chapter) => chapter.id === chapterId),
    ),
};

export const chapterRepository = useApiContent
  ? apiChapterRepository
  : mockChapterRepository;
