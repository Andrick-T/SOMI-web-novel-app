import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateCinetPay, clearCinetPayAccessToken, createCinetPayPayment, verifyCinetPayPayment, } from "./cinetpay.client.js";
const BASE_CONFIG = {
    apiKey: "test-api-key",
    apiPassword: "test-api-password",
    apiBaseUrl: "https://api.cinetpay.test",
};
const PAYMENT_CONFIG = {
    ...BASE_CONFIG,
    successUrl: "https://somi.test/payment/success",
    failedUrl: "https://somi.test/payment/failed",
    notifyUrl: "https://somi.test/api/v1/payments/cinetpay/notify",
    channel: "ALL",
};
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {
        "Content-Type": "application/json",
    },
});
describe("CinetPay client", () => {
    beforeEach(() => {
        clearCinetPayAccessToken();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });
    afterEach(() => {
        clearCinetPayAccessToken();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });
    describe("OAuth authentication", () => {
        it("authenticates successfully and caches the OAuth token", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "access-token-1",
                token_type: "bearer",
                expires_in: 5767,
            }));
            const token = await authenticateCinetPay(BASE_CONFIG);
            expect(token.accessToken).toBe("access-token-1");
            expect(token.tokenType).toBe("bearer");
            expect(token.expiresAt).toBeGreaterThan(Date.now());
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, init] = fetchMock.mock.calls[0];
            expect(url).toBe("https://api.cinetpay.test/v1/oauth/login");
            expect(init?.method).toBe("POST");
            expect(init?.headers).toMatchObject({
                "Content-Type": "application/json",
                Accept: "application/json",
            });
            expect(JSON.parse(String(init?.body))).toEqual({
                api_key: "test-api-key",
                api_password: "test-api-password",
            });
        });
        it("reuses a valid cached OAuth token", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "cached-token",
                token_type: "bearer",
                expires_in: 5767,
            }));
            const first = await authenticateCinetPay(BASE_CONFIG);
            const second = await (await import("./cinetpay.client.js")).getCinetPayAccessToken(BASE_CONFIG);
            expect(first.accessToken).toBe("cached-token");
            expect(second.accessToken).toBe("cached-token");
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
        it("rejects a missing API key", async () => {
            await expect(authenticateCinetPay({
                ...BASE_CONFIG,
                apiKey: "",
            })).rejects.toMatchObject({
                statusCode: 503,
                code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
            });
        });
        it("rejects a missing API password", async () => {
            await expect(authenticateCinetPay({
                ...BASE_CONFIG,
                apiPassword: "",
            })).rejects.toMatchObject({
                statusCode: 503,
                code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
            });
        });
        it("maps an authentication network failure", async () => {
            vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network unavailable"));
            await expect(authenticateCinetPay(BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_UNAVAILABLE",
            });
        });
        it("maps an authentication timeout", async () => {
            const timeoutError = new Error("The operation was aborted.");
            timeoutError.name = "AbortError";
            vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(timeoutError);
            await expect(authenticateCinetPay(BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 504,
                code: "PAYMENT_PROVIDER_TIMEOUT",
            });
        });
        it("rejects invalid authentication JSON", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not-json", {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }));
            await expect(authenticateCinetPay(BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("rejects an invalid OAuth response", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({
                code: 500,
                status: "ERROR",
                message: "Invalid credentials",
            }));
            await expect(authenticateCinetPay(BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_AUTHENTICATION_FAILED",
            });
        });
    });
    describe("payment initialization", () => {
        it("creates a CinetPay payment successfully", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "init-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 201,
                status: "ACCEPTED",
                data: {
                    payment_token: "payment-token-123",
                    payment_url: "https://checkout.cinetpay.test/payment-token-123",
                },
            }));
            const result = await createCinetPayPayment({
                somiReference: "SOMI-TEST-001",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG);
            expect(result).toEqual({
                paymentToken: "payment-token-123",
                paymentUrl: "https://checkout.cinetpay.test/payment-token-123",
            });
            expect(fetchMock).toHaveBeenCalledTimes(2);
            const [url, init] = fetchMock.mock.calls[1];
            expect(url).toBe("https://api.cinetpay.test/v1/payment");
            expect(init?.method).toBe("POST");
            expect(init?.headers).toMatchObject({
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: "bearer init-token",
            });
            expect(JSON.parse(String(init?.body))).toEqual({
                currency: "XAF",
                merchant_transaction_id: "SOMI-TEST-001",
                amount: 425,
                lang: "fr",
                designation: "SOMI plus - 1785 coins",
                success_url: PAYMENT_CONFIG.successUrl,
                failed_url: PAYMENT_CONFIG.failedUrl,
                notify_url: PAYMENT_CONFIG.notifyUrl,
                channel: "ALL",
                direct_pay: false,
            });
        });
        it("rejects an invalid payment amount before calling CinetPay", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-002",
                amount: 0,
                currency: "XAF",
                coins: 525,
                packageId: "starter",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_AMOUNT",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("rejects a non-integer payment amount", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-003",
                amount: 425.5,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_AMOUNT",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("rejects an empty payment reference", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(createCinetPayPayment({
                somiReference: "   ",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_REFERENCE",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("rejects a payment reference longer than 30 characters", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(createCinetPayPayment({
                somiReference: "S".repeat(31),
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_REFERENCE",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("rejects a non-XAF payment", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-004",
                amount: 425,
                currency: "EUR",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_CURRENCY",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("maps a payment initialization network failure", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "init-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockRejectedValueOnce(new Error("network unavailable"));
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-005",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_UNAVAILABLE",
            });
        });
        it("maps a payment initialization timeout", async () => {
            const timeoutError = new Error("The operation was aborted.");
            timeoutError.name = "AbortError";
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "init-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockRejectedValueOnce(timeoutError);
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-006",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 504,
                code: "PAYMENT_PROVIDER_TIMEOUT",
            });
        });
        it("rejects invalid payment initialization JSON", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "init-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(new Response("not-json", {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }));
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-007",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("rejects an initialization response without a payment token", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "init-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 201,
                status: "ACCEPTED",
                data: {
                    payment_url: "https://checkout.cinetpay.test/payment",
                },
            }));
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-008",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("rejects an initialization response without a payment URL", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "init-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 201,
                status: "ACCEPTED",
                data: {
                    payment_token: "payment-token",
                },
            }));
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-009",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("clears the cached OAuth token after a 401 provider response", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "token-before-401",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 401,
                status: "ERROR",
                message: "Unauthorized",
            }, 401))
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "token-after-401",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 201,
                status: "ACCEPTED",
                data: {
                    payment_token: "payment-token-after-401",
                    payment_url: "https://checkout.cinetpay.test/payment-after-401",
                },
            }));
            await expect(createCinetPayPayment({
                somiReference: "SOMI-TEST-010",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_ERROR",
            });
            const result = await createCinetPayPayment({
                somiReference: "SOMI-TEST-011",
                amount: 425,
                currency: "XAF",
                coins: 1785,
                packageId: "plus",
            }, PAYMENT_CONFIG);
            expect(result.paymentToken).toBe("payment-token-after-401");
            expect(fetchMock).toHaveBeenCalledTimes(4);
        });
    });
    describe("server-side payment verification", () => {
        it("verifies a successful payment", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                status: "SUCCESS",
                merchant_transaction_id: "SOMI-VERIFY-001",
                transaction_id: "cinetpay-transaction-001",
                payment_method: "OM",
            }));
            const result = await verifyCinetPayPayment("SOMI-VERIFY-001", BASE_CONFIG);
            expect(result).toEqual({
                code: 100,
                status: "SUCCESS",
                merchantTransactionId: "SOMI-VERIFY-001",
                providerReference: "cinetpay-transaction-001",
                paymentMethod: "OM",
            });
            expect(fetchMock).toHaveBeenCalledTimes(2);
            const [url, init] = fetchMock.mock.calls[1];
            expect(url).toBe("https://api.cinetpay.test/v1/payment/SOMI-VERIFY-001");
            expect(init?.method).toBe("GET");
            expect(init?.headers).toMatchObject({
                Accept: "application/json",
                Authorization: "bearer verification-token",
            });
        });
        it("normalizes a provider status to uppercase", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                status: "success",
                merchant_transaction_id: "SOMI-VERIFY-002",
                transaction_id: "transaction-002",
                payment_method: "OM",
            }));
            const result = await verifyCinetPayPayment("SOMI-VERIFY-002", BASE_CONFIG);
            expect(result.status).toBe("SUCCESS");
        });
        it("rejects an empty verification reference", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(verifyCinetPayPayment("", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_REFERENCE",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("rejects an oversized verification reference", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            await expect(verifyCinetPayPayment("R".repeat(31), BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 422,
                code: "INVALID_PAYMENT_REFERENCE",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });
        it("maps a verification network failure", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockRejectedValueOnce(new Error("network unavailable"));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-003", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_UNAVAILABLE",
            });
        });
        it("maps a verification timeout", async () => {
            const timeoutError = new Error("The operation was aborted.");
            timeoutError.name = "AbortError";
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockRejectedValueOnce(timeoutError);
            await expect(verifyCinetPayPayment("SOMI-VERIFY-004", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 504,
                code: "PAYMENT_PROVIDER_TIMEOUT",
            });
        });
        it("rejects invalid verification JSON", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(new Response("not-json", {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-005", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("rejects a verification response without a merchant reference", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                status: "SUCCESS",
                transaction_id: "transaction-006",
            }));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-006", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("rejects a mismatched merchant transaction reference", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                status: "SUCCESS",
                merchant_transaction_id: "DIFFERENT-REFERENCE",
                transaction_id: "transaction-007",
            }));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-007", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 409,
                code: "PAYMENT_PROVIDER_REFERENCE_MISMATCH",
            });
        });
        it("rejects a verification response without a provider transaction ID", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                status: "SUCCESS",
                merchant_transaction_id: "SOMI-VERIFY-008",
            }));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-008", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("rejects a verification response without a payment status", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                merchant_transaction_id: "SOMI-VERIFY-009",
                transaction_id: "transaction-009",
            }));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-009", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_INVALID_RESPONSE",
            });
        });
        it("maps an HTTP provider error", async () => {
            vi.spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "verification-token",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 500,
                status: "ERROR",
                message: "Provider error",
            }, 500));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-010", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_ERROR",
            });
        });
        it("clears the cached OAuth token after a 403 verification response", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "token-before-403",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 403,
                status: "ERROR",
                message: "Forbidden",
            }, 403))
                .mockResolvedValueOnce(jsonResponse({
                code: 200,
                status: "OK",
                access_token: "token-after-403",
                token_type: "bearer",
                expires_in: 5767,
            }))
                .mockResolvedValueOnce(jsonResponse({
                code: 100,
                status: "SUCCESS",
                merchant_transaction_id: "SOMI-VERIFY-011",
                transaction_id: "transaction-after-403",
                payment_method: "OM",
            }));
            await expect(verifyCinetPayPayment("SOMI-VERIFY-011", BASE_CONFIG)).rejects.toMatchObject({
                statusCode: 502,
                code: "PAYMENT_PROVIDER_ERROR",
            });
            const result = await verifyCinetPayPayment("SOMI-VERIFY-011", BASE_CONFIG);
            expect(result.providerReference).toBe("transaction-after-403");
            expect(fetchMock).toHaveBeenCalledTimes(4);
        });
    });
});
