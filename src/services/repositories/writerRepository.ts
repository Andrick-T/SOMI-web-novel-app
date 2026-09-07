import type { WriterBook, WriterChapter } from "../../features/writer/types";
import { apiAuthRepository } from "./authRepository";

type ApiBook = {
  id: string;
  authorId: string;
  title: string;
  synopsis?: string | null;
  cover?: string | null;
  heroImage?: string | null;
  status?: string;
  createdAt: string;
  updatedAt: string;
  contentVersion?: number;
  chapters?: ApiChapter[];
  genres?: string[];
  tags?: string[];
};

type ApiChapter = {
  id: string;
  bookId: string;
  number: number;
  title: string;
  content?: string;
  status?: string;
  accessType?: string;
  price?: number;
  wordCount?: number;
  readingTime?: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contentVersion?: number;
};

const status = (value?: string) =>
  (value?.toUpperCase() ?? "DRAFT") as WriterBook["status"];

const chapterStatus = (value?: string) =>
  (value?.toUpperCase() ?? "DRAFT") as WriterChapter["status"];

const normalizeChapter = (chapter: ApiChapter): WriterChapter => ({
  id: chapter.id,
  bookId: chapter.bookId,
  number: chapter.number,
  title: chapter.title,
  content: chapter.content ?? "",
  status: chapterStatus(chapter.status),
  accessType:
    (chapter.accessType?.toUpperCase() as WriterChapter["accessType"]) ??
    "FREE",
  price: chapter.price ?? 0,
  wordCount: chapter.wordCount ?? 0,
  readingTime: chapter.readingTime ?? 0,
  publishedAt: chapter.publishedAt ?? undefined,
  createdAt: chapter.createdAt,
  updatedAt: chapter.updatedAt,
  contentVersion: chapter.contentVersion ?? 0,
});

const normalizeBook = (book: ApiBook): WriterBook => ({
  id: book.id,
  writerId: book.authorId,
  title: book.title,
  subtitle: "",
  penName: "",
  synopsis: book.synopsis ?? "",
  genres: book.genres ?? [],
  tags: book.tags ?? [],
  status: status(book.status),
  audience: "general",
  contentWarnings: [],
  publishingStrategy: "serial",
  cover: book.cover ?? "",
  heroImage: book.heroImage ?? book.cover ?? "",
  freeChapters: 0,
  chapterPricing: 0,
  isStandalone: true,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
  chapters: (book.chapters ?? []).map(normalizeChapter),
});

