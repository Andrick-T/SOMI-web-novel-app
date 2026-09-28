import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { AppError } from "../../common/errors/http-error.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { paginationSchema, purchaseSchema } from "./economy.schemas.js";
import { getChapterEntitlement, getTransactions, getWallet, getPaymentByReference, unlockChapter, createPaymentIntent, markPaymentFailed, persistCinetPayInitialization, getPaymentBySomiReference, handleVerifiedCinetPayEvent, } from "./economy.service.js";
import { createCinetPayPayment, verifyCinetPayPayment, } from "./cinetpay.client.js";
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const economyRouter = Router();
/**
 * ============================================================
 * E14.9.6 / E14.9.7 / E14.9.8 — CinetPay notification
 * ============================================================
 *
 * CinetPay calls this endpoint directly.
 *
 * It MUST remain outside requireAuth because CinetPay does not
 * have a SOMI user access token.
 */
economyRouter.post("/payments/cinetpay/notify", asyncRoute(async (req, res) => {
    const body = req.body;
    /*
     * CinetPay notifications are not trusted financial events.
     *
     * The notification only tells SOMI that something happened.
     * The server-side verification step is responsible for confirming
     * the real payment status, provider reference and payment method.
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
    if (!env.CINETPAY_API_KEY ||
        !env.CINETPAY_API_PASSWORD ||
        !env.CINETPAY_API_BASE_URL) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "Payment provider is not configured.");
    }
    const verification = await verifyCinetPayPayment(merchantTransactionId, {
        apiKey: env.CINETPAY_API_KEY,
        apiPassword: env.CINETPAY_API_PASSWORD,
        apiBaseUrl: env.CINETPAY_API_BASE_URL,
    });
    /*
     * E14.9.8:
     *
     * CinetPay's verified status is now mapped to the SOMI
     * payment lifecycle. The notification itself is never used
     * as the source of truth.
     *
     * CinetPay:
     *
     *   INITIATED -> SOMI PENDING
     *   SUCCESS   -> SOMI ACCEPTED -> settlement
     *   FAILED    -> SOMI REFUSED -> FAILED
     */
    const statusMap = {
        INITIATED: "PENDING",
        SUCCESS: "ACCEPTED",
        FAILED: "REFUSED",
    };
    const somiStatus = statusMap[verification.status];
    if (!somiStatus) {
        throw new AppError(422, "UNSUPPORTED_PAYMENT_PROVIDER_STATUS", `Unsupported CinetPay payment status: ${verification.status}.`);
    }
    /*
     * The provider verification response currently gives us the
     * authoritative provider reference, status and payment method.
     *
     * Amount and currency are taken from the persisted SOMI payment
     * intent, because the CinetPay status endpoint does not expose
     * those fields in the documented response used by this integration.
     *
     * handleVerifiedCinetPayEvent() then performs the existing
     * server-side amount/currency/reference validation and settlement.
     */
    const settlement = await handleVerifiedCinetPayEvent({
        somiReference: payment.somiReference,
        providerReference: verification.providerReference,
        status: somiStatus,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentMethod: verification.paymentMethod,
        verifiedAt: new Date(),
    });
    res.status(200).json({
        received: true,
        processed: true,
        paymentId: payment.id,
        somiReference: payment.somiReference,
        providerReference: verification.providerReference,
        providerStatus: verification.status,
        paymentMethod: verification.paymentMethod,
        paymentStatus: settlement.status,
        walletTransactionId: settlement.walletTransactionId ?? null,
        alreadySettled: settlement.alreadySettled ?? false,
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
         * E14.9.9 — resilience:
         *
         * A provider/network/timeout error is NOT enough to mark the
         * payment as FAILED.
         *
         * The customer may have reached CinetPay or even completed
         * the payment while SOMI was unable to receive the response.
         *
         * Leaving the payment PENDING allows a later notification,
         * verification or reconciliation process to determine the
         * authoritative result.
         *
         * Only explicit business-level failures should transition
         * the payment to FAILED.
         */
        if (error instanceof AppError &&
            [
                "INVALID_PAYMENT_AMOUNT",
                "INVALID_PAYMENT_REFERENCE",
                "INVALID_PAYMENT_CURRENCY",
                "PAYMENT_PROVIDER_NOT_CONFIGURED",
            ].includes(error.code)) {
            await markPaymentFailed(payment.paymentId);
        }
        throw error;
    }
}));
economyRouter.get("/books/:bookId/chapters/:chapterId/entitlement", asyncRoute(async (req, res) => {
    res.json(await getChapterEntitlement(req.user.id, String(req.params.bookId), String(req.params.chapterId)));
}));
economyRouter.post("/books/:bookId/chapters/:chapterId/unlock", asyncRoute(async (req, res) => {
    res.json(await unlockChapter(req.user.id, String(req.params.bookId), String(req.params.chapterId)));
}));
