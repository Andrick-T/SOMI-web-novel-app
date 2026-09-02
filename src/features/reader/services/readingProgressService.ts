import type { ReadingProgress } from "../types";
import { readingProgressStorage } from "./persistence";

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
    return state[`${this.namespace}:progress`]
      ? state[`${this.namespace}:progress`]
      : state;
  }

  private writeAll(value: Record<string, ReadingProgress>) {
    const state = readingProgressStorage.get();
    state[`${this.namespace}:progress`] = value;
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
    const next = { ...all, [key]: progress };
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
  return readingProgressRepository.saveProgress(progress);
}
