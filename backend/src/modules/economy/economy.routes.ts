import { Router, type RequestHandler } from "express";
import { validate } from "../../common/middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { paginationSchema, purchaseSchema } from "./economy.schemas.js";
import {
  getChapterEntitlement,
  getCoinsForCustomPurchase,
  getTransactions,
  getWallet,
  unlockChapter,
} from "./economy.service.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
export const economyRouter = Router();
economyRouter.use(requireAuth);

economyRouter.get(
  "/wallet",
  asyncRoute(async (req: AuthRequest, res) =>
    res.json(await getWallet(req.user!.id)),
  ),
);
economyRouter.get(
  "/wallet/transactions",
  validate(paginationSchema, "query"),
  asyncRoute(async (req: AuthRequest, res) => {
    const { limit, offset } = req.query as unknown as {
      limit: number;
      offset: number;
    };
    res.json({
      transactions: await getTransactions(req.user!.id, limit, offset),
      limit,
      offset,
    });
  }),
);
economyRouter.post(
  "/wallet/purchase",
  validate(purchaseSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const amountCfa = req.body.amountCfa as number;
    res
      .status(202)
      .json({
        paymentRequired: true,
        amountCfa,
        coins: getCoinsForCustomPurchase(amountCfa),
      });
  }),
);
economyRouter.get(
  "/books/:bookId/chapters/:chapterId/entitlement",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json(
      await getChapterEntitlement(
        req.user!.id,
        String(req.params.bookId),
        String(req.params.chapterId),
      ),
    );
  }),
);
economyRouter.post(
  "/books/:bookId/chapters/:chapterId/unlock",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json(
      await unlockChapter(
        req.user!.id,
        String(req.params.bookId),
        String(req.params.chapterId),
      ),
    );
  }),
);
