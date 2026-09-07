import express, { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/http-error.js";
import { validate } from "../../common/middleware/validate.js";
import {
  requireAuth,
  requireRole,
  optionalAuth,
} from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import {
  assetMetadataSchema,
  localizationSchema,
  writerProfileSchema,
} from "./writer.schemas.js";
import { readWriterImage, storeWriterImage } from "./writer.storage.js";
import {
  getWriterEarnings,
  getWriterEarningTransactions,
  getWriterProfile,
  saveWriterProfile,
  autosaveChapter,
  saveBookLocalization,
  markBookLocalizationReady,
  markChapterLocalizationReady,
  submitBook,
  getWriterSubmissions,
} from "./writer.service.js";

const writerRouter = Router();

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

/* ============================================================
   AUTHENTICATION
   ============================================================ */

writerRouter.use(requireAuth, requireRole("WRITER", "ADMIN"));

/* ============================================================
   WRITER PROFILE
   ============================================================ */

writerRouter.get(
  "/profile",
  asyncRoute(async (req: AuthRequest, res) => {
    const profile = await getWriterProfile(req.user);

    return res.json({
      profile,
    });
  }),
);

writerRouter.patch(
  "/profile",
  validate(writerProfileSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const profile = await saveWriterProfile(req.user, req.body);

    return res.json({
      profile,
    });
  }),
);

/* ============================================================
   WRITER BOOK ANALYTICS
   ============================================================ */

/**
 * Returns authoritative per-book writer analytics.
 *
 * readers:
 *   distinct users represented in ReadingProgress.
 *
 * unlocks:
 *   actual ChapterEntitlement rows.
 *
 * views:
 *   Book.views.
 *
 * The writer scope is enforced server-side.
 */
writerRouter.get(
  "/books/analytics",
  asyncRoute(async (req: AuthRequest, res) => {
    const viewer = req.user!;

    const isAdmin = viewer.role.toUpperCase() === "ADMIN";

    const books = await prisma.book.findMany({
      where: isAdmin
        ? {}
        : {
            authorId: viewer.id,
          },
      select: {
        id: true,
        views: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (books.length === 0) {
      return res.json({
        analytics: [],
      });
    }

    const bookIds = books.map((book) => book.id);

    /*
     * ReadingProgress can contain multiple chapters
     * for the same reader, therefore count distinct
     * (bookId, userId) pairs rather than rows.
     */
    const readerGroups = await prisma.readingProgress.groupBy({
      by: ["bookId", "userId"],
      where: {
        bookId: {
          in: bookIds,
        },
      },
    });

    const readerCounts = new Map<string, number>();

    for (const entry of readerGroups) {
      readerCounts.set(entry.bookId, (readerCounts.get(entry.bookId) ?? 0) + 1);
    }

    /*
     * Entitlements are chapter-scoped, so first retrieve
     * the entitled chapters and map them back to books.
     */
    const entitlementGroups = await prisma.chapterEntitlement.groupBy({
      by: ["chapterId"],
      where: {
        chapter: {
          bookId: {
            in: bookIds,
          },
        },
      },
    });

    const chapterIds = entitlementGroups.map((entry) => entry.chapterId);

    const chapters =
      chapterIds.length > 0
        ? await prisma.chapter.findMany({
            where: {
              id: {
                in: chapterIds,
              },
            },
            select: {
              id: true,
              bookId: true,
            },
          })
        : [];

    const chapterToBook = new Map<string, string>(
      chapters.map((chapter) => [chapter.id, chapter.bookId]),
    );

    const unlockCounts = new Map<string, number>();

    for (const entitlement of entitlementGroups) {
      const bookId = chapterToBook.get(entitlement.chapterId);

      if (!bookId) continue;

      unlockCounts.set(bookId, (unlockCounts.get(bookId) ?? 0) + 1);
    }

    return res.json({
      analytics: books.map((book) => ({
        bookId: book.id,
        views: book.views ?? 0,
        readers: readerCounts.get(book.id) ?? 0,
        unlocks: unlockCounts.get(book.id) ?? 0,
      })),
    });
  }),
);

/* ============================================================
   WRITER EARNINGS
   ============================================================ */

writerRouter.get(
  "/earnings",
  asyncRoute(async (req: AuthRequest, res) => {
    const earnings = await getWriterEarnings(req.user);

    return res.json(earnings);
  }),
);

writerRouter.get(
  "/earnings/transactions",
  asyncRoute(async (req: AuthRequest, res) => {
    const transactions = await getWriterEarningTransactions(req.user);

    return res.json({
      transactions,
    });
  }),
);

/* ============================================================
   BOOK LOCALIZATIONS
   ============================================================ */

writerRouter.get(
  "/books/:bookId/localizations",
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!book) {
      throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }

    if (
      book.authorId !== req.user!.id &&
      req.user!.role.toUpperCase() !== "ADMIN"
    ) {
      throw new AppError(403, "FORBIDDEN", "You do not own this book.");
    }

    const localizations = await prisma.bookLocalization.findMany({
      where: {
        bookId,
      },
      orderBy: {
        languageCode: "asc",
      },
    });

    return res.json({
      localizations,
    });
  }),
);

