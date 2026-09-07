import { Router, type RequestHandler } from "express";
import { validate } from "../../common/middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import {
  bookIdParamsSchema,
  progressParamsSchema,
  saveProgressSchema,
} from "./library.schemas.js";
import {
  addToLibrary,
  getBookProgress,
  getContinueReading,
  listLibrary,
  listProgress,
  removeFromLibrary,
  saveProgress,
} from "./library.service.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
export const libraryRouter = Router();

libraryRouter.use(requireAuth);
libraryRouter.get(
  "/library",
  asyncRoute(async (req: AuthRequest, res) =>
    res.json({ items: await listLibrary(req.user) }),
  ),
);
libraryRouter.post(
  "/library/:bookId",
  validate(bookIdParamsSchema, "params"),
  asyncRoute(async (req: AuthRequest, res) =>
    res
      .status(201)
      .json({ item: await addToLibrary(req.user, String(req.params.bookId)) }),
  ),
);
libraryRouter.delete(
  "/library/:bookId",
  validate(bookIdParamsSchema, "params"),
  asyncRoute(async (req: AuthRequest, res) => {
    await removeFromLibrary(req.user, String(req.params.bookId));
    res.status(204).send();
  }),
);
libraryRouter.get(
  "/reading-progress",
  asyncRoute(async (req: AuthRequest, res) =>
    res.json({ items: await listProgress(req.user) }),
  ),
);
libraryRouter.get(
  "/reading-progress/continue",
  asyncRoute(async (req: AuthRequest, res) =>
    res.json({ item: await getContinueReading(req.user) }),
  ),
);
libraryRouter.get(
  "/books/:bookId/reading-progress",
  validate(bookIdParamsSchema, "params"),
  asyncRoute(async (req: AuthRequest, res) =>
    res.json({
      items: await getBookProgress(req.user, String(req.params.bookId)),
    }),
  ),
);
libraryRouter.put(
  "/books/:bookId/chapters/:chapterId/reading-progress",
  validate(progressParamsSchema, "params"),
  validate(saveProgressSchema),
  asyncRoute(async (req: AuthRequest, res) =>
    res.json({
      item: await saveProgress(
        req.user,
        String(req.params.bookId),
        String(req.params.chapterId),
        req.body,
      ),
    }),
  ),
);
