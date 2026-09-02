import { books } from "../../data/books";
import type { ReadingProgress } from "../../features/reader/types";

const storageKey = "somi-reading-progress";

const initialProgress: Record<string, ReadingProgress> = {
  "midnight-throne": {
    userId: "guest-user",
    bookId: "midnight-throne",
    chapterId: "mt-c1",
    page: 1,
    progressPercentage: 68,
    lastReadAt: "2 hours ago",
  },
  "sins-of-father": {
    userId: "guest-user",
    bookId: "sins-of-father",
    chapterId: "sf-c2",
    page: 1,
    progressPercentage: 32,
    lastReadAt: "Yesterday",
  },
  "baobab-kingdom": {
    userId: "guest-user",
    bookId: "baobab-kingdom",
    chapterId: "bk-c1",
    page: 1,
    progressPercentage: 15,
    lastReadAt: "3 days ago",
  },
};

const readStore = (): Record<string, ReadingProgress> => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored
      ? { ...initialProgress, ...JSON.parse(stored) }
      : initialProgress;
  } catch {
    return initialProgress;
  }
};

const writeStore = (progress: Record<string, ReadingProgress>) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // no-op in mocked environment until real persistence is introduced.
  }
};

export const readingProgressRepository = {
  getReadingProgress: () => readStore(),
  getProgressForBook: (bookId: string) => {
    const all = readStore();
    return all[bookId] ?? undefined;
  },
  saveProgress: (bookId: string, entry: ReadingProgress) => {
    const next = readStore();
    next[bookId] = entry;
    writeStore(next);
    return entry;
  },
  getCurrentPageForBook: (bookId: string) => {
    const progress = readingProgressRepository.getProgressForBook(bookId);
    return progress?.page ?? 1;
  },
  getRepresentativeBooks: () => {
    return books.filter((book) => book.id in readStore());
  },
};
