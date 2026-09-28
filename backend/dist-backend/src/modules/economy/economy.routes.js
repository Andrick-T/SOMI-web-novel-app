import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { AppError } from "../../common/errors/http-error.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { paginationSchema, purchaseSchema } from "./economy.schemas.js";
import { getChapterEntitlement, getTransactions, getWallet, getPaymentByReference, unlockChapter, createPaymentIntent, markPaymentFailed, persistCinetPayInitialization, } from "./economy.service.js";
import { createCinetPayPayment, } from "./cinetpay.client.js";
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const economyRouter = Router();
// CinetPay calls this endpoint directly; it must remain outside requireAuth.
// CinetPay calls this endpoint directly; it must remain outside requireAuth.
economyRouter.post("/payments/cinetpay/notify", asyncRoute(async (req, res) => {
    const body = req.body;
    /*
     * CinetPay notifications are not trusted financial events.
     *
     * The notification only tells SOMI that something happened.
     * The server-side verification step is responsible for confirming
     * the real payment status, amount, currency and provider reference.
     */
    const merchantTransactionId = String(body.merchant_transaction_id ??
        body.merchantTransactionId ??
        body.cpm_trans_id ??
        "").trim();
    if (!merchantTransactionId) {
        throw new AppError(400, "INVALID_PAYMENT_NOTIFICATION", "Missing CinetPay merchant transaction reference.");
    }
    /*
     * The merchant transaction ID is the SOMI payment reference
     * created during createPaymentIntent().
     */
    const payment = await getPaymentByReference("", merchantTransactionId).catch(() => null);
    /*
     * We deliberately do not trust the notification payload for:
     *
     * - amount
     * - currency
     * - status
     * - payment method
     * - provider transaction ID
     *
     * Those values must come from CinetPay's server-side verification.
     *
     * E14.9.7 will connect this notification to:
     *
     *   OAuth
     *      ↓
     *   GET /v1/payment/{merchant_transaction_id}
     *      ↓
     *   provider response validation
     *      ↓
     *   handleVerifiedCinetPayEvent()
     */
    if (!payment) {
        /*
         * Return 200 for an unknown notification so CinetPay does not
         * repeatedly retry a notification for a payment that SOMI
         * does not recognize.
         *
         * No financial operation is performed.
         */
        res.status(200).json({
            received: true,
            processed: false,
        });
        return;
    }
    res.status(200).json({
        received: true,
        processed: false,
        paymentId: payment.id,
        status: payment.status,
    });
}));
economyRouter.use(requireAuth);
economyRouter.get("/payments/reference/:somiReference", asyncRoute(async (req, res) => {
    res.json(await getPaymentByReference(req.user.id, String(req.params.somiReference)));
}));
economyRouter.get("/wallet", asyncRoute(async (req, res) => res.json(await getWallet(req.user.id))));
economyRouter.get("/wallet/transactions", validate(paginationSchema, "query"), asyncRoute(async (req, res) => {
    const { limit, offset } = req.query;
    res.json({
        transactions: await getTransactions(req.user.id, limit, offset),
        limit,
        offset,
    });
}));
economyRouter.post("/wallet/purchase", validate(purchaseSchema), asyncRoute(async (req, res) => {
    const { packageId } = req.body;
    /*
     * SOMI creates the payment intent first.
     *
     * The payment remains PENDING.
     * No wallet credit occurs here.
     */
    const payment = await createPaymentIntent(req.user.id, packageId);
    const { env } = await import("../../config/env.js");
    if (!env.CINETPAY_API_KEY ||
        !env.CINETPAY_API_PASSWORD ||
        !env.CINETPAY_API_BASE_URL ||
        !env.CINETPAY_NOTIFY_URL ||
        !env.CINETPAY_RETURN_URL ||
        !env.CINETPAY_FAILED_URL) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "Payment provider is not configured.");
    }
    try {
        const checkout = await createCinetPayPayment({
            somiReference: payment.somiReference,
            amount: payment.amount,
            currency: payment.currency,
            coins: payment.coins,
            packageId: payment.packageId,
        }, {
            apiKey: env.CINETPAY_API_KEY,
            apiPassword: env.CINETPAY_API_PASSWORD,
            apiBaseUrl: env.CINETPAY_API_BASE_URL,
            successUrl: (() => {
                const url = new URL(env.CINETPAY_RETURN_URL);
                url.searchParams.set("reference", payment.somiReference);
                return url.toString();
            })(),
            failedUrl: (() => {
                const url = new URL(env.CINETPAY_FAILED_URL);
                url.searchParams.set("reference", payment.somiReference);
                return url.toString();
            })(),
            notifyUrl: env.CINETPAY_NOTIFY_URL,
            /*
             * CinetPay v1 uses the singular `channel` field.
             * We retain the existing configuration value for now.
             */
            channel: env.CINETPAY_CHANNELS,
        });
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
    }
    catch (error) {
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
}));
economyRouter.get("/books/:bookId/chapters/:chapterId/entitlement", asyncRoute(async (req, res) => {
    res.json(await getChapterEntitlement(req.user.id, String(req.params.bookId), String(req.params.chapterId)));
}));
economyRouter.post("/books/:bookId/chapters/:chapterId/unlock", asyncRoute(async (req, res) => {
    res.json(await unlockChapter(req.user.id, String(req.params.bookId), String(req.params.chapterId)));
}));