class ApiWriterRepository {
  private async request<T>(path: string, init: RequestInit = {}) {
    return apiAuthRepository.authorizedRequest<T>(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
    });
  }

  async getWriterBooks() {
    const result = await this.request<{
      books: ApiBook[];
    }>("/api/v1/writer/books");

    return (result.books ?? []).map(normalizeBook);
  }

  async getBook(bookId: string) {
    const result = await this.request<{
      book: ApiBook;
    }>(`/api/v1/books/${encodeURIComponent(bookId)}`);

    return result.book ? normalizeBook(result.book) : undefined;
  }

  async getChapter(bookId: string, chapterId: string) {
    const result = await this.request<{
      chapters: ApiChapter[];
    }>(`/api/v1/books/${encodeURIComponent(bookId)}/chapters/manage`);

    const chapter = (result.chapters ?? []).find(
      (entry) => entry.id === chapterId,
    );

    return chapter ? normalizeChapter(chapter) : undefined;
  }

  async createBook(input: Partial<WriterBook>) {
    const slug = `${input.title ?? "untitled-book"}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const result = await this.request<{
      book: ApiBook;
    }>("/api/v1/books", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        slug,
        synopsis: input.synopsis,
        cover: input.cover,
        heroImage: input.heroImage,

        /*
         * Deliberately no status.
         *
         * Server creates the book as DRAFT.
         */

        genres: [],
        tags: [],
      }),
    });

    return normalizeBook(result.book);
  }

  async createChapter(bookId: string, input: Partial<WriterChapter>) {
    const result = await this.request<{
      chapter: ApiChapter;
    }>(`/api/v1/books/${encodeURIComponent(bookId)}/chapters`, {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        number: input.number ?? 1,
        content: input.content ?? "Begin your chapter here.",

        /*
         * Deliberately no status.
         *
         * Server creates the chapter as DRAFT.
         */

        accessType: input.accessType ?? "FREE",
        price: input.price ?? 0,
      }),
    });

    return normalizeChapter(result.chapter);
  }

  async saveChapterDraft(bookId: string, chapter: WriterChapter) {
    const result = await this.request<{
      chapter: ApiChapter;
    }>(
      `/api/v1/books/${encodeURIComponent(
        bookId,
      )}/chapters/${encodeURIComponent(chapter.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: chapter.title,
          number: chapter.number,
          content: chapter.content,

          /*
           * Writer generic saves never mutate lifecycle status.
           *
           * Autosave already resets the working chapter to DRAFT
           * server-side.
           */

          accessType: chapter.accessType,
          price: chapter.price,
        }),
      },
    );

    return normalizeChapter(result.chapter);
  }

  async autosaveChapter(bookId: string, chapter: WriterChapter) {
    const result = await this.request<{
      content: ApiChapter;
    }>(
      `/api/v1/writer/books/${encodeURIComponent(
        bookId,
      )}/chapters/${encodeURIComponent(chapter.id)}/autosave`,
      {
        method: "PATCH",
        body: JSON.stringify({
          languageCode: "en",
          title: chapter.title,
          content: chapter.content,
          contentFormat: "plain-text",
          clientVersion: chapter.contentVersion ?? 0,
        }),
      },
    );

    return normalizeChapter(result.content);
  }

  async getLocalizations(bookId: string) {
    return this.request<{
      localizations: Array<{
        languageCode: "en" | "fr";
        title: string;
        description?: string | null;
        status: string;
      }>;
    }>(`/api/v1/writer/books/${encodeURIComponent(bookId)}/localizations`);
  }

  async saveLocalization(
    bookId: string,
    languageCode: "en" | "fr",
    input: {
      title: string;
      description?: string | null;
    },
  ) {
    return this.request(
      `/api/v1/writer/books/${encodeURIComponent(
        bookId,
      )}/localizations/${languageCode}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          languageCode,
          title: input.title,
          description: input.description ?? null,
        }),
      },
    );
  }

  async markLocalizationReady(bookId: string, languageCode: "en" | "fr") {
    return this.request(
      `/api/v1/writer/books/${encodeURIComponent(
        bookId,
      )}/localizations/${languageCode}/ready`,
      {
        method: "POST",
      },
    );
  }

  async markChapterLocalizationReady(
    bookId: string,
    chapterId: string,
    languageCode: "en" | "fr",
  ) {
    return this.request(
      `/api/v1/writer/books/${encodeURIComponent(
        bookId,
      )}/chapters/${encodeURIComponent(
        chapterId,
      )}/localizations/${languageCode}/ready`,
      {
        method: "POST",
      },
    );
  }

  async requestTranslation(
    bookId: string,
    sourceLanguage: "en" | "fr",
    targetLanguage: "en" | "fr",
  ) {
    return this.request(
      `/api/v1/writer/books/${encodeURIComponent(bookId)}/translate`,
      {
        method: "POST",
        body: JSON.stringify({
          sourceLanguage,
          targetLanguage,
          includeMetadata: true,
          includeChapters: true,
        }),
      },
    );
  }

  async submitBook(bookId: string) {
    return this.request(
      `/api/v1/writer/books/${encodeURIComponent(bookId)}/submit`,
      {
        method: "POST",
      },
    );
  }

  async getSubmissions() {
    return this.request("/api/v1/writer/submissions");
  }

  async getEarnings() {
    return this.request<{
      totalCoins: number;
      pendingCoins: number;
      availableCoins: number;
    }>("/api/v1/writer/earnings");
  }

  async getEarningTransactions() {
    return this.request<{
      transactions: Array<{
        id: string;
        bookId: string;
        chapterId: string;
        coins: number;
        status: string;
        createdAt: string;
      }>;
    }>("/api/v1/writer/earnings/transactions");
  }

  async uploadAsset(
    bookId: string,
    chapterId: string,
    file: Blob,
    metadata: {
      altText: string;
      caption?: string;
      width?: number;
      height?: number;
    },
  ) {
    const headers = new Headers({
      "Content-Type": file.type,
      "X-Asset-Alt-Text": metadata.altText,
    });

    if (metadata.caption) {
      headers.set("X-Asset-Caption", metadata.caption);
    }

    if (metadata.width) {
      headers.set("X-Asset-Width", String(metadata.width));
    }

    if (metadata.height) {
      headers.set("X-Asset-Height", String(metadata.height));
    }

    return apiAuthRepository.authorizedBinaryRequest<{
      asset: {
        id: string;
        altText: string;
        caption?: string | null;
      };
      url: string;
    }>(
      `/api/v1/writer/books/${encodeURIComponent(
        bookId,
      )}/chapters/${encodeURIComponent(chapterId)}/assets/upload`,
      {
        method: "POST",
        headers,
        body: file,
      },
    );
  }
}

export const apiWriterRepository = new ApiWriterRepository();

export const useApiWriterContent =
  import.meta.env.VITE_USE_API_CONTENT === "true";
