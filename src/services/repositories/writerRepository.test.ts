import { afterEach, describe, expect, it, vi } from "vitest";
import { apiAuthRepository } from "./authRepository";
import { apiWriterRepository, useApiWriterContent } from "./writerRepository";
import { writerRepository } from "../../features/writer";

describe("writer content repositories", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses authenticated API endpoints for book and chapter creation", async () => {
    expect(useApiWriterContent).toBe(true);
    const requests: Array<{ path: string; init?: RequestInit }> = [];
    vi.spyOn(apiAuthRepository, "authorizedRequest").mockImplementation(
      async (path, init) => {
        requests.push({ path, init });
        if (path === "/api/v1/books") {
          return {
            book: {
              id: "api-book-1",
              authorId: "writer-1",
              title: "API Book",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          };
        }
        return {
          chapter: {
            id: "api-chapter-1",
            bookId: "api-book-1",
            number: 1,
            title: "Chapter 1",
            content: "Real content",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            contentVersion: 0,
          },
        };
      },
    );

    const book = await apiWriterRepository.createBook({ title: "API Book" });
    const chapter = await apiWriterRepository.createChapter(book.id, {
      title: "Chapter 1",
      content: "Real content",
      number: 1,
    });

    expect(book.id).toBe("api-book-1");
    expect(chapter.id).toBe("api-chapter-1");
    expect(requests.map((request) => request.path)).toEqual([
      "/api/v1/books",
      "/api/v1/books/api-book-1/chapters",
    ]);
    expect(requests[0].init?.method).toBe("POST");
    expect(requests[1].init?.method).toBe("POST");
  });

  it("keeps mock mode creation on the existing in-memory repository", () => {
    const book = writerRepository.createBook({
      title: "Mock mode book",
      synopsis: "Mock synopsis",
      cover: "mock-cover",
    });
    const chapter = writerRepository.createChapter(book.id, {
      title: "Mock chapter",
      content: "Mock content",
    });

    expect(book.id).toMatch(/^book-/);
    expect(chapter.bookId).toBe(book.id);
    expect(writerRepository.getChapter(book.id, chapter.id)?.content).toBe(
      "Mock content",
    );
  });

  it("saves the editor draft without allowing client lifecycle status changes", async () => {
    const authorizedRequest = vi
      .spyOn(apiAuthRepository, "authorizedRequest")
      .mockResolvedValue({
        chapter: {
          id: "api-chapter-1",
          bookId: "api-book-1",
          number: 1,
          title: "Chapter 1",
          content: "Updated content",
          status: "DRAFT",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          contentVersion: 1,
        },
      });

    await apiWriterRepository.saveChapterDraft("api-book-1", {
      id: "api-chapter-1",
      bookId: "api-book-1",
      number: 1,
      title: "Chapter 1",
      content: "Updated content",
      wordCount: 2,
      readingTime: 1,
      accessType: "FREE",
      price: 0,
      status: "EDITING",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      contentVersion: 1,
    });

    expect(authorizedRequest).toHaveBeenCalledWith(
      "/api/v1/books/api-book-1/chapters/api-chapter-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.not.stringContaining('"status"'),
      }),
    );
  });
});
