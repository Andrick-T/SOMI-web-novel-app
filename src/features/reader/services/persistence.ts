import type {
  ReaderPreferences,
  ReadingProgress,
} from "../../features/reader/types";

const READING_PROGRESS_KEY = "somi-reading-progress";
const READER_PREFERENCES_KEY = "somi-reader-preferences";

export const readerStorage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  write<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // no-op in restricted environments
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op in restricted environments
    }
  },
};

export const defaultReaderPreferences: ReaderPreferences = {
  theme: "light",
  fontSize: "medium",
  fontFamily: "lora",
  lineHeight: 1.8,
  readingMode: "paginated",
};

export const readerPreferencesStorage = {
  get(): ReaderPreferences {
    return readerStorage.read(READER_PREFERENCES_KEY, defaultReaderPreferences);
  },
  save(preferences: Partial<ReaderPreferences>): ReaderPreferences {
    const next = { ...defaultReaderPreferences, ...preferences };
    readerStorage.write(READER_PREFERENCES_KEY, next);
    return next;
  },
};

export const readingProgressStorage = {
  get(): Record<string, ReadingProgress> {
    return readerStorage.read<Record<string, ReadingProgress>>(
      READING_PROGRESS_KEY,
      {},
    );
  },
  save(
    progress: Record<string, ReadingProgress>,
  ): Record<string, ReadingProgress> {
    readerStorage.write(READING_PROGRESS_KEY, progress);
    return progress;
  },
};
