import { describe, expect, it } from "vitest";
import {
  canTransitionPublication,
  transitionPublication,
  validateBook,
  validateChapter,
  reorderChapterIds,
  canEditWriterContent,
  createAutosaveState,
  updateAutosaveState,
} from "./service";

describe("writer publication lifecycle", () => {
  it("allows explicit valid transitions", () => {
    expect(canTransitionPublication("DRAFT", "EDITING")).toBe(true);
    expect(canTransitionPublication("READY_FOR_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionPublication("SCHEDULED", "PUBLISHED")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionPublication("PUBLISHED", "DRAFT")).toBe(false);
    expect(canTransitionPublication("DRAFT", "PUBLISHED")).toBe(false);
  });

  it("rejects invalid book payloads", () => {
    const result = validateBook({
      title: "",
      synopsis: "",
      genres: [],
      status: "DRAFT",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.field === "title")).toBe(true);
    expect(result.errors.some((error) => error.field === "synopsis")).toBe(
      true,
    );
    expect(result.errors.some((error) => error.field === "genres")).toBe(true);
  });

  it("rejects invalid chapter payloads", () => {
    const result = validateChapter({
      title: "",
      content: "",
      number: 0,
      price: -5,
      accessType: "PREMIUM",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.field === "title")).toBe(true);
    expect(result.errors.some((error) => error.field === "content")).toBe(true);
    expect(result.errors.some((error) => error.field === "number")).toBe(true);
    expect(result.errors.some((error) => error.field === "price")).toBe(true);
  });

  it("reorders chapters deterministically", () => {
    const ordered = reorderChapterIds(["c1", "c2", "c3"], ["c3", "c1", "c2"]);
    expect(ordered).toEqual(["c3", "c1", "c2"]);
  });

  it("enforces writer permissions", () => {
    expect(canEditWriterContent({ writerId: "w-1", ownerId: "w-1" })).toBe(
      true,
    );
    expect(canEditWriterContent({ writerId: "w-1", ownerId: "w-2" })).toBe(
      false,
    );
    expect(
      canEditWriterContent({
        writerId: "w-1",
        ownerId: "w-2",
        permission: "editor",
      }),
    ).toBe(true);
  });

  it("tracks autosave lifecycle", () => {
    const initial = createAutosaveState();
    expect(initial.status).toBe("CLEAN");

    const dirty = updateAutosaveState(initial, "DIRTY");
    expect(dirty.status).toBe("DIRTY");

    const saving = updateAutosaveState(dirty, "SAVING");
    expect(saving.status).toBe("SAVING");

    const saved = updateAutosaveState(saving, "SAVED");
    expect(saved.status).toBe("SAVED");
  });

  it("handles publication transitions with explicit outcomes", () => {
    const result = transitionPublication("EDITING", "PROOFREADING");
    expect(result.success).toBe(true);
    expect(result.nextStatus).toBe("PROOFREADING");

    const invalid = transitionPublication("PUBLISHED", "DRAFT");
    expect(invalid.success).toBe(false);
  });
});
