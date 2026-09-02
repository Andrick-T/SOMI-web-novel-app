import type {
  Revision,
  Series,
  WriterAnalytics,
  WriterBook,
  WriterChapter,
  WriterDashboardSummary,
  WriterDraft,
  WriterEarnings,
  WriterProfile,
} from "./types";
import { canTransitionPublication } from "./service";

export const writerProfile: WriterProfile = {
  id: "writer-1",
  userId: "user-reader-01",
  displayName: "Kemi Nwosu",
  penName: "Kemi N. Osei",
  bio: "Award-winning novelist exploring myth, memory, and the pulse of contemporary African life.",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  banner:
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
  genres: ["Fantasy", "Literary Fiction", "Mystery"],
  socialLinks: {
    website: "https://kemi.example",
    goodreads: "https://goodreads.example",
  },
  totalBooks: 4,
  totalReads: 96000,
  totalFollowers: 3120,
  totalEarnings: 8420,
};

export const writerSeries: Series[] = [
  {
    id: "series-baobab",
    writerId: "writer-1",
    title: "The Baobab Cycle",
    slug: "baobab-cycle",
    description:
      "An interwoven saga of myth, memory, and kingdom torn between old roots and new futures.",
    cover:
      "https://images.unsplash.com/photo-1627850466138-87ae3848532b?auto=format&fit=crop&w=800&q=80",
    genres: ["Fantasy"],
    status: "ACTIVE",
    bookIds: ["baobab-kingdom"],
    createdAt: "2024-01-14T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
  },
];

const makeChapter = (
  bookId: string,
  number: number,
  title: string,
  overrides: Partial<WriterChapter> = {},
): WriterChapter => ({
  id: `${bookId}-ch-${number}`,
  bookId,
  number,
  title,
  content: overrides.content ?? "",
  wordCount: overrides.wordCount ?? 0,
  readingTime: overrides.readingTime ?? 0,
  accessType: overrides.accessType ?? "FREE",
  price: overrides.price ?? 0,
  status: overrides.status ?? "DRAFT",
  publishedAt: overrides.publishedAt,
  scheduledAt: overrides.scheduledAt,
  createdAt: overrides.createdAt ?? "2024-04-01T00:00:00.000Z",
  updatedAt: overrides.updatedAt ?? "2024-04-01T00:00:00.000Z",
});

const bookSeed: WriterBook[] = [
  {
    id: "baobab-kingdom",
    writerId: "writer-1",
    title: "The Baobab Kingdom",
    subtitle: "The roots remember",
    penName: "Kemi N. Osei",
    synopsis:
      "Deep in the ancient forest, Kemi discovers she can hear the memory of the trees, and the kingdom beneath the soil begins to wake.",
    genres: ["Fantasy", "Adventure"],
    tags: ["magic", "forest", "royalty"],
    status: "DRAFT",
    seriesId: "series-baobab",
    seriesPosition: 1,
    audience: "young-adult",
    contentWarnings: ["Violence"],
    publishingStrategy: "serial",
    cover:
      "https://images.unsplash.com/photo-1627850466138-87ae3848532b?auto=format&fit=crop&w=600&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1627850466138-87ae3848532b?auto=format&fit=crop&w=1200&q=80",
    freeChapters: 3,
    chapterPricing: 80,
    isStandalone: false,
    createdAt: "2024-02-10T00:00:00.000Z",
    updatedAt: "2024-06-20T00:00:00.000Z",
    chapters: [
      makeChapter("baobab-kingdom", 1, "Grandfather Root", {
        content: "The baobab grove was silent the morning everything changed.",
        wordCount: 2400,
        readingTime: 10,
        accessType: "FREE",
        status: "PUBLISHED",
      }),
      makeChapter("baobab-kingdom", 2, "The Voice in the Bark", {
        content:
          "She returned to the grove before sunrise, a question burning in her chest.",
        wordCount: 2100,
        readingTime: 9,
        accessType: "FREE",
        status: "PUBLISHED",
      }),
      makeChapter("baobab-kingdom", 3, "The Three Roads", {
        content: "The elders met and something in the air shifted.",
        wordCount: 2800,
        readingTime: 12,
        accessType: "PREMIUM",
        status: "READY_FOR_REVIEW",
        price: 80,
      }),
    ],
    draft: {
      id: "draft-baobab-1",
      bookId: "baobab-kingdom",
      writerId: "writer-1",
      version: 7,
      title: "The Baobab Kingdom",
      synopsis:
        "Deep in the ancient forest, Kemi discovers she can hear the memory of the trees, and the kingdom beneath the soil begins to wake.",
      genres: ["Fantasy", "Adventure"],
      tags: ["magic", "forest", "royalty"],
      cover:
        "https://images.unsplash.com/photo-1627850466138-87ae3848532b?auto=format&fit=crop&w=600&q=80",
      updatedAt: "2024-06-20T00:00:00.000Z",
      status: "EDITING",
    },
  },
  {
    id: "echoes-of-kongo",
    writerId: "writer-1",
    title: "Echoes of Kongo",
    subtitle: "Stories carved in memory",
    penName: "Kemi N. Osei",
    synopsis:
      "An archivist uncovers a hidden map that leads to a conspiracy stretching across centuries.",
    genres: ["African Culture", "Mystery"],
    tags: ["archive", "history"],
    status: "APPROVED",
    audience: "adult",
    contentWarnings: [],
    publishingStrategy: "scheduled",
    cover:
      "https://images.unsplash.com/photo-1772289935653-f5a7950205cf?auto=format&fit=crop&w=600&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1772289935653-f5a7950205cf?auto=format&fit=crop&w=1200&q=80",
    freeChapters: 2,
    chapterPricing: 120,
    isStandalone: true,
    createdAt: "2024-03-18T00:00:00.000Z",
    updatedAt: "2024-06-18T00:00:00.000Z",
    chapters: [
      makeChapter("echoes-of-kongo", 1, "The Drum's Secret", {
        content: "Chioma had catalogued ten thousand artifacts.",
        wordCount: 2200,
        readingTime: 9,
        accessType: "FREE",
        status: "PUBLISHED",
      }),
      makeChapter("echoes-of-kongo", 2, "600 Years of Silence", {
        content: "The map was drawn in something that was not quite ink.",
        wordCount: 2500,
        readingTime: 10,
        accessType: "PREMIUM",
        status: "SCHEDULED",
        price: 120,
      }),
    ],
  },
];

