import { Router, type RequestHandler } from "express";

import { validate } from "../../common/middleware/validate.js";
import { requireAuth } from "../../modules/auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";

import {
  commentIdParamsSchema,
  commentParamsSchema,
  createCommentSchema,
} from "./comments.schemas.js";

import {
  createChapterComment,
  deleteChapterComment,
  listChapterComments,
} from "./comments.service.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const commentsRouter = Router();

commentsRouter.get(
  "/books/:bookId/chapters/:chapterId/comments",
  validate(commentParamsSchema, "params"),
  asyncRoute(async (req, res) => {
    const comments = await listChapterComments(
      String(req.params.bookId),
      String(req.params.chapterId),
    );

    res.json({ comments });
  }),
);

commentsRouter.post(
  "/books/:bookId/chapters/:chapterId/comments",
  requireAuth,
  validate(commentParamsSchema, "params"),
  validate(createCommentSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const comment = await createChapterComment(
      req.user,
      String(req.params.bookId),
      String(req.params.chapterId),
      req.body.content,
    );

    res.status(201).json({ comment });
  }),
);

commentsRouter.delete(
  "/books/:bookId/chapters/:chapterId/comments/:commentId",
  requireAuth,
  validate(commentIdParamsSchema, "params"),
  asyncRoute(async (req: AuthRequest, res) => {
    await deleteChapterComment(
      req.user,
      String(req.params.bookId),
      String(req.params.chapterId),
      String(req.params.commentId),
    );

    res.status(204).send();
  }),
);
