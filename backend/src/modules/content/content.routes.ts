import { Router, type RequestHandler } from "express";
import { prisma } from "../../config/database.js";
import { readWriterImage } from "../writer/writer.storage.js";
import { validate } from "../../common/middleware/validate.js";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import {
  createBookSchema,
  createChapterSchema,
  updateBookSchema,
  updateChapterSchema,
} from "./content.schemas.js";
import {
  createBook,
  createChapter,
  deleteBook,
  deleteChapter,
  getBookDetail,
  getChapterDetail,
  getPublicBooks,
  getPublicChapters,
  getWriterBooks,
  getWriterChapters,
  updateBook,
  updateChapter,
  getGenres,
  getTags,
} from "./content.service.js";
import { AppError } from "../../common/errors/http-error.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

const assertWriterCannotChangeLifecycleStatus = (
  req: AuthRequest,
  status: unknown,
  resource: "book" | "chapter",
) => {
  if (req.user?.role.toUpperCase() === "WRITER" && status !== undefined) {
    throw new AppError(
      409,
      "INVALID_STATE_TRANSITION",
      `Writers cannot directly change ${resource} lifecycle status. Submit the ${resource} through the Writer workflow.`,
    );
  }
};

export const contentRouter = Router();

contentRouter.get(
  "/genres",
  asyncRoute(async (_req, res) => {
    const genres = await getGenres();
    res.json({ genres });
  }),
);

contentRouter.get(
  "/tags",
  asyncRoute(async (_req, res) => {
    const tags = await getTags();
    res.json({ tags });
  }),
);

contentRouter.get(
  "/books",
  asyncRoute(async (_req, res) => {
    const books = await getPublicBooks();
    res.json({ books });
  }),
);

contentRouter.get(
  "/writer/books",
  requireAuth,
  requireRole("WRITER", "ADMIN"),
  asyncRoute(async (req: AuthRequest, res) => {
    const books = await getWriterBooks(req.user!.id);
    res.json({ books });
  }),
);

contentRouter.post(
  "/books",
  requireAuth,
  requireRole("WRITER", "ADMIN"),
  validate(createBookSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    /*
     * createBookSchema deliberately has no status field.
     *
     * Therefore every new book reaches the service without a client-
     * controlled lifecycle status and is created as DRAFT.
     */
    const book = await createBook(req.user!, req.body);
    res.status(201).json({ book });
  }),
);

contentRouter.get(
  "/books/:bookId",
  optionalAuth,
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    const book = await getBookDetail(bookId, req.user);
    res.json({ book });
  }),
);

contentRouter.patch(
  "/books/:bookId",
  requireAuth,
  validate(updateBookSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    assertWriterCannotChangeLifecycleStatus(req, req.body.status, "book");

    const bookId = String(req.params.bookId);
    const book = await updateBook(req.user, bookId, req.body);

    res.json({ book });
  }),
);

contentRouter.delete(
  "/books/:bookId",
  requireAuth,
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    await deleteBook(req.user, bookId);
    res.status(204).send();
  }),
);

contentRouter.get(
  "/books/:bookId/chapters",
  asyncRoute(async (req, res) => {
    const bookId = String(req.params.bookId);
    const chapters = await getPublicChapters(bookId);
    res.json({ chapters });
  }),
);

contentRouter.get(
  "/books/:bookId/chapters/manage",
  requireAuth,
  requireRole("WRITER", "ADMIN"),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    const chapters = await getWriterChapters(req.user, bookId);
    res.json({ chapters });
  }),
);

contentRouter.post(
  "/books/:bookId/chapters",
  requireAuth,
  requireRole("WRITER", "ADMIN"),
  validate(createChapterSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    /*
     * createChapterSchema deliberately has no status field.
     *
     * Therefore every newly created chapter is DRAFT.
     */
    const bookId = String(req.params.bookId);
    const chapter = await createChapter(req.user, bookId, req.body);

    res.status(201).json({ chapter });
  }),
);

contentRouter.get(
  "/books/:bookId/chapters/:chapterId",
  optionalAuth,
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    const chapterId = String(req.params.chapterId);

    const chapter = await getChapterDetail(bookId, chapterId, req.user);

    res.json({ chapter });
  }),
);

contentRouter.patch(
  "/books/:bookId/chapters/:chapterId",
  requireAuth,
  validate(updateChapterSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    assertWriterCannotChangeLifecycleStatus(req, req.body.status, "chapter");

    const bookId = String(req.params.bookId);
    const chapterId = String(req.params.chapterId);

    const chapter = await updateChapter(req.user, bookId, chapterId, req.body);

    res.json({ chapter });
  }),
);

contentRouter.delete(
  "/books/:bookId/chapters/:chapterId",
  requireAuth,
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);
    const chapterId = String(req.params.chapterId);

    await deleteChapter(req.user, bookId, chapterId);

    res.status(204).send();
  }),
);

contentRouter.get(
  "/assets/:assetId",
  optionalAuth,
  asyncRoute(async (req: AuthRequest, res) => {
    const asset = await prisma.writerAsset.findUnique({
      where: {
        id: String(req.params.assetId),
      },
      include: {
        book: {
          select: {
            status: true,
            authorId: true,
          },
        },
      },
    });

    if (!asset) {
      throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }

    const isOwner =
      req.user?.id === asset.book.authorId ||
      req.user?.role?.toUpperCase() === "ADMIN";

    const isPublic = asset.book.status === "PUBLISHED";

    if (!isOwner && !isPublic) {
      throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }

    const data = await readWriterImage(asset.storageKey);

    res.type(asset.mimeType).send(data);
  }),
);