/**
 * Generic localization editing endpoint.
 *
 * Lifecycle status is intentionally NOT accepted here.
 *
 * Use /ready for the lifecycle transition.
 */
writerRouter.patch(
  "/books/:bookId/localizations/:languageCode",
  validate(localizationSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const languageCode = String(req.params.languageCode).toLowerCase();

    if (!["en", "fr"].includes(languageCode)) {
      throw new AppError(
        400,
        "INVALID_LANGUAGE",
        "Only English and French are supported.",
      );
    }

    /*
     * The validated request body contains:
     *   - languageCode
     *   - required title
     *   - optional description
     *
     * Lifecycle status is deliberately excluded from
     * localizationSchema and therefore cannot be changed
     * through this endpoint.
     */
    if (req.body.languageCode !== languageCode) {
      throw new AppError(
        400,
        "INVALID_LANGUAGE",
        "The localization language does not match the route.",
      );
    }

    /*
     * Do not accept lifecycle status from the client.
     *
     * This is kept as an explicit guard as defense-in-depth,
     * even though localizationSchema does not define status.
     */
    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      throw new AppError(
        409,
        "LIFECYCLE_STATUS_FORBIDDEN",
        "Localization lifecycle status must be changed through the dedicated ready workflow.",
      );
    }

    const localization = await saveBookLocalization(req.user, bookId, {
      languageCode: languageCode as "en" | "fr",
      title: req.body.title,
      description: req.body.description,
    });

    return res.json({
      localization,
    });
  }),
);

/**
 * Explicit lifecycle transition:
 *
 * NEEDS_PROOFREADING -> READY_FOR_SUBMISSION
 *
 * This cannot be forged through the generic PATCH endpoint.
 */
writerRouter.post(
  "/books/:bookId/localizations/:languageCode/ready",
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const languageCode = String(req.params.languageCode).toLowerCase();

    if (!["en", "fr"].includes(languageCode)) {
      throw new AppError(
        400,
        "INVALID_LANGUAGE",
        "Only English and French are supported.",
      );
    }

    const localization = await markBookLocalizationReady(
      req.user,
      bookId,
      languageCode as "en" | "fr",
    );

    return res.json({
      localization,
    });
  }),
);

/* ============================================================
   CHAPTER LOCALIZATION READY
   ============================================================ */

writerRouter.post(
  "/books/:bookId/chapters/:chapterId/localizations/:languageCode/ready",
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const chapterId = String(req.params.chapterId);

    const languageCode = String(req.params.languageCode).toLowerCase();

    if (!["en", "fr"].includes(languageCode)) {
      throw new AppError(
        400,
        "INVALID_LANGUAGE",
        "Only English and French are supported.",
      );
    }

    const localization = await markChapterLocalizationReady(
      req.user,
      bookId,
      chapterId,
      languageCode as "en" | "fr",
    );

    return res.json({
      localization,
    });
  }),
);

/* ============================================================
   CHAPTER AUTOSAVE
   ============================================================ */

writerRouter.patch(
  "/books/:bookId/chapters/:chapterId/autosave",
  asyncRoute(async (req: AuthRequest, res) => {
    const result = await autosaveChapter(
      req.user,
      String(req.params.bookId),
      String(req.params.chapterId),
      req.body,
    );

    return res.json(result);
  }),
);

/* ============================================================
   BOOK SUBMISSION
   ============================================================ */

writerRouter.post(
  "/books/:bookId/submit",
  asyncRoute(async (req: AuthRequest, res) => {
    const submission = await submitBook(req.user, String(req.params.bookId));

    return res.status(201).json({
      submission,
    });
  }),
);

/* ============================================================
   SUBMISSIONS
   ============================================================ */

writerRouter.get(
  "/submissions",
  asyncRoute(async (req: AuthRequest, res) => {
    const submissions = await getWriterSubmissions(req.user);

    return res.json({
      submissions,
    });
  }),
);

/* ============================================================
   BOOK COVER UPLOAD
   ============================================================ */

/**
 * Real book-cover upload.
 *
 * WriterAsset.chapterId remains NULL for cover assets.
 *
 * The image is stored using the existing secure writer
 * storage implementation, which validates the actual
 * image signature rather than trusting Content-Type alone.
 */
