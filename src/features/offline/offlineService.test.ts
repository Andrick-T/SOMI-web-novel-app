import { describe, expect, it } from "vitest";
import {
  createOfflineChapterRecord,
  isOfflineContentAvailable,
  offlineStorage,
  parseOfflineStatus,
} from "./offlineService";

describe("offline reading support", () => {
  it("creates a saveable chapter snapshot for offline access", () => {
    const record = createOfflineChapterRecord({
      bookId: "book-1",
      chapterId: "chapter-1",
      title: "A Quiet Room",
      content: "This is cached content.",
      bookTitle: "The Warden",
    });

    expect(record.bookId).toBe("book-1");
    expect(record.chapterId).toBe("chapter-1");
    expect(record.status).toBe("cached");
    expect(record.content.length).toBeGreaterThan(0);
  });

  it("reports unavailable content when nothing is saved", async () => {
    expect(isOfflineContentAvailable("missing-book", "missing-chapter")).toBe(
      false,
    );
    await expect(
      offlineStorage.getOfflineChapter("missing-book", "missing-chapter"),
    ).resolves.toBeNull();
  });

  it("normalizes online and offline states", () => {
    expect(parseOfflineStatus("online")).toBe("online");
    expect(parseOfflineStatus("offline")).toBe("offline");
    expect(parseOfflineStatus("cached")).toBe("cached");
  });
});
