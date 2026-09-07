import { afterEach, describe, expect, it, vi } from "vitest";
import { apiAuthRepository } from "./authRepository";
import { apiLibraryRepository } from "./libraryApiRepository";

const item = {
  id: "item-1",
  book: {
    id: "book-1",
    title: "Book",
    author: "Author",
    coverUrl: null,
    status: "PUBLISHED",
  },
  addedAt: "2026-09-04T00:00:00.000Z",
};

describe("API library repository", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists, adds, and removes library items through the API", async () => {
    const request = vi.spyOn(apiAuthRepository, "authorizedRequest");
    request.mockResolvedValueOnce({ items: [item] });
    await expect(apiLibraryRepository.list()).resolves.toEqual([item]);
    request.mockResolvedValueOnce({ item });
    await expect(apiLibraryRepository.add("book-1")).resolves.toEqual(item);
    request.mockResolvedValueOnce(undefined);
    await expect(
      apiLibraryRepository.remove("book-1"),
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenLastCalledWith("/api/v1/library/book-1", {
      method: "DELETE",
    });
  });

  it("propagates API failures instead of supplying mock data", async () => {
    vi.spyOn(apiAuthRepository, "authorizedRequest").mockRejectedValue(
      new Error("API unavailable"),
    );
    await expect(apiLibraryRepository.list()).rejects.toThrow(
      "API unavailable",
    );
  });
});
