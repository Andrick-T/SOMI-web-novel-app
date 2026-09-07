import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
const languages = ["en", "fr"];
const assertWriter = (viewer) => {
    if (!viewer) {
        throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    }
    if (!["WRITER", "ADMIN"].includes(viewer.role.toUpperCase())) {
        throw new AppError(403, "FORBIDDEN", "Writer permission is required.");
    }
    return viewer;
};
const serializeContent = (content) => typeof content === "string" ? content : JSON.stringify(content);
async function ownedBook(writer, bookId) {
    const viewer = assertWriter(writer);
    const book = await prisma.book.findUnique({
        where: { id: bookId },
    });
    if (!book) {
        throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }
    if (viewer.role.toUpperCase() !== "ADMIN" && book.authorId !== viewer.id) {
        throw new AppError(403, "FORBIDDEN", "You do not own this book.");
    }
    return book;
}
async function ownedChapter(writer, bookId, chapterId) {
    const book = await ownedBook(writer, bookId);
    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
    });
    if (!chapter || chapter.bookId !== book.id) {
        throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    }
    return {
        book,
        chapter,
    };
}
const mapLocalization = (localization) => ({
    ...localization,
    createdAt: localization.createdAt.toISOString(),
    updatedAt: localization.updatedAt.toISOString(),
});
export async function getWriterProfile(writer) {
    const viewer = assertWriter(writer);
    const profile = await prisma.writerProfile.findUnique({
        where: {
            userId: viewer.id,
        },
    });
    return profile;
}
export async function saveWriterProfile(writer, input) {
    const viewer = assertWriter(writer);
    return prisma.writerProfile.upsert({
        where: {
            userId: viewer.id,
        },
        create: {
            userId: viewer.id,
            ...input,
        },
        update: input,
    });
}
export async function getBookLocalizations(writer, bookId) {
    await ownedBook(writer, bookId);
    const records = await prisma.bookLocalization.findMany({
        where: { bookId },
        orderBy: {
            languageCode: "asc",
        },
    });
    return records.map(mapLocalization);
}
/**
 * Save editable book-localization data.
 *
 * IMPORTANT:
 * This function intentionally does NOT accept or mutate status.
 *
 * Any existing READY_FOR_SUBMISSION state is invalidated when the
 * localization is edited because the content has changed.
 */
export async function saveBookLocalization(writer, bookId, input) {
    await ownedBook(writer, bookId);
    const record = await prisma.bookLocalization.upsert({
        where: {
            bookId_languageCode: {
                bookId,
                languageCode: input.languageCode,
            },
        },
        create: {
            bookId,
            languageCode: input.languageCode,
            title: input.title,
            description: input.description ?? null,
            status: "NEEDS_PROOFREADING",
        },
        update: {
            title: input.title,
            description: input.description ?? null,
            /*
             * Any edit makes the localization require
             * proofreading again.
             */
            status: "NEEDS_PROOFREADING",
            sourceVersion: {
                increment: input.languageCode === "en" ? 1 : 0,
            },
        },
    });
    return mapLocalization(record);
}
/**
 * Explicit lifecycle transition:
 *
 * NEEDS_PROOFREADING -> READY_FOR_SUBMISSION
 *
 * A client cannot manufacture this state through PATCH.
 */
