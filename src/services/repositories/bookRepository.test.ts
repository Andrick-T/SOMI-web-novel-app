import { describe, expect, it } from "vitest";
import {
  apiBookRepository,
  resolveFeaturedBook,
  resolveSelectedBook,
} from "./bookRepository";

describe("book repository empty-catalog handling", () => {
  it("returns no selected book when the catalog is empty", () => {
    const catalog: Parameters<typeof resolveSelectedBook>[0] = [];

    expect(resolveSelectedBook(catalog, "missing-book")).toBeUndefined();
    expect(resolveSelectedBook(catalog)).toBeUndefined();
    expect(resolveFeaturedBook(catalog)).toBeUndefined();
  });

  it("keeps the API repository compatible with the synchronous UI contract", () => {
    expect(Array.isArray(apiBookRepository.getBooks())).toBe(true);
    expect(apiBookRepository.getFeaturedBook()).toBeUndefined();
    expect(Array.isArray(apiBookRepository.getPopularBooks())).toBe(true);
    expect(Array.isArray(apiBookRepository.getGenres())).toBe(true);
  });
});
