import type { ReadingProgress } from "../types";
import { readingProgressStorage } from "./persistence";
import { apiReadingProgressRepository } from "../../../services/repositories/readingProgressApiRepository";

export interface ReadingProgressRepository {
  getProgress(bookId: string, chapterId: string): ReadingProgress | undefined;
  saveProgress(progress: ReadingProgress): ReadingProgress;
  getBookProgress(bookId: string): ReadingProgress | undefined;
  getRecentReading(): ReadingProgress[];
}

export class MockReadingProgressRepository implements ReadingProgressRepository {
  constructor(private readonly namespace = "default") {}

  private readAll(): Record<string, ReadingProgress> {
    const state = readingProgressStorage.get();
    const namespacedProgress = state[
      `${this.namespace}:progress`
    ] as unknown as Record<string, ReadingProgress> | undefined;

    return namespacedProgress ?? state;
  }

  private writeAll(value: Record<string, ReadingProgress>): void {
    const state = readingProgressStorage.get();

    (state as Record<string, unknown>)[`${this.namespace}:progress`] = value;

    readingProgressStorage.save(state);
  }

  getProgress(bookId: string, chapterId: string): ReadingProgress | undefined {
    return Object.values(this.readAll()).find(
      (entry) => entry.bookId === bookId && entry.chapterId === chapterId,
    );
  }

  saveProgress(progress: ReadingProgress): ReadingProgress {
    const all = this.readAll();
    const key = `${progress.bookId}:${progress.chapterId}`;

    const next = {
      ...all,
      [key]: progress,
    };

    this.writeAll(next);

    return progress;
  }

  getBookProgress(bookId: string): ReadingProgress | undefined {
    const progress = Object.values(this.readAll()).filter(
      (entry) => entry.bookId === bookId,
    );

    return progress.sort((a, b) => (a.lastReadAt > b.lastReadAt ? -1 : 1))[0];
  }

  getRecentReading(): ReadingProgress[] {
    return Object.values(this.readAll()).sort((a, b) =>
      a.lastReadAt > b.lastReadAt ? -1 : 1,
    );
  }
}

export const readingProgressRepository = new MockReadingProgressRepository();

export function getReaderProgressForChapter(
  bookId: string,
  chapterId: string,
): ReadingProgress | undefined {
  return readingProgressRepository.getProgress(bookId, chapterId);
}

export function persistReadingProgress(
  progress: ReadingProgress,
): ReadingProgress {
  const saved = readingProgressRepository.saveProgress(progress);

  if (
    import.meta.env.VITE_USE_API_AUTH === "true" &&
    progress.userId !== "guest-user"
  ) {
    void apiReadingProgressRepository.save(progress).catch(() => undefined);
  }

  return saved;
}

export async function hydrateReadingProgress(bookId: string) {
  if (import.meta.env.VITE_USE_API_AUTH !== "true") {
    return readingProgressRepository.getBookProgress(bookId);
  }

  const current = readingProgressStorage.get();

  Object.keys(current)
    .filter((key) => current[key]?.bookId === bookId)
    .forEach((key) => delete current[key]);

  readingProgressStorage.save(current);

  const entries = await apiReadingProgressRepository.getBookProgress(bookId);

  entries.forEach((entry) => readingProgressRepository.saveProgress(entry));

  return entries[0];
}

export async function hydrateRecentReadingProgress() {
  if (import.meta.env.VITE_USE_API_AUTH !== "true") {
    return readingProgressRepository.getRecentReading();
  }

  readingProgressStorage.save({});

  const entries = await apiReadingProgressRepository.getRecent();

  entries.forEach((entry) => readingProgressRepository.saveProgress(entry));

  return entries;
}
