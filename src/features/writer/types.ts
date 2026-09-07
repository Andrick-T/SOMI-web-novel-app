export const PUBLICATION_STATUSES = [
  "DRAFT",
  "EDITING",
  "PROOFREADING",
  "READY_FOR_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "UNPUBLISHED",
  "ARCHIVED",
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const CHAPTER_STATUSES = [...PUBLICATION_STATUSES] as const;
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number];

export type WriterRole = "writer" | "editor" | "admin";
export type WriterAccessType = "FREE" | "PREMIUM";
export type SaveStatus = "CLEAN" | "DIRTY" | "SAVING" | "SAVED" | "ERROR";

export interface ValidationError {
  field: string;
  message: string;
}

export interface WriterProfile {
  id: string;
  userId: string;
  displayName: string;
  penName: string;
  bio: string;
  avatar: string;
  banner: string;
  genres: string[];
  socialLinks: Record<string, string>;
  totalBooks: number;
  totalReads: number;
  totalFollowers: number;
  totalEarnings: number;
}

export interface Series {
  id: string;
  writerId: string;
  title: string;
  slug: string;
  description: string;
  cover: string;
  genres: string[];
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  bookIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Revision {
  id: string;
  entityId: string;
  entityType: "book" | "chapter" | "draft";
  version: number;
  authorId: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface WriterDraft {
  id: string;
  bookId: string;
  writerId: string;
  version: number;
  title: string;
  synopsis: string;
  genres: string[];
  tags: string[];
  cover: string;
  updatedAt: string;
  status: PublicationStatus;
}

export interface WriterChapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
  accessType: WriterAccessType;
  price: number;
  status: ChapterStatus;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  contentVersion?: number;
}

export interface WriterBook {
  id: string;
  writerId: string;
  title: string;
  subtitle: string;
  penName: string;
  synopsis: string;
  genres: string[];
  tags: string[];
  status: PublicationStatus;
  seriesId?: string;
  seriesPosition?: number;
  audience: "general" | "young-adult" | "adult";
  contentWarnings: string[];
  publishingStrategy: "serial" | "full-run" | "scheduled";
  cover: string;
  heroImage: string;
  freeChapters: number;
  chapterPricing: number;
  isStandalone: boolean;
  createdAt: string;
  updatedAt: string;
  chapters: WriterChapter[];
  draft?: WriterDraft;
  publication?: {
    scheduledAt?: string;
    timezone?: string;
  };
}

export interface WriterAnalytics {
  bookId: string;
  views: number;
  uniqueReaders: number;
  chapterReads: number;
  completionRate: number;
  favorites: number;
  libraryAdds: number;
  averageReadingTime: number;
  earnings: number;
}

export interface WriterEarnings {
  writerId: string;
  grossEarnings: number;
  platformFees: number;
  netEarnings: number;
  pending: number;
  available: number;
  paidOut: number;
}

export interface WriterPermissionContext {
  writerId: string;
  ownerId: string;
  permission?: WriterRole;
}

export interface WriterValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface WriterAutosaveState {
  status: SaveStatus;
  savedAt?: string;
  error?: string;
}

export interface WriterDashboardSummary {
  draftCount: number;
  inReviewCount: number;
  scheduledCount: number;
  publishedCount: number;
  totalReaders: number;
  totalEarnings: number;
  continueReading: Array<{
    bookId: string;
    chapterId: string;
    title: string;
    updatedAt: string;
  }>;
}
