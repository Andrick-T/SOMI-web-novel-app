import { Router, type RequestHandler } from "express";
import express from "express";
import { randomUUID } from "node:crypto";
import { validate } from "../../common/middleware/validate.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import {
  assetSchema,
  assetMetadataSchema,
  autosaveSchema,
  localizationSchema,
  translationSchema,
  writerProfileSchema,
} from "./writer.schemas.js";
import {
  autosaveChapter,
  getBookLocalizations,
  getWriterEarningTransactions,
  getWriterEarnings,
  getWriterProfile,
  saveWriterProfile,
  getWriterSubmissions,
  markChapterLocalizationReady,
  requestTranslation,
  saveBookLocalization,
  submitBook,
} from "./writer.service.js";
import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/http-error.js";
import { readWriterImage, storeWriterImage } from "./writer.storage.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const writerRouter = Router();
writerRouter.use(requireAuth, requireRole("WRITER", "ADMIN"));

writerRouter.get(
  "/profile",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({ profile: await getWriterProfile(req.user) });
  }),
);

writerRouter.patch(
  "/profile",
  validate(writerProfileSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({ profile: await saveWriterProfile(req.user, req.body) });
  }),
);

writerRouter.get(
  "/books/:bookId/localizations",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({
      localizations: await getBookLocalizations(
        req.user,
        String(req.params.bookId),
      ),
    });
  }),
);

writerRouter.patch(
  "/books/:bookId/localizations/:languageCode",
  validate(localizationSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    if (req.body.languageCode !== req.params.languageCode) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Language route and body must match.",
      );
    }
    res.json({
      localization: await saveBookLocalization(
        req.user,
        String(req.params.bookId),
        req.body,
      ),
    });
  }),
);

writerRouter.patch(
  "/books/:bookId/chapters/:chapterId/autosave",
  validate(autosaveSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({
      saved: true,
      content: await autosaveChapter(
        req.user,
        String(req.params.bookId),
        String(req.params.chapterId),
        req.body,
      ),
    });
  }),
);

writerRouter.post(
  "/books/:bookId/translate",
  validate(translationSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({
      translation: await requestTranslation(
        req.user,
        String(req.params.bookId),
        req.body,
      ),
    });
  }),
);

writerRouter.post(
  "/books/:bookId/chapters/:chapterId/localizations/:languageCode/ready",
  asyncRoute(async (req: AuthRequest, res) => {
    const languageCode = String(req.params.languageCode);
    if (languageCode !== "fr" && languageCode !== "en")
      throw new AppError(400, "VALIDATION_ERROR", "Unsupported language.");
    res.json({
      localization: await markChapterLocalizationReady(
        req.user,
        String(req.params.bookId),
        String(req.params.chapterId),
        languageCode,
      ),
    });
  }),
);

writerRouter.post(
  "/books/:bookId/submit",
  asyncRoute(async (req: AuthRequest, res) => {
    res.status(201).json({
      submission: await submitBook(req.user, String(req.params.bookId)),
    });
  }),
);

writerRouter.get(
  "/submissions",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({ submissions: await getWriterSubmissions(req.user) });
  }),
);

writerRouter.get(
  "/earnings",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json(await getWriterEarnings(req.user));
  }),
);

writerRouter.get(
  "/earnings/transactions",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({ transactions: await getWriterEarningTransactions(req.user) });
  }),
);

writerRouter.post(
  "/books/:bookId/chapters/:chapterId/assets",
  validate(assetSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    const chapterId = String(req.params.chapterId);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });
    if (!chapter || chapter.bookId !== bookId)
      throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    if (
      chapter.book.authorId !== req.user!.id &&
      req.user!.role.toUpperCase() !== "ADMIN"
    )
      throw new AppError(403, "FORBIDDEN", "You do not own this chapter.");
    if (req.body.chapterId && req.body.chapterId !== chapterId)
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Chapter route and body must match.",
      );
    const asset = await prisma.writerAsset.create({
      data: {
        ...req.body,
        storageKey: `writer/${req.user!.id}/${randomUUID()}`,
        writerId: req.user!.id,
        bookId,
        chapterId,
      },
    });
    res.status(201).json({ asset });
  }),
);

writerRouter.post(
  "/books/:bookId/chapters/:chapterId/assets/upload",
  express.raw({
    type: () => true,
    limit: "10mb",
  }),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    const chapterId = String(req.params.chapterId);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });
    if (!chapter || chapter.bookId !== bookId)
      throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
    if (
      chapter.book.authorId !== req.user!.id &&
      req.user!.role.toUpperCase() !== "ADMIN"
    )
      throw new AppError(403, "FORBIDDEN", "You do not own this chapter.");

    const metadata = assetMetadataSchema.safeParse({
      altText: req.headers["x-asset-alt-text"],
      caption: req.headers["x-asset-caption"] ?? null,
      width: req.headers["x-asset-width"]
        ? Number(req.headers["x-asset-width"])
        : undefined,
      height: req.headers["x-asset-height"]
        ? Number(req.headers["x-asset-height"])
        : undefined,
    });
    if (!metadata.success)
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Valid image metadata is required.",
      );
    const mimeType = String(req.headers["content-type"] ?? "").split(";")[0];
    const stored = await storeWriterImage(
      mimeType,
      Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0),
    );
    const asset = await prisma.writerAsset.create({
      data: {
        ...metadata.data,
        storageKey: stored.storageKey,
        mimeType,
        sizeBytes: stored.sizeBytes,
        writerId: req.user!.id,
        bookId,
        chapterId,
      },
    });
    res.status(201).json({ asset, url: `/api/v1/writer/assets/${asset.id}` });
  }),
);

writerRouter.get(
  "/assets/:assetId",
  asyncRoute(async (req: AuthRequest, res) => {
    const asset = await prisma.writerAsset.findUnique({
      where: { id: String(req.params.assetId) },
    });
    if (!asset) throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    if (
      asset.writerId !== req.user!.id &&
      req.user!.role.toUpperCase() !== "ADMIN"
    )
      throw new AppError(403, "FORBIDDEN", "You do not own this asset.");
    const data = await readWriterImage(asset.storageKey);
    res.type(asset.mimeType).send(data);
  }),
);
