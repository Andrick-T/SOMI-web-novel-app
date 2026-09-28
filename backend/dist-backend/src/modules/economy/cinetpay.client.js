import { AppError } from "../../common/errors/http-error.js";
let cachedOAuthToken = null;
const OAUTH_TOKEN_REFRESH_MARGIN_MS = 60_000;
/**
 * ============================================================
 * E14.9.9 — Provider resilience
 * ============================================================
 *
 * Every outbound CinetPay request has a bounded execution time.
 *
 * We deliberately do not implement automatic retries here.
 * A payment initialization or verification request can have
 * financial consequences, so retries must be introduced only
 * together with an explicit idempotency/reconciliation strategy.
 */
const CINETPAY_REQUEST_TIMEOUT_MS = 15_000;
async function fetchCinetPay(input, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, CINETPAY_REQUEST_TIMEOUT_MS);
    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new AppError(504, "PAYMENT_PROVIDER_TIMEOUT", "CinetPay did not respond within the allowed time.");
        }
        throw new AppError(502, "PAYMENT_PROVIDER_UNAVAILABLE", "Unable to connect to the CinetPay payment service.");
    }
    finally {
        clearTimeout(timeout);
    }
}
export async function authenticateCinetPay(config) {
    if (!config.apiKey.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay API key is not configured.");
    }
    if (!config.apiPassword.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay API password is not configured.");
    }
    const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    const loginUrl = `${baseUrl}/v1/oauth/login`;
    const response = await fetchCinetPay(loginUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "SOMI-Payment-Service/1.0",
        },
        body: JSON.stringify({
            api_key: config.apiKey,
            api_password: config.apiPassword,
        }),
    });
    let body;
    try {
        body = (await response.json());
    }
    catch {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay returned an invalid authentication response.");
    }
    if (!response.ok ||
        body.code !== 200 ||
        body.status !== "OK" ||
        !body.access_token) {
        throw new AppError(502, "PAYMENT_PROVIDER_AUTHENTICATION_FAILED", body.message ?? "CinetPay authentication failed.");
    }
    const expiresInSeconds = typeof body.expires_in === "number" && body.expires_in > 0
        ? body.expires_in
        : 0;
    if (expiresInSeconds <= 0) {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay did not return a valid OAuth token expiration.");
    }
    const token = {
        accessToken: body.access_token,
        tokenType: body.token_type?.trim() || "bearer",
        expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    cachedOAuthToken = token;
    return token;
}
export async function getCinetPayAccessToken(config) {
    if (cachedOAuthToken &&
        cachedOAuthToken.expiresAt - OAUTH_TOKEN_REFRESH_MARGIN_MS > Date.now()) {
        return cachedOAuthToken;
    }
    return authenticateCinetPay(config);
}
export function clearCinetPayAccessToken() {
    cachedOAuthToken = null;
}
export async function createCinetPayPayment(payment, config) {
    if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0) {
        throw new AppError(422, "INVALID_PAYMENT_AMOUNT", "The payment amount must be a positive integer.");
    }
    if (!payment.somiReference.trim()) {
        throw new AppError(422, "INVALID_PAYMENT_REFERENCE", "The SOMI payment reference is required.");
    }
    if (payment.somiReference.length > 30) {
        throw new AppError(422, "INVALID_PAYMENT_REFERENCE", "The SOMI payment reference is too long for CinetPay.");
    }
    if (payment.currency !== "XAF") {
        throw new AppError(422, "INVALID_PAYMENT_CURRENCY", "SOMI payments must use XAF.");
    }
    if (!config.successUrl.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay success URL is not configured.");
    }
    if (!config.failedUrl.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay failed URL is not configured.");
    }
    if (!config.notifyUrl.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay notification URL is not configured.");
    }
    if (!config.channel.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay payment channel is not configured.");
    }
    const token = await getCinetPayAccessToken({
        apiKey: config.apiKey,
        apiPassword: config.apiPassword,
        apiBaseUrl: config.apiBaseUrl,
    });
    const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    const paymentEndpoint = `${baseUrl}/v1/payment`;
    const payload = {
        currency: payment.currency,
        merchant_transaction_id: payment.somiReference,
        amount: payment.amount,
        lang: "fr",
        designation: `SOMI ${payment.packageId ?? "coin purchase"} - ${payment.coins} coins`,
        success_url: config.successUrl,
        failed_url: config.failedUrl,
        notify_url: config.notifyUrl,
        channel: config.channel,
        direct_pay: false,
    };
    const response = await fetchCinetPay(paymentEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `${token.tokenType} ${token.accessToken}`,
            "User-Agent": "SOMI-Payment-Service/1.0",
        },
        body: JSON.stringify(payload),
    });
    let body;
    try {
        body = (await response.json());
    }
    catch {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay returned an invalid payment initialization response.");
    }
    if (!response.ok || body.code !== 201) {
        if (response.status === 401 || response.status === 403) {
            clearCinetPayAccessToken();
        }
        throw new AppError(502, "PAYMENT_PROVIDER_ERROR", body.message ?? "CinetPay rejected the payment initialization request.");
    }
    const providerPaymentToken = body.data?.payment_token?.trim();
    const providerPaymentUrl = body.data?.payment_url?.trim();
    if (!providerPaymentToken) {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay did not return a payment token.");
    }
    if (!providerPaymentUrl) {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay did not return a payment URL.");
    }
    return {
        paymentToken: providerPaymentToken,
        paymentUrl: providerPaymentUrl,
    };
}
export async function verifyCinetPayPayment(merchantTransactionId, config) {
    const reference = merchantTransactionId.trim();
    if (!reference) {
        throw new AppError(422, "INVALID_PAYMENT_REFERENCE", "The CinetPay merchant transaction reference is required.");
    }
    if (reference.length > 30) {
        throw new AppError(422, "INVALID_PAYMENT_REFERENCE", "The CinetPay merchant transaction reference is too long.");
    }
    const token = await getCinetPayAccessToken({
        apiKey: config.apiKey,
        apiPassword: config.apiPassword,
        apiBaseUrl: config.apiBaseUrl,
    });
    const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    const verificationUrl = `${baseUrl}/v1/payment/${encodeURIComponent(reference)}`;
    const response = await fetchCinetPay(verificationUrl, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `${token.tokenType} ${token.accessToken}`,
            "User-Agent": "SOMI-Payment-Service/1.0",
        },
    });
    let body;
    try {
        body = (await response.json());
    }
    catch {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay returned an invalid payment verification response.");
    }
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            clearCinetPayAccessToken();
        }
        throw new AppError(502, "PAYMENT_PROVIDER_ERROR", body.message ?? "CinetPay payment verification failed.");
    }
    const returnedReference = body.merchant_transaction_id?.trim();
    if (!returnedReference) {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay did not return a merchant transaction reference.");
    }
    if (returnedReference !== reference) {
        throw new AppError(409, "PAYMENT_PROVIDER_REFERENCE_MISMATCH", "CinetPay returned a different merchant transaction reference.");
    }
    const providerReference = body.transaction_id?.trim();
    if (!providerReference) {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay did not return a provider transaction reference.");
    }
    const status = body.status?.trim().toUpperCase();
    if (!status) {
        throw new AppError(502, "PAYMENT_PROVIDER_INVALID_RESPONSE", "CinetPay did not return a payment status.");
    }
    return {
        code: body.code,
        status,
        merchantTransactionId: returnedReference,
        providerReference,
        paymentMethod: body.payment_method?.trim() || null,
    };
}