const revisions: Revision[] = [
  {
    id: "rev-1",
    entityId: "baobab-kingdom",
    entityType: "book",
    version: 7,
    authorId: "writer-1",
    snapshot: { title: "The Baobab Kingdom" },
    createdAt: "2024-06-20T00:00:00.000Z",
  },
  {
    id: "rev-2",
    entityId: "baobab-kingdom-ch-3",
    entityType: "chapter",
    version: 3,
    authorId: "writer-1",
    snapshot: { title: "The Three Roads" },
    createdAt: "2024-06-19T00:00:00.000Z",
  },
];

export const writerRepository = {
  getWriterProfile: (): WriterProfile => writerProfile,
  getWriterBooks: (): WriterBook[] => [...bookSeed],
  getBook: (bookId: string): WriterBook | undefined =>
    bookSeed.find((book) => book.id === bookId),
  createBook: (input: Partial<WriterBook>): WriterBook => {
    const now = new Date().toISOString();
    const created: WriterBook = {
      id: input.id ?? `book-${Date.now()}`,
      writerId: input.writerId ?? writerProfile.id,
      title: input.title ?? "Untitled Book",
      subtitle: input.subtitle ?? "",
      penName: input.penName ?? writerProfile.penName,
      synopsis: input.synopsis ?? "",
      genres: input.genres ?? ["Fantasy"],
      tags: input.tags ?? [],
      status: input.status ?? "DRAFT",
      audience: input.audience ?? "general",
      contentWarnings: input.contentWarnings ?? [],
      publishingStrategy: input.publishingStrategy ?? "serial",
      cover:
        input.cover ??
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
      heroImage:
        input.heroImage ??
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
      freeChapters: input.freeChapters ?? 0,
      chapterPricing: input.chapterPricing ?? 80,
      isStandalone: input.isStandalone ?? true,
      createdAt: now,
      updatedAt: now,
      chapters: input.chapters ?? [],
      draft: input.draft,
    };

    bookSeed.unshift(created);
    return created;
  },
  updateBookDraft: (bookId: string, draft: WriterDraft): WriterDraft => {
    const matched = bookSeed.find((book) => book.id === bookId);
    if (!matched) {
      throw new Error(`Book ${bookId} not found.`);
    }
    matched.draft = draft;
    matched.updatedAt = new Date().toISOString();
    return draft;
  },
  deleteDraft: (bookId: string): void => {
    const matched = bookSeed.find((book) => book.id === bookId);
    if (matched) {
      matched.draft = undefined;
    }
  },
  getChapters: (bookId: string): WriterChapter[] =>
    bookSeed.find((book) => book.id === bookId)?.chapters ?? [],
  getChapter: (bookId: string, chapterId: string): WriterChapter | undefined =>
    bookSeed
      .find((book) => book.id === bookId)
      ?.chapters.find((chapter) => chapter.id === chapterId),
  saveChapterDraft: (bookId: string, chapter: WriterChapter): WriterChapter => {
    const matched = bookSeed.find((book) => book.id === bookId);
    if (!matched) {
      throw new Error(`Book ${bookId} not found.`);
    }

    const index = matched.chapters.findIndex(
      (entry) => entry.id === chapter.id,
    );
    if (index >= 0) {
      matched.chapters[index] = {
        ...matched.chapters[index],
        ...chapter,
        updatedAt: new Date().toISOString(),
      };
      return matched.chapters[index];
    }

    matched.chapters.push(chapter);
    return chapter;
  },
  createChapter: (
    bookId: string,
    chapterInput: Partial<WriterChapter>,
  ): WriterChapter => {
    const book = bookSeed.find((entry) => entry.id === bookId);
    if (!book) {
      throw new Error(`Book ${bookId} not found.`);
    }

    const nextNumber = (book.chapters.at(-1)?.number ?? 0) + 1;
    const chapter: WriterChapter = {
      id: chapterInput.id ?? `${bookId}-ch-${nextNumber}`,
      bookId,
      number: chapterInput.number ?? nextNumber,
      title: chapterInput.title ?? `Chapter ${nextNumber}`,
      content: chapterInput.content ?? "",
      wordCount: chapterInput.wordCount ?? 0,
      readingTime: chapterInput.readingTime ?? 0,
      accessType: chapterInput.accessType ?? "FREE",
      price: chapterInput.price ?? 0,
      status: chapterInput.status ?? "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    book.chapters.push(chapter);
    return chapter;
  },
  deleteChapter: (bookId: string, chapterId: string): void => {
    const book = bookSeed.find((entry) => entry.id === bookId);
    if (!book) return;
    book.chapters = book.chapters.filter((chapter) => chapter.id !== chapterId);
  },
  getRevisions: (entityId: string): Revision[] =>
    revisions.filter(
      (revision) =>
        revision.entityId.startsWith(entityId) ||
        revision.entityId === entityId,
    ),
  getDashboardSummary: (): WriterDashboardSummary => {
    const books = bookSeed;
    const draftCount = books.filter(
      (book) => book.status === "DRAFT" || book.status === "EDITING",
    ).length;
    const inReviewCount = books.filter((book) =>
      ["PROOFREADING", "READY_FOR_REVIEW"].includes(book.status),
    ).length;
    const scheduledCount = books.filter(
      (book) => book.status === "SCHEDULED",
    ).length;
    const publishedCount = books.filter(
      (book) => book.status === "PUBLISHED",
    ).length;
    const totalReaders = books.reduce(
      (sum, book) => sum + book.chapters.length * 320,
      0,
    );
    const totalEarnings = books.reduce(
      (sum, book) =>
        sum + book.chapterPricing * Math.max(1, book.chapters.length),
      0,
    );

    return {
      draftCount,
      inReviewCount,
      scheduledCount,
      publishedCount,
      totalReaders,
      totalEarnings,
      continueReading: books.slice(0, 2).map((book) => ({
        bookId: book.id,
        chapterId: book.chapters[0]?.id ?? "",
        title: `${book.title} · ${book.chapters[0]?.title ?? "Draft"}`,
        updatedAt: book.updatedAt,
      })),
    };
  },
  getAnalytics: (): WriterAnalytics[] =>
    bookSeed.map((book) => ({
      bookId: book.id,
      views: book.chapters.length * 840,
      uniqueReaders: book.chapters.length * 320,
      chapterReads: book.chapters.length * 540,
      completionRate: 72,
      favorites: 120 + book.chapters.length * 40,
      libraryAdds: 180 + book.chapters.length * 24,
      averageReadingTime: 12,
      earnings: book.chapterPricing * Math.max(1, book.chapters.length),
    })),
  getEarnings: (): WriterEarnings => ({
    writerId: writerProfile.id,
    grossEarnings: 12850,
    platformFees: 2130,
    netEarnings: 10720,
    pending: 1620,
    available: 9080,
    paidOut: 640,
  }),
};

export const mockWriterBooks = bookSeed;
