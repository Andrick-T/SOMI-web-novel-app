import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/http-error.js";
const publicBookSelect = {
    id: true,
    title: true,
    cover: true,
    status: true,
    author: {
        select: { email: true, profile: { select: { displayName: true } } },
    },
};
const mapBook = (book) => ({
    id: book.id,
    title: book.title,
    author: book.author.profile?.displayName ?? book.author.email,
    coverUrl: book.cover,
    status: book.status,
});
const requireUser = (user) => {
    if (!user?.id)
        throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    return user;
};
const getVisibleBook = async (bookId) => {
    const book = await prisma.book.findFirst({
        where: { id: bookId, status: "PUBLISHED" },
        select: publicBookSelect,
    });
    if (!book)
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    return book;
};
export async function listLibrary(user) {
    const currentUser = requireUser(user);
    const items = await prisma.libraryItem.findMany({
        where: { userId: currentUser.id },
        include: { book: { select: publicBookSelect } },
        orderBy: { createdAt: "desc" },
    });
    return items.map((item) => ({
        id: item.id,
        book: mapBook(item.book),
        addedAt: item.createdAt.toISOString(),
        progress: item.progress,
        lastReadAt: item.lastReadAt?.toISOString() ?? null,
    }));
}
export async function addToLibrary(user, bookId) {
    const currentUser = requireUser(user);
    const book = await getVisibleBook(bookId);
    const item = await prisma.libraryItem.upsert({
        where: { userId_bookId: { userId: currentUser.id, bookId } },
        create: { userId: currentUser.id, bookId },
        update: {},
    });
    return {
        id: item.id,
        book: mapBook(book),
        addedAt: item.createdAt.toISOString(),
    };
}
export async function removeFromLibrary(user, bookId) {
    const currentUser = requireUser(user);
    await prisma.libraryItem.deleteMany({
        where: { userId: currentUser.id, bookId },
    });
}
const mapProgress = (entry) => ({
    id: entry.id,
    bookId: entry.bookId,
    chapterId: entry.chapterId,
    progressPercent: Number(entry.progressPercentage),
    position: entry.position,
    updatedAt: entry.updatedAt.toISOString(),
    lastReadAt: entry.lastReadAt.toISOString(),
    book: entry.book ? mapBook(entry.book) : undefined,
    chapter: entry.chapter
        ? {
            id: entry.chapter.id,
            number: entry.chapter.number,
            title: entry.chapter.title,
        }
        : undefined,
});
const progressInclude = {
    book: { select: publicBookSelect },
    chapter: { select: { id: true, number: true, title: true } },
};
export async function listProgress(user) {
    const currentUser = requireUser(user);
    const entries = await prisma.readingProgress.findMany({
        where: { userId: currentUser.id },
        include: progressInclude,
        orderBy: { updatedAt: "desc" },
    });
    return entries.map(mapProgress);
}
export async function getBookProgress(user, bookId) {
    const currentUser = requireUser(user);
    await getVisibleBook(bookId);
    const entries = await prisma.readingProgress.findMany({
        where: { userId: currentUser.id, bookId },
        include: progressInclude,
        orderBy: { updatedAt: "desc" },
    });
    return entries.map(mapProgress);
}
export async function getContinueReading(user) {
    const currentUser = requireUser(user);
    const entry = await prisma.readingProgress.findFirst({
        where: {
            userId: currentUser.id,
            book: { status: "PUBLISHED" },
            chapter: { status: "PUBLISHED" },
        },
        include: progressInclude,
        orderBy: { updatedAt: "desc" },
    });
    return entry ? mapProgress(entry) : null;
}
export async function saveProgress(user, bookId, chapterId, input) {
    const currentUser = requireUser(user);
    const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, bookId, status: "PUBLISHED" },
        select: { id: true, bookId: true },
    });
    if (!chapter)
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    await getVisibleBook(bookId);
    const existing = await prisma.readingProgress.findUnique({
        where: {
            userId_bookId_chapterId: { userId: currentUser.id, bookId, chapterId },
        },
    });
    const clientUpdatedAt = input.updatedAt
        ? new Date(input.updatedAt)
        : new Date();
    if (existing && existing.lastReadAt > clientUpdatedAt)
        return mapProgress(existing);
    let entry;
    try {
        entry = await prisma.readingProgress.upsert({
            where: {
                userId_bookId_chapterId: { userId: currentUser.id, bookId, chapterId },
            },
            create: {
                userId: currentUser.id,
                bookId,
                chapterId,
                progressPercentage: input.progressPercent,
                position: input.position,
                lastReadAt: clientUpdatedAt,
            },
            update: {
                progressPercentage: input.progressPercent,
                position: input.position,
                lastReadAt: clientUpdatedAt,
            },
            include: progressInclude,
        });
    }
    catch (error) {
        if (!(error instanceof Error) ||
            !error.message.includes("ReadingProgress_userId_bookId_chapterId_key"))
            throw error;
        entry = await prisma.readingProgress.findUniqueOrThrow({
            where: {
                userId_bookId_chapterId: { userId: currentUser.id, bookId, chapterId },
            },
            include: progressInclude,
        });
    }
    await prisma.libraryItem.updateMany({
        where: { userId: currentUser.id, bookId },
        data: {
            progress: Math.round(input.progressPercent),
            lastReadAt: new Date(),
        },
    });
    return mapProgress(entry);
}
