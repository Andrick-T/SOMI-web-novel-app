import type {
  AdminBookSummary,
  AdminModerationStatus,
  AdminUserSummary,
} from "./admin.types.js";

const toDateString = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null;

export const mapUserSummary = (user: {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  profile: { displayName: string | null; avatar: string | null } | null;
  _count?: {
    books: number;
    libraryItems: number;
    readings: number;
    transactions: number;
  };
  booksPublished?: number;
}): AdminUserSummary => {
  const displayName = user.profile?.displayName ?? null;
  return {
    id: user.id,
    name: displayName ?? user.username ?? user.email.split("@")[0],
    displayName,
    email: user.email,
    role: user.role as AdminUserSummary["role"],
    status: user.status as AdminUserSummary["status"],
    createdAt: toDateString(user.createdAt) ?? new Date().toISOString(),
    joinedAt: toDateString(user.createdAt) ?? new Date().toISOString(),
    lastActiveAt:
      toDateString(user.lastLoginAt ?? user.createdAt) ??
      new Date().toISOString(),
    booksPublished: user.booksPublished ?? user._count?.books ?? 0,
    avatar: user.profile?.avatar ?? null,
    metadata: {
      username: user.username,
      totalBooks: user._count?.books ?? user.booksPublished ?? 0,
      libraryCount: user._count?.libraryItems ?? 0,
      readingProgressCount: user._count?.readings ?? 0,
      transactionCount: user._count?.transactions ?? 0,
    },
  };
};

export const resolveModerationStatus = (
  bookStatus: string,
  latestSubmissionStatus?: string | null,
): AdminModerationStatus => {
  const effective = latestSubmissionStatus ?? bookStatus;
  switch (effective) {
    case "PUBLISHED":
      return "APPROVED";
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "READY_FOR_SUBMISSION":
    case "READY_FOR_REVIEW":
      return "PENDING";
    case "APPROVED":
      return "APPROVED";
    case "REJECTED":
    case "UNPUBLISHED":
      return "REJECTED";
    case "EDITING":
      return "CHANGES_REQUESTED";
    case "PROOFREADING":
      return "PENDING";
    case "DRAFT":
      return "DRAFT";
    case "SCHEDULED":
      return "SCHEDULED";
    case "ARCHIVED":
      return "ARCHIVED";
    default:
      return bookStatus as AdminModerationStatus;
  }
};

export const mapBookSummary = (book: {
  id: string;
  title: string;
  authorId: string;
  author: {
    id: string;
    email: string;
    profile: { displayName: string | null } | null;
  };
  genres: Array<{ genre: { name: string } }>;
  tags: Array<{ tag: { name: string } }>;
  chapters: Array<unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  cover: string | null;
  slug: string;
  synopsis: string | null;
  submissions?: Array<{
    status: string | null;
    rejectionReason: string | null;
    submittedAt: Date | null;
  }>;
}): AdminBookSummary => {
  const latestSubmission = book.submissions?.[0] ?? null;
  const writerName =
    book.author.profile?.displayName ?? book.author.email.split("@")[0];
  const genreName = book.genres[0]?.genre?.name ?? "Unassigned";

  return {
    id: book.id,
    title: book.title,
    writer: writerName,
    writerId: book.authorId,
    genre: genreName,
    chapters: book.chapters.length,
    status: book.status,
    moderationStatus: resolveModerationStatus(
      book.status,
      latestSubmission?.status ?? null,
    ),
    priority: null,
    reported: false,
    reportsCount: 0,
    createdAt: toDateString(book.createdAt) ?? new Date().toISOString(),
    updatedAt: toDateString(book.updatedAt) ?? new Date().toISOString(),
    submittedAt: toDateString(
      latestSubmission?.submittedAt ?? book.publishedAt,
    ),
    cover: book.cover,
    metadata: {
      slug: book.slug,
      synopsis: book.synopsis,
      tags: book.tags.map((item) => item.tag.name),
      genres: book.genres.map((item) => item.genre.name),
      submissionStatus: latestSubmission?.status ?? null,
      lastReviewReason: latestSubmission?.rejectionReason ?? null,
    },
  };
};