writerRouter.post(
  "/books/:bookId/cover/upload",
  express.raw({
    type: () => true,
    limit: "10mb",
  }),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!book) {
      throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }

    const isAdmin = req.user!.role.toUpperCase() === "ADMIN";

    if (book.authorId !== req.user!.id && !isAdmin) {
      throw new AppError(403, "FORBIDDEN", "You do not own this book.");
    }

    const metadataResult = assetMetadataSchema.safeParse({
      altText: req.headers["x-asset-alt-text"],
      caption: req.headers["x-asset-caption"] ?? null,
      width: req.headers["x-asset-width"]
        ? Number(req.headers["x-asset-width"])
        : undefined,
      height: req.headers["x-asset-height"]
        ? Number(req.headers["x-asset-height"])
        : undefined,
    });

    if (!metadataResult.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Valid image metadata is required.",
      );
    }

    const mimeType = String(req.headers["content-type"] ?? "").split(";")[0];

    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

    if (buffer.length === 0) {
      throw new AppError(
        400,
        "EMPTY_FILE",
        "The uploaded cover image is empty.",
      );
    }

    const stored = await storeWriterImage(mimeType, buffer);

    const asset = await prisma.writerAsset.create({
      data: {
        writerId: req.user!.id,
        bookId,
        chapterId: null,
        storageKey: stored.storageKey,
        mimeType,
        sizeBytes: stored.sizeBytes,
        width: metadataResult.data.width ?? null,
        height: metadataResult.data.height ?? null,
        altText: metadataResult.data.altText,
        caption: metadataResult.data.caption ?? null,
        status: "ACTIVE",
      },
    });

    const url = `/api/v1/writer/assets/${asset.id}`;

    /*
     * Keep Book.cover pointing to the SOMI media
     * endpoint rather than storing a third-party URL.
     */
    const updatedBook = await prisma.book.update({
      where: {
        id: bookId,
      },
      data: {
        cover: url,
      },
      select: {
        id: true,
        cover: true,
      },
    });

    return res.status(201).json({
      asset: {
        id: asset.id,
        altText: asset.altText,
        caption: asset.caption,
      },
      url,
      book: updatedBook,
    });
  }),
);

/* ============================================================
   CHAPTER ASSET UPLOAD
   ============================================================ */

writerRouter.post(
  "/books/:bookId/chapters/:chapterId/assets/upload",
  express.raw({
    type: () => true,
    limit: "10mb",
  }),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const chapterId = String(req.params.chapterId);

    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!book) {
      throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
    }

    if (
      book.authorId !== req.user!.id &&
      req.user!.role.toUpperCase() !== "ADMIN"
    ) {
      throw new AppError(403, "FORBIDDEN", "You do not own this book.");
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        id: true,
        bookId: true,
      },
    });

    if (!chapter || chapter.bookId !== bookId) {
      throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    }

    const metadataResult = assetMetadataSchema.safeParse({
      altText: req.headers["x-asset-alt-text"],
      caption: req.headers["x-asset-caption"] ?? null,
      width: req.headers["x-asset-width"]
        ? Number(req.headers["x-asset-width"])
        : undefined,
      height: req.headers["x-asset-height"]
        ? Number(req.headers["x-asset-height"])
        : undefined,
    });

    if (!metadataResult.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Valid image metadata is required.",
      );
    }

    const mimeType = String(req.headers["content-type"] ?? "").split(";")[0];

    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

    if (buffer.length === 0) {
      throw new AppError(400, "EMPTY_FILE", "The uploaded file is empty.");
    }

    const stored = await storeWriterImage(mimeType, buffer);

    const asset = await prisma.writerAsset.create({
      data: {
        writerId: req.user!.id,
        bookId,
        chapterId,
        storageKey: stored.storageKey,
        mimeType,
        sizeBytes: stored.sizeBytes,
        width: metadataResult.data.width ?? null,
        height: metadataResult.data.height ?? null,
        altText: metadataResult.data.altText,
        caption: metadataResult.data.caption ?? null,
        status: "ACTIVE",
      },
    });

    return res.status(201).json({
      asset: {
        id: asset.id,
        altText: asset.altText,
        caption: asset.caption,
      },
      url: `/api/v1/writer/assets/${asset.id}`,
    });
  }),
);

/* ============================================================
   ASSET DELIVERY
   ============================================================ */

/**
 * Existing writer asset delivery remains protected.
 *
 * This endpoint can deliver both:
 *   - book-level assets
 *   - chapter assets
 *
 * It requires authentication and ownership/admin access.
 */
writerRouter.get(
  "/assets/:assetId",
  asyncRoute(async (req: AuthRequest, res) => {
    const asset = await prisma.writerAsset.findUnique({
      where: {
        id: String(req.params.assetId),
      },
      select: {
        id: true,
        writerId: true,
        bookId: true,
        chapterId: true,
        storageKey: true,
        mimeType: true,
        status: true,
      },
    });

    if (!asset) {
      throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }

    if (asset.status !== "ACTIVE") {
      throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }

    const isOwner = asset.writerId === req.user!.id;

    const isAdmin = req.user!.role.toUpperCase() === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have access to this asset.",
      );
    }

    const data = await readWriterImage(asset.storageKey);

    return res
      .type(asset.mimeType)
      .setHeader("Cache-Control", "private, max-age=86400")
      .send(data);
  }),
);

export { writerRouter };
