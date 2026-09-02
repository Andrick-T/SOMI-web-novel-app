import { describe, expect, it } from "vitest";
import {
  getChapterProgress,
  resolveChapterNavigation,
} from "./chapterNavigation";

describe("chapter navigation", () => {
  it("moves to the next and previous chapter within bounds", () => {
    expect(resolveChapterNavigation(1, 4, "next")).toEqual({
      currentIndex: 1,
      targetIndex: 2,
      direction: "next",
      canNavigate: true,
    });

    expect(resolveChapterNavigation(2, 4, "prev")).toEqual({
      currentIndex: 2,
      targetIndex: 1,
      direction: "prev",
      canNavigate: true,
    });
  });

  it("prevents moving past the first or last chapter", () => {
    expect(resolveChapterNavigation(0, 4, "prev")).toBeNull();
    expect(resolveChapterNavigation(3, 4, "next")).toBeNull();
  });

  it("calculates the book progress from the active chapter index", () => {
    expect(getChapterProgress(0, 4)).toBe(25);
    expect(getChapterProgress(1, 4)).toBe(50);
    expect(getChapterProgress(3, 4)).toBe(100);
  });
});