export async function markBookLocalizationReady(writer, bookId, languageCode) {
    await ownedBook(writer, bookId);
    const localization = await prisma.bookLocalization.findUnique({
        where: {
            bookId_languageCode: {
                bookId,
                languageCode,
            },
        },
    });
    if (!localization) {
        throw new AppError(422, "LOCALIZATION_INCOMPLETE", "Book localization must be saved before review.");
    }
    if (!localization.title.trim()) {
        throw new AppError(422, "LOCALIZATION_INCOMPLETE", "Book localization title is required.");
    }
    const updated = await prisma.bookLocalization.update({
        where: {
            bookId_languageCode: {
                bookId,
                languageCode,
            },
        },
        data: {
            status: "READY_FOR_SUBMISSION",
        },
    });
    return mapLocalization(updated);
}
export async function autosaveChapter(writer, bookId, chapterId, input) {
    const { chapter } = await ownedChapter(writer, bookId, chapterId);
    const content = serializeContent(input.content);
    if (input.languageCode === "en") {
        if (chapter.contentVersion !== input.clientVersion) {
            throw new AppError(409, "AUTOSAVE_CONFLICT", "This chapter changed elsewhere.", [
                {
                    serverVersion: chapter.contentVersion,
                },
            ]);
        }
        const updated = await prisma.chapter.updateMany({
            where: {
                id: chapterId,
                contentVersion: input.clientVersion,
            },
            data: {
                title: input.title,
                content,
                contentVersion: {
                    increment: 1,
                },
                status: "DRAFT",
                wordCount: content.trim().split(/\s+/).filter(Boolean).length,
            },
        });
        if (updated.count !== 1) {
            throw new AppError(409, "AUTOSAVE_CONFLICT", "This chapter changed elsewhere.");
        }
        return prisma.chapter.findUniqueOrThrow({
            where: {
                id: chapterId,
            },
        });
    }
    const localization = await prisma.chapterLocalization.findUnique({
        where: {
            chapterId_languageCode: {
                chapterId,
                languageCode: input.languageCode,
            },
        },
    });
    const version = localization?.contentVersion ?? 0;
    if (version !== input.clientVersion) {
        throw new AppError(409, "AUTOSAVE_CONFLICT", "This translation changed elsewhere.", [
            {
                serverVersion: version,
            },
        ]);
    }
    return prisma.chapterLocalization.upsert({
        where: {
            chapterId_languageCode: {
                chapterId,
                languageCode: input.languageCode,
            },
        },
        create: {
            chapterId,
            languageCode: input.languageCode,
            title: input.title,
            content,
            contentFormat: input.contentFormat,
            status: "NEEDS_PROOFREADING",
            contentVersion: 1,
            sourceVersion: chapter.contentVersion,
        },
        update: {
            title: input.title,
            content,
            contentFormat: input.contentFormat,
            /*
             * Editing translated content invalidates
             * its previous proofreading state.
             */
            status: "NEEDS_PROOFREADING",
            contentVersion: {
                increment: 1,
            },
        },
    });
}
export async function requestTranslation(writer, bookId, _input) {
    await ownedBook(writer, bookId);
    throw new AppError(501, "TRANSLATION_NOT_CONFIGURED", "No translation provider is configured.");
}
export async function markChapterLocalizationReady(writer, bookId, chapterId, languageCode) {
    await ownedChapter(writer, bookId, chapterId);
    const localization = await prisma.chapterLocalization.updateMany({
        where: {
            chapterId,
            languageCode,
        },
        data: {
            status: "READY_FOR_SUBMISSION",
        },
    });
    if (localization.count !== 1) {
        throw new AppError(422, "LOCALIZATION_INCOMPLETE", "Translated chapter content must be saved before review.");
    }
    return prisma.chapterLocalization.findUniqueOrThrow({
        where: {
            chapterId_languageCode: {
                chapterId,
                languageCode,
            },
        },
    });
}
export async function submitBook(writer, bookId) {
    const book = await ownedBook(writer, bookId);
    /*
     * A Writer submission may only originate from DRAFT.
     *
     * Once submitBook() runs, the book becomes SUBMITTED.
     * A published book cannot be submitted again through this route.
     */
    if (book.status !== "DRAFT") {
        throw new AppError(409, "INVALID_STATE_TRANSITION", `Book cannot be submitted from state ${book.status}.`);
    }
    const [localizations, chapters] = await Promise.all([
        prisma.bookLocalization.findMany({
            where: { bookId },
        }),
        prisma.chapter.findMany({
            where: { bookId },
            orderBy: {
                number: "asc",
            },
        }),
    ]);
    const byLanguage = new Map(localizations.map((entry) => [entry.languageCode, entry]));
    for (const languageCode of languages) {
        const localization = byLanguage.get(languageCode);
        if (!localization || localization.status !== "READY_FOR_SUBMISSION") {
            throw new AppError(422, "LOCALIZATION_INCOMPLETE", `${languageCode} book localization is not ready.`);
        }
    }
    if (chapters.length === 0 ||
        chapters.some((chapter) => !chapter.content.trim())) {
        throw new AppError(422, "SUBMISSION_INVALID", "Every book must contain non-empty chapters.");
    }
    const translatedChapters = await prisma.chapterLocalization.findMany({
        where: {
            chapterId: {
                in: chapters.map((chapter) => chapter.id),
            },
            languageCode: "fr",
        },
    });
    if (translatedChapters.length !== chapters.length ||
        translatedChapters.some((chapter) => chapter.status !== "READY_FOR_SUBMISSION")) {
        throw new AppError(422, "LOCALIZATION_INCOMPLETE", "Every chapter must have a reviewed French localization.");
    }
    const active = await prisma.writerSubmission.findFirst({
        where: {
            bookId,
            status: {
                in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"],
            },
        },
    });
    if (active) {
        throw new AppError(409, "SUBMISSION_ALREADY_ACTIVE", "This book already has an active submission.");
    }
    const submission = await prisma.writerSubmission.create({
        data: {
            writerId: book.authorId,
            bookId,
            status: "SUBMITTED",
        },
    });
    await prisma.book.update({
        where: {
            id: bookId,
        },
        data: {
            status: "SUBMITTED",
        },
    });
    return submission;
}
export async function getWriterSubmissions(writer) {
    const viewer = assertWriter(writer);
    return prisma.writerSubmission.findMany({
        where: {
            writerId: viewer.id,
        },
        orderBy: {
            submittedAt: "desc",
        },
        select: {
            id: true,
            bookId: true,
            chapterId: true,
            languageCode: true,
            status: true,
            rejectionReason: true,
            submittedAt: true,
            reviewedAt: true,
        },
    });
}
export async function getWriterEarnings(writer) {
    const viewer = assertWriter(writer);
    const [aggregate, pending] = await Promise.all([
        prisma.writerEarning.aggregate({
            where: {
                writerId: viewer.id,
            },
            _sum: {
                coins: true,
            },
        }),
        prisma.writerEarning.aggregate({
            where: {
                writerId: viewer.id,
                status: "PENDING",
            },
            _sum: {
                coins: true,
            },
        }),
    ]);
    return {
        totalCoins: aggregate._sum.coins ?? 0,
        pendingCoins: pending._sum.coins ?? 0,
        availableCoins: (aggregate._sum.coins ?? 0) - (pending._sum.coins ?? 0),
    };
}
export async function getWriterEarningTransactions(writer) {
    const viewer = assertWriter(writer);
    return prisma.writerEarning.findMany({
        where: {
            writerId: viewer.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            bookId: true,
            chapterId: true,
            sourceTransactionId: true,
            coins: true,
            status: true,
            createdAt: true,
        },
    });
}
export async function attributeWriterEarning(sourceTransactionId) {
    return prisma.$transaction(async (tx) => {
        const transaction = await tx.walletTransaction.findFirst({
            where: {
                OR: [
                    {
                        id: sourceTransactionId,
                    },
                    {
                        reference: sourceTransactionId,
                    },
                ],
            },
        });
        if (!transaction ||
            transaction.type !== "CHAPTER_UNLOCK" ||
            transaction.status !== "COMPLETED") {
            return null;
        }
        const reference = transaction.reference?.match(/^chapter:([^:]+):([^:]+)$/);
        const bookId = reference?.[1] ?? null;
        const chapterId = reference?.[2] ?? null;
        if (!bookId || !chapterId) {
            return null;
        }
        const chapter = await tx.chapter.findUnique({
            where: {
                id: chapterId,
            },
            select: {
                bookId: true,
                book: {
                    select: {
                        authorId: true,
                    },
                },
            },
        });
        if (!chapter || chapter.bookId !== bookId) {
            return null;
        }
        return tx.writerEarning.upsert({
            where: {
                sourceTransactionId,
            },
            create: {
                sourceTransactionId,
                writerId: chapter.book.authorId,
                bookId,
                chapterId,
                coins: Math.abs(transaction.coins),
                status: "PENDING",
            },
            update: {},
        });
    });
}
