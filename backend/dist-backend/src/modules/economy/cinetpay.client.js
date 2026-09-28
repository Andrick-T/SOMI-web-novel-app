import { AppError } from "../../common/errors/http-error.js";
let cachedOAuthToken = null;
/**
 * Safety margin used before the provider-reported expiration time.
 *
 * We deliberately refresh the token before it actually expires so that
 * an API request does not start with a token that is about to become
 * invalid during the request.
 */
const OAUTH_TOKEN_REFRESH_MARGIN_MS = 60_000;
/**
 * Authenticate against CinetPay v1 OAuth.
 *
 * Contract:
 *
 * POST {baseUrl}/v1/oauth/login
 *
 * {
 *   "api_key": "...",
 *   "api_password": "..."
 * }
 *
 * The credentials remain strictly backend-side.
 */
export async function authenticateCinetPay(config) {
    if (!config.apiKey.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay API key is not configured.");
    }
    if (!config.apiPassword.trim()) {
        throw new AppError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "CinetPay API password is not configured.");
    }
    const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    const loginUrl = `${baseUrl}/v1/oauth/login`;
    let response;
    try {
        response = await fetch(loginUrl, {
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
    }
    catch {
        throw new AppError(502, "PAYMENT_PROVIDER_UNAVAILABLE", "Unable to connect to the CinetPay authentication service.");
    }
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
/**
 * Return a valid CinetPay OAuth access token.
 *
 * A cached token is reused until it reaches the refresh safety margin.
 * When it is expired or close to expiration, a new OAuth login is
 * performed automatically.
 */
export async function getCinetPayAccessToken(config) {
    if (cachedOAuthToken &&
        cachedOAuthToken.expiresAt - OAUTH_TOKEN_REFRESH_MARGIN_MS > Date.now()) {
        return cachedOAuthToken;
    }
    return authenticateCinetPay(config);
}
/**
 * Clear the in-memory OAuth token.
 *
 * This is useful when a later authenticated request receives an
 * authentication failure and the caller needs to force a fresh login.
 */
export function clearCinetPayAccessToken() {
    cachedOAuthToken = null;
}
