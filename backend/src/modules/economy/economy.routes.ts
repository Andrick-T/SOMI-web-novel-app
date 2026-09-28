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
  getPaymentByReference,
  unlockChapter,
  createPaymentIntent,
  markPaymentFailed,
  cancelPayment,
  expirePendingPayments,
  persistCinetPayInitialization,
  getPaymentBySomiReference,
} from "./economy.service.js";
import {
  createCinetPayPayment,
  verifyCinetPayPayment,
} from "./cinetpay.client.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const economyRouter = Router();

/**
 * ============================================================
 * E14.9.6 / E14.9.7 — CinetPay notification
 * ============================================================
 *
 * CinetPay calls this endpoint directly.
 *
 * It MUST remain outside requireAuth because CinetPay does not
 * have a SOMI user access token.
 */
economyRouter.post(
  "/payments/cinetpay/notify",
  asyncRoute(async (req, res) => {
    const body = req.body as Record<string, unknown>;

    /*
     * CinetPay notifications are not trusted financial events.
     *
     * The notification only tells SOMI that something happened.
     * The server-side verification step is responsible for confirming
     * the real payment status, provider reference and payment method.
     */
    const merchantTransactionId = String(
      body.merchant_transaction_id ??
        body.merchantTransactionId ??
        body.cpm_trans_id ??
        "",
    ).trim();

    if (!merchantTransactionId) {
      throw new AppError(
        400,
        "INVALID_PAYMENT_NOTIFICATION",
        "Missing CinetPay merchant transaction reference.",
      );
    }

    /*
     * The merchant transaction ID is the SOMI payment reference
     * created during createPaymentIntent().
     */
    const payment = await getPaymentBySomiReference(merchantTransactionId);

    /*
     * An unknown notification must not trigger any financial
     * operation.
     *
     * We return 200 so CinetPay does not repeatedly retry a
     * notification for a payment that SOMI does not recognize.
     */
    if (!payment) {
      res.status(200).json({
        received: true,
        processed: false,
      });
      return;
    }

    /*
     * E14.9.7:
     *
     * The notification itself is NOT trusted.
     *
     * We now ask CinetPay directly for the authoritative
     * server-side payment status using OAuth.
     */
    const { env } = await import("../../config/env.js");

    if (
      !env.CINETPAY_API_KEY ||
      !env.CINETPAY_API_PASSWORD ||
      !env.CINETPAY_API_BASE_URL
    ) {
      throw new AppError(
        503,
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
        "Payment provider is not configured.",
      );
    }

    const verification = await verifyCinetPayPayment(merchantTransactionId, {
      apiKey: env.CINETPAY_API_KEY,
      apiPassword: env.CINETPAY_API_PASSWORD,
      apiBaseUrl: env.CINETPAY_API_BASE_URL,
    });

    /*
     * E14.9.7 deliberately stops here.
     *
     * We DO NOT call handleVerifiedCinetPayEvent() yet.
     *
     * E14.9.8 will define:
     *
     *   CinetPay status
     *        ↓
     *   SOMI payment status
     *        ↓
     *   settlement
     *        ↓
     *   wallet credit
     *        ↓
     *   ledger transaction
     *
     * This separation ensures that verification and settlement
     * remain distinct operations.
     */
    res.status(200).json({
      received: true,
      processed: true,
      paymentId: payment.id,
      somiReference: payment.somiReference,
      providerReference: verification.providerReference,
      providerStatus: verification.status,
      paymentMethod: verification.paymentMethod,
    });
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
