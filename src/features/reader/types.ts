export type ReaderTheme = "light" | "sepia" | "dark";
export type ReaderFontSize = "small" | "medium" | "large" | "xlarge";
export type ReaderFontFamily = "lora" | "fraunces" | "nunito";
export type ReaderMode = "scroll" | "paginated";
export type ReaderState =
  | "idle"
  | "loading"
  | "ready"
  | "flipping"
  | "locked"
  | "error"
  | "completed";

export interface ReadingSession {
  userId: string;
  bookId: string;
  chapterId: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  startedAt: string;
  lastReadAt: string;
}

export interface ReadingProgress {
  userId: string;
  bookId: string;
  chapterId: string;
  page: number;
  totalPages: number;
  progressPercentage: number;
  lastReadAt: string;
}

export interface ReaderPreferences {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  fontFamily: ReaderFontFamily;
  lineHeight: number;
  readingMode: ReaderMode;
}

export interface ReaderPage {
  pageNumber: number;
  content: string;
}

export interface ReaderStateModel {
  status: ReaderState;
  currentPage: number;
  pageCount: number;
  isFlipping: boolean;
  lockedReason?: string;
}
