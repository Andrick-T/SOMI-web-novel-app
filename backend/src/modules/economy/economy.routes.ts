import { Router, type RequestHandler } from "express";
import { validate } from "../../common/middleware/validate.js";
import { AppError } from "../../common/errors/http-error.js";
import { requireAuth } from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { paginationSchema, purchaseSchema } from "./economy.schemas.js";
import {
  getChapterEntitlement,
  coinPackages,
  getTransactions,
  getWallet,
  unlockChapter,
  createPaymentIntent,
  markPaymentFailed,
} from "./economy.service.js";
import { createCinetPayCheckout } from "./cinetpay.client.js";

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
    const { packageId } = req.body as { packageId: keyof typeof coinPackages };
    const payment = await createPaymentIntent(req.user!.id, packageId);

    const { env } = await import("../../config/env.js");

    if (
      !env.CINETPAY_API_KEY ||
      !env.CINETPAY_SITE_ID ||
      !env.CINETPAY_NOTIFY_URL ||
      !env.CINETPAY_RETURN_URL
    ) {
      throw new AppError(
        503,
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
        "Payment provider is not configured.",
      );
    }

    try {
      const checkout = await createCinetPayCheckout(
        {
          somiReference: payment.somiReference,
          amount: payment.amount,
          currency: payment.currency,
          coins: payment.coins,
          packageId: payment.packageId,
        },
        {
          apiKey: env.CINETPAY_API_KEY,
          siteId: env.CINETPAY_SITE_ID,
          apiUrl: env.CINETPAY_API_URL,
          notifyUrl: env.CINETPAY_NOTIFY_URL,
          returnUrl: env.CINETPAY_RETURN_URL,
          channels: env.CINETPAY_CHANNELS,
        },
      );

      res.status(201).json({
        ...payment,
        checkoutUrl: checkout.paymentUrl,
        paymentToken: checkout.paymentToken,
      });
    } catch (error) {
      await markPaymentFailed(payment.paymentId);
      throw error;
    }
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
