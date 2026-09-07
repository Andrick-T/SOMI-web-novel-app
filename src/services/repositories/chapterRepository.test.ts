import { afterEach, describe, expect, it, vi } from "vitest";
import { apiAuthRepository } from "./authRepository";
import { apiChapterRepository } from "./chapterRepository";

describe("API chapter repository", () => {
  afterEach(() => vi.restoreAllMocks());

  it("preserves entitlement-authorized chapter content", async () => {
    const request = vi.spyOn(apiAuthRepository, "authorizedRequest");
    request.mockResolvedValueOnce({
      chapter: {
        id: "chapter-1",
        bookId: "book-1",
        number: 1,
        title: "Premium Chapter",
        accessType: "PREMIUM",
        price: 120,
        content: "Authorized premium content.",
      },
    });

    await expect(
      apiChapterRepository.getChapterById("book-1", "chapter-1"),
    ).resolves.toMatchObject({
      id: "chapter-1",
      accessType: "PREMIUM",
      price: 120,
      content: "Authorized premium content.",
    });
    expect(request).toHaveBeenCalledWith(
      "/api/v1/books/book-1/chapters/chapter-1",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });
});
