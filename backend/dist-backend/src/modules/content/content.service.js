import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/http-error.js";
const PUBLIC_BOOK_STATUS = "PUBLISHED";
const isOwnerView = (viewer, ownerId) => viewer?.id === ownerId;
const normalizeGenreNames = (items) => items.map((item) => item.genre.name);
const normalizeTagNames = (items) => items.map((item) => item.tag.name);
const bookSelectors = {
    author: {
        select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
        },
    },
    genres: { include: { genre: true } },
    tags: { include: { tag: true } },
    chapters: {
        orderBy: { number: "asc" },
        select: {
            id: true,
            number: true,
            title: true,
            status: true,
            publishedAt: true,
            accessType: true,
            price: true,
            contentVersion: true,
        },
    },
};
const chapterSelectors = {
    book: {
        select: { id: true, title: true, slug: true, status: true, authorId: true },
    },
};
const mapBook = (book, includePrivate = false) => {
    const visibleChapters = !includePrivate
        ? book.chapters.filter((chapter) => chapter.status === "PUBLISHED")
        : book.chapters;
    return {
        id: book.id,
        authorId: book.authorId,
        title: book.title,
        slug: book.slug,
        synopsis: book.synopsis,
        cover: book.cover,
        heroImage: book.heroImage,
        status: book.status,
        rating: Number(book.rating ?? 0),
        views: Number(book.views ?? 0),
        unlocks: Number(book._count?.entitlements ?? 0),
        favorites: Number(book.favorites ?? 0),
        totalChapters: Number(book.totalChapters ?? visibleChapters.length),
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        publishedAt: book.publishedAt ? book.publishedAt.toISOString() : null,
        author: {
            id: book.author.id,
            email: book.author.email,
            displayName: book.author.profile?.displayName ?? book.author.email.split("@")[0],
        },
        genres: normalizeGenreNames(book.genres ?? []),
        tags: normalizeTagNames(book.tags ?? []),
        chapters: visibleChapters.map((chapter) => ({
            id: chapter.id,
            number: chapter.number,
            title: chapter.title,
            status: chapter.status,
            publishedAt: chapter.publishedAt
                ? chapter.publishedAt.toISOString()
                : null,
            accessType: chapter.accessType,
            price: chapter.price,
            ...(includePrivate ? { contentVersion: chapter.contentVersion } : {}),
        })),
    };
};
const mapChapter = (chapter, accessState) => ({
    id: chapter.id,
    bookId: chapter.bookId,
    book: chapter.book
        ? {
            id: chapter.book.id,
            title: chapter.book.title,
            slug: chapter.book.slug,
            status: chapter.book.status,
        }
        : undefined,
    title: chapter.title,
    number: chapter.number,
    content: accessState === "LOCKED" ? "" : chapter.content,
    status: chapter.status,
    accessType: chapter.accessType,
    price: chapter.price,
    wordCount: chapter.wordCount,
    readingTime: chapter.readingTime,
    publishedAt: chapter.publishedAt ? chapter.publishedAt.toISOString() : null,
    createdAt: chapter.createdAt.toISOString(),
    updatedAt: chapter.updatedAt.toISOString(),
    contentVersion: chapter.contentVersion,
});
const assertAuthorOrAdmin = (viewer, ownerId) => {
    if (!viewer)
        throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    if (viewer.role.toUpperCase() === "ADMIN" || viewer.id === ownerId)
        return;
    throw new AppError(403, "FORBIDDEN", "You do not have permission to perform this action.");
};
export async function getPublicBooks() {
    const books = await prisma.book.findMany({
        where: { status: PUBLIC_BOOK_STATUS },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    profile: { select: { displayName: true } },
                },
            },
            genres: { include: { genre: true } },
            tags: { include: { tag: true } },
            chapters: {
                where: { status: "PUBLISHED" },
                orderBy: { number: "asc" },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: true,
                    publishedAt: true,
                    accessType: true,
                    price: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return books.map((book) => mapBook(book, false));
}
export async function getWriterBooks(writerId) {
    const books = await prisma.book.findMany({
        where: { authorId: writerId },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    profile: { select: { displayName: true } },
                },
            },
            genres: { include: { genre: true } },
            tags: { include: { tag: true } },
            chapters: {
                orderBy: { number: "asc" },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: true,
                    publishedAt: true,
                    accessType: true,
                    price: true,
                    contentVersion: true,
                },
            },
            _count: {
                select: {
                    entitlements: true,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
    return books.map((book) => mapBook(book, true));
}
export async function getBookDetail(bookId, viewer) {
    const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    profile: { select: { displayName: true } },
                },
            },
            genres: { include: { genre: true } },
            tags: { include: { tag: true } },
            chapters: {
                orderBy: { number: "asc" },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: true,
                    publishedAt: true,
                    accessType: true,
                    price: true,
                    content: true,
                    contentVersion: true,
                },
            },
        },
    });
    if (!book)
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    if (viewer && isOwnerView(viewer, book.authorId)) {
        return mapBook(book, true);
    }
    if (book.status !== PUBLIC_BOOK_STATUS) {
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }
    return mapBook(book, false);
}
export async function getGenres() {
    return prisma.genre.findMany({
        orderBy: {
            name: "asc",
        },
        select: {
            id: true,
            name: true,
        },
    });
}
export async function getTags() {
    return prisma.tag.findMany({
        orderBy: {
            name: "asc",
        },
        select: {
            id: true,
            name: true,
        },
    });
}
export async function createBook(writer, input) {
    if (!writer || !writer.id)
        throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    if (writer.role.toUpperCase() !== "WRITER" &&
        writer.role.toUpperCase() !== "ADMIN") {
        throw new AppError(403, "FORBIDDEN", "You do not have permission to perform this action.");
    }
    const slugExists = await prisma.book.findUnique({
        where: { slug: input.slug },
    });
    if (slugExists)
        throw new AppError(409, "BOOK_ALREADY_EXISTS", "A book with this slug already exists.");
    const genreIds = await resolveAssociationIds(input.genres ?? [], "Genre");
    const tagIds = await resolveAssociationIds(input.tags ?? [], "Tag");
    const book = await prisma.$transaction(async (tx) => {
        const created = await tx.book.create({
            data: {
                authorId: writer.id,
                title: input.title,
                slug: input.slug,
                synopsis: input.synopsis ?? null,
                cover: input.cover ?? null,
                heroImage: input.heroImage ?? null,
                status: "DRAFT",
            },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                chapters: {
                    orderBy: { number: "asc" },
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: true,
                        publishedAt: true,
                        accessType: true,
                        price: true,
                        contentVersion: true,
                    },
                },
            },
        });
        if (genreIds.length > 0) {
            await tx.bookGenre.createMany({
                data: genreIds.map((genreId) => ({ bookId: created.id, genreId })),
                skipDuplicates: true,
            });
        }
        if (tagIds.length > 0) {
            await tx.bookTag.createMany({
                data: tagIds.map((tagId) => ({ bookId: created.id, tagId })),
                skipDuplicates: true,
            });
        }
        const refreshed = await tx.book.findUniqueOrThrow({
            where: { id: created.id },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                chapters: {
                    orderBy: { number: "asc" },
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: true,
                        publishedAt: true,
                        accessType: true,
                        price: true,
                        contentVersion: true,
                    },
                },
            },
        });
        return refreshed;
    });
    return mapBook(book, true);
}
export async function updateBook(writer, bookId, input) {
    const existing = await prisma.book.findUnique({
        where: { id: bookId },
        include: { author: true, genres: true, tags: true },
    });
    if (!existing)
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    assertAuthorOrAdmin(writer, existing.authorId);
    if (input.status === "PUBLISHED" && writer?.role.toUpperCase() !== "ADMIN") {
        throw new AppError(409, "INVALID_STATE_TRANSITION", "Writers must submit a book for review before publication.");
    }
    if (input.slug && input.slug !== existing.slug) {
        const duplicate = await prisma.book.findUnique({
            where: { slug: input.slug },
        });
        if (duplicate && duplicate.id !== bookId)
            throw new AppError(409, "BOOK_ALREADY_EXISTS", "A book with this slug already exists.");
    }
    const genreIds = input.genres !== undefined
        ? await resolveAssociationIds(input.genres, "Genre")
        : undefined;
    const tagIds = input.tags !== undefined
        ? await resolveAssociationIds(input.tags, "Tag")
        : undefined;
    const updated = await prisma.$transaction(async (tx) => {
        const data = { ...input };
        if (input.status === "PUBLISHED") {
            data.publishedAt = new Date();
        }
        else if (input.status === "UNPUBLISHED" || input.status === "DRAFT") {
            data.publishedAt = null;
        }
        delete data.genres;
        delete data.tags;
        const result = await tx.book.update({
            where: { id: bookId },
            data,
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                chapters: {
                    orderBy: { number: "asc" },
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: true,
                        publishedAt: true,
                        accessType: true,
                        price: true,
                        contentVersion: true,
                    },
                },
            },
        });
        if (genreIds !== undefined) {
            await tx.bookGenre.deleteMany({ where: { bookId } });
            if (genreIds.length > 0) {
                await tx.bookGenre.createMany({
                    data: genreIds.map((genreId) => ({ bookId, genreId })),
                    skipDuplicates: true,
                });
            }
        }
        if (tagIds !== undefined) {
            await tx.bookTag.deleteMany({ where: { bookId } });
            if (tagIds.length > 0) {
                await tx.bookTag.createMany({
                    data: tagIds.map((tagId) => ({ bookId, tagId })),
                    skipDuplicates: true,
                });
            }
        }
        return tx.book.findUniqueOrThrow({
            where: { id: bookId },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                chapters: {
                    orderBy: { number: "asc" },
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: true,
                        publishedAt: true,
                        accessType: true,
                        price: true,
                        contentVersion: true,
                    },
                },
            },
        });
    });
    return mapBook(updated, true);
}
export async function deleteBook(writer, bookId) {
    const existing = await prisma.book.findUnique({ where: { id: bookId } });
    if (!existing)
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    assertAuthorOrAdmin(writer, existing.authorId);
    await prisma.book.delete({ where: { id: bookId } });
}
export async function getPublicChapters(bookId) {
    const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
            chapters: {
                where: { status: "PUBLISHED" },
                orderBy: { number: "asc" },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            status: true,
                            authorId: true,
                        },
                    },
                },
            },
        },
    });
    if (!book || book.status !== PUBLIC_BOOK_STATUS) {
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }
    return book.chapters.map((chapter) => mapChapter(chapter));
}
export async function getChapterDetail(bookId, chapterId, viewer) {
    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
            book: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    authorId: true,
                },
            },
        },
    });
    if (!chapter || chapter.bookId !== bookId) {
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    }
    if (viewer && viewer.id === chapter.book.authorId) {
        return mapChapter(chapter);
    }
    if (chapter.status !== "PUBLISHED") {
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    }
    if (chapter.accessType !== "PREMIUM")
        return mapChapter(chapter, "FREE");
    if (chapter.book.status !== PUBLIC_BOOK_STATUS) {
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    }
    const entitlement = viewer
        ? await prisma.chapterEntitlement.findUnique({
            where: { userId_chapterId: { userId: viewer.id, chapterId } },
        })
        : null;
    return mapChapter(chapter, entitlement ? "UNLOCKED" : "LOCKED");
}
export async function createChapter(writer, bookId, input) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }
    assertAuthorOrAdmin(writer, book.authorId);
    const duplicate = await prisma.chapter.findUnique({
        where: { bookId_number: { bookId, number: input.number } },
    });
    if (duplicate) {
        throw new AppError(409, "CHAPTER_NUMBER_CONFLICT", "A chapter with this number already exists for this book.");
    }
    const chapter = await prisma.$transaction(async (tx) => {
        const created = await tx.chapter.create({
            data: {
                bookId,
                title: input.title,
                number: input.number,
                content: input.content,
                status: "DRAFT",
                accessType: input.accessType ?? "FREE",
                price: input.price ?? 0,
                wordCount: input.content.trim().split(/\s+/).filter(Boolean).length,
                readingTime: Math.max(1, Math.ceil(input.content.trim().split(/\s+/).filter(Boolean).length / 200)),
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                        authorId: true,
                    },
                },
            },
        });
        await tx.book.update({
            where: { id: bookId },
            data: { totalChapters: { increment: 1 } },
        });
        return created;
    });
    return mapChapter(chapter);
}
export async function getWriterChapters(writer, bookId) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book)
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    assertAuthorOrAdmin(writer, book.authorId);
    const chapters = await prisma.chapter.findMany({
        where: { bookId },
        include: {
            book: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    authorId: true,
                },
            },
        },
        orderBy: { number: "asc" },
    });
    return chapters.map((chapter) => mapChapter(chapter));
}
export async function updateChapter(writer, bookId, chapterId, input) {
    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: { book: true },
    });
    if (!chapter || chapter.bookId !== bookId)
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    assertAuthorOrAdmin(writer, chapter.book.authorId);
    if (input.status === "PUBLISHED" && writer?.role.toUpperCase() !== "ADMIN") {
        throw new AppError(409, "INVALID_STATE_TRANSITION", "Writers must submit a chapter for review before publication.");
    }
    if (typeof input.number === "number" && input.number !== chapter.number) {
        const duplicate = await prisma.chapter.findUnique({
            where: { bookId_number: { bookId, number: input.number } },
        });
        if (duplicate && duplicate.id !== chapterId)
            throw new AppError(409, "CHAPTER_NUMBER_CONFLICT", "A chapter with this number already exists for this book.");
    }
    const data = { ...input };
    if (typeof input.content === "string") {
        data.wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;
        data.readingTime = Math.max(1, Math.ceil(data.wordCount / 200));
    }
    if (input.status === "PUBLISHED") {
        data.publishedAt = new Date();
    }
    else if (input.status === "UNPUBLISHED" || input.status === "DRAFT") {
        data.publishedAt = null;
    }
    const updated = await prisma.chapter.update({
        where: { id: chapterId },
        data,
        include: {
            book: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    authorId: true,
                },
            },
        },
    });
    return mapChapter(updated);
}
export async function deleteChapter(writer, bookId, chapterId) {
    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: { book: true },
    });
    if (!chapter || chapter.bookId !== bookId)
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    assertAuthorOrAdmin(writer, chapter.book.authorId);
    await prisma.chapter.delete({ where: { id: chapterId } });
    await prisma.book.update({
        where: { id: bookId },
        data: { totalChapters: { decrement: 1 } },
    });
}
async function resolveAssociationIds(ids, model) {
    const normalized = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (normalized.length === 0)
        return [];
    const records = model === "Genre"
        ? await prisma.genre.findMany({
            where: { id: { in: normalized } },
            select: { id: true },
        })
        : await prisma.tag.findMany({
            where: { id: { in: normalized } },
            select: { id: true },
        });
    const found = new Set(records.map((record) => record.id));
    const missing = normalized.filter((id) => !found.has(id));
    if (missing.length > 0) {
        throw new AppError(400, "INVALID_ASSOCIATION", `${model} IDs are invalid.`, [
            {
                field: `${model.toLowerCase()}Ids`,
                message: `Invalid ${model.toLowerCase()} IDs: ${missing.join(", ")}`,
            },
        ]);
    }
    return normalized;
}
