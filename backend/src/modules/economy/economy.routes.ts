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
  getPayment,
  getPaymentByReference,
  getPaymentHistory,
  unlockChapter,
  createPaymentIntent,
  markPaymentFailed,
  handleVerifiedCinetPayEvent,
  cancelPayment,
  expirePendingPayments,
  persistCinetPayInitialization,
} from "./economy.service.js";
import {
  createCinetPayPayment,
  verifyCinetPayTransaction,
} from "./cinetpay.client.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
export const economyRouter = Router();
// CinetPay calls this endpoint directly; it must remain outside requireAuth.
economyRouter.post(
  "/payments/cinetpay/notify",
  asyncRoute(async (req, res) => {
    const { env } = await import("../../config/env.js");
    if (!env.CINETPAY_API_KEY || !env.CINETPAY_SITE_ID) {
      throw new AppError(
        503,
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
        "Payment provider is not configured.",
      );
    }

    const body = req.body as Record<string, unknown>;
    const transactionId = String(
      body.cpm_trans_id ?? body.transaction_id ?? "",
    ).trim();
    if (!transactionId) {
      throw new AppError(
        400,
        "INVALID_PAYMENT_NOTIFICATION",
        "Missing CinetPay transaction reference.",
      );
    }

    const verified = await verifyCinetPayTransaction(transactionId, {
      apiKey: env.CINETPAY_API_KEY,
      siteId: env.CINETPAY_SITE_ID,
    });

    const data = verified.data;
    if (!data?.amount || !data.currency || !data.status) {
      throw new AppError(
        502,
        "INVALID_PROVIDER_RESPONSE",
        "CinetPay verification response is incomplete.",
      );
    }

    const amount = Number(data.amount);
    if (!Number.isFinite(amount)) {
      throw new AppError(
        502,
        "INVALID_PROVIDER_AMOUNT",
        "CinetPay returned an invalid amount.",
      );
    }

    const status = String(data.status).toUpperCase();
    const normalizedStatus =
      status === "ACCEPTED"
        ? "ACCEPTED"
        : status === "REFUSED"
          ? "REFUSED"
          : "PENDING";
    const somiReference = String(
      data.metadata ?? data.description ?? transactionId,
    ).trim();

    const result = await handleVerifiedCinetPayEvent({
      somiReference,
      providerReference: transactionId,
      status: normalizedStatus,
      amount,
      currency: String(data.currency).toUpperCase(),
      paymentMethod: data.payment_method ?? null,
      verifiedAt: new Date(),
    });

    res.status(200).json({ received: true, ...result });
  }),
);

economyRouter.use(requireAuth);

economyRouter.get(
  "/payments/reference/:somiReference",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json(
      await getPaymentByReference(
        req.user!.id,
        String(req.params.somiReference),
      ),
    );
  }),
);

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
    const { packageId } = req.body as {
      packageId: keyof typeof coinPackages;
    };

    /*
     * SOMI creates the payment intent first.
     *
     * The payment remains PENDING.
     * No wallet credit occurs here.
     */
    const payment = await createPaymentIntent(req.user!.id, packageId);

    const { env } = await import("../../config/env.js");

    if (
      !env.CINETPAY_API_KEY ||
      !env.CINETPAY_API_PASSWORD ||
      !env.CINETPAY_API_BASE_URL ||
      !env.CINETPAY_NOTIFY_URL ||
      !env.CINETPAY_RETURN_URL ||
      !env.CINETPAY_FAILED_URL
    ) {
      throw new AppError(
        503,
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
        "Payment provider is not configured.",
      );
    }

    try {
      const checkout = await createCinetPayPayment(
        {
          somiReference: payment.somiReference,
          amount: payment.amount,
          currency: payment.currency,
          coins: payment.coins,
          packageId: payment.packageId,
        },
        {
          apiKey: env.CINETPAY_API_KEY,
          apiPassword: env.CINETPAY_API_PASSWORD,
          apiBaseUrl: env.CINETPAY_API_BASE_URL,

          successUrl: (() => {
            const url = new URL(env.CINETPAY_RETURN_URL!);
            url.searchParams.set("reference", payment.somiReference);
            return url.toString();
          })(),

          failedUrl: (() => {
            const url = new URL(env.CINETPAY_FAILED_URL!);
            url.searchParams.set("reference", payment.somiReference);
            return url.toString();
          })(),

          notifyUrl: env.CINETPAY_NOTIFY_URL,

          /*
           * CinetPay v1 uses the singular `channel` field.
           * We retain the existing configuration value for now.
           */
          channel: env.CINETPAY_CHANNELS,
        },
      );

      await persistCinetPayInitialization(payment.paymentId, {
        paymentToken: checkout.paymentToken,
        paymentUrl: checkout.paymentUrl,
      });

      res.status(201).json({
        ...payment,

        /*
         * Keep the existing SOMI frontend contract.
         */
        checkoutUrl: checkout.paymentUrl,
        paymentToken: checkout.paymentToken,
      });
    } catch (error) {
      /*
       * CinetPay initialization failed.
       *
       * The SOMI payment intent must not remain indefinitely PENDING
       * when initialization itself failed.
       *
       * No coins have been credited.
       */
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
