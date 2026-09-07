import { afterEach, describe, expect, it, vi } from "vitest";
import { apiAuthRepository } from "./authRepository";
import { apiReadingProgressRepository } from "./readingProgressApiRepository";

const apiEntry = {
  bookId: "book-1",
  chapterId: "chapter-1",
  progressPercent: 42,
  position: 12840,
  lastReadAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
};

describe("API reading progress repository", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps book progress and saves the reader representation", async () => {
    const request = vi.spyOn(apiAuthRepository, "authorizedRequest");
    request.mockResolvedValueOnce({ items: [apiEntry] });
    const progress =
      await apiReadingProgressRepository.getBookProgress("book-1");
    expect(progress[0]).toMatchObject({
      bookId: "book-1",
      progressPercentage: 42,
      position: 12840,
    });

    request.mockResolvedValueOnce({ item: apiEntry });
    await apiReadingProgressRepository.save({
      userId: "user-1",
      bookId: "book-1",
      chapterId: "chapter-1",
      page: 1,
      totalPages: 1,
      progressPercentage: 55,
      position: 15000,
      lastReadAt: "2026-09-04T00:01:00.000Z",
    });
    expect(request).toHaveBeenLastCalledWith(
      "/api/v1/books/book-1/chapters/chapter-1/reading-progress",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("maps continue reading and propagates API failures", async () => {
    const request = vi.spyOn(apiAuthRepository, "authorizedRequest");
    request.mockResolvedValueOnce({ item: apiEntry });
    await expect(
      apiReadingProgressRepository.getContinueReading(),
    ).resolves.toMatchObject({ chapterId: "chapter-1" });
    request.mockRejectedValueOnce(new Error("offline"));
    await expect(apiReadingProgressRepository.getRecent()).rejects.toThrow(
      "offline",
    );
  });
});
