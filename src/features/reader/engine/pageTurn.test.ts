import { describe, expect, it } from "vitest";
import {
  createReaderState,
  paginateChapter,
  requestPageTransition,
  commitReaderTransition,
  resolvePageTurn,
} from "./pageTurn";

describe("pageTurn engine", () => {
  it("paginates empty content into a single page", () => {
    expect(paginateChapter("", { charsPerPage: 100 })).toEqual([""]);
  });

  it("advances through pages in sequence", () => {
    const state = createReaderState(5);
    const next = requestPageTransition(state, "next", 5);
    expect(next.status).toBe("flipping");
    expect(next.currentPage).toBe(0);
    expect(next.pendingPage).toBe(1);
    const committed = commitReaderTransition(next, 1);
    expect(committed.currentPage).toBe(1);
    expect(committed.status).toBe("ready");
  });

  it("prevents invalid transitions beyond bounds", () => {
    const state = { ...createReaderState(3), currentPage: 2 };
    const next = requestPageTransition(state, "next", 3);
    expect(next.pendingPage).toBeNull();
    expect(next.status).toBe("ready");
  });

  it("locks while flipping is already in progress", () => {
    const state = {
      ...createReaderState(4),
      status: "flipping",
      pendingPage: 2,
    };
    const next = requestPageTransition(state, "prev", 4);
    expect(next.pendingPage).toBe(2);
    expect(next.currentPage).toBe(0);
  });

  it("resolves valid forward and backward page-turn targets while guarding boundaries", () => {
    expect(resolvePageTurn(2, 5, "next")).toEqual({
      currentIndex: 2,
      targetIndex: 3,
      direction: "next",
      isForward: true,
      canFlip: true,
    });

    expect(resolvePageTurn(2, 5, "prev")).toEqual({
      currentIndex: 2,
      targetIndex: 1,
      direction: "prev",
      isForward: false,
      canFlip: true,
    });

    expect(resolvePageTurn(0, 5, "prev")).toBeNull();
    expect(resolvePageTurn(4, 5, "next")).toBeNull();
  });
});
