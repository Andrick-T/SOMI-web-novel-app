export const SUPPORTED_WRITER_CURRENCIES = ["XAF", "USD", "EUR", "CAD"];
export const WRITER_PAYOUT_METHODS = [
    "ORANGE_MONEY",
    "MTN_MOBILE_MONEY",
    "PAYPAL",
];
export const COINS_PER_CFA = 4.2;
export const CFA_PER_COIN = 1 / COINS_PER_CFA;
export const WRITER_EXCHANGE_RATES_CFA = {
    XAF: 1,
    USD: 550,
    EUR: 650,
    CAD: 404,
};
export const MINIMUM_WRITER_WITHDRAWAL_COINS = 21_000;
export const MINIMUM_WRITER_WITHDRAWAL_CFA = 5_000;
export const WRITER_WITHDRAWAL_STATUSES = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
];
export const ACTIVE_WRITER_WITHDRAWAL_STATUSES = [
    "PENDING",
    "PROCESSING",
];
export function isSupportedWriterCurrency(value) {
    return SUPPORTED_WRITER_CURRENCIES.includes(value);
}
export function getWriterExchangeRateCfa(currency) {
    return WRITER_EXCHANGE_RATES_CFA[currency];
}
export function coinsToCfa(coins) {
    if (!Number.isInteger(coins) || coins < 0) {
        throw new Error("coins must be a non-negative integer.");
    }
    return coins * CFA_PER_COIN;
}
export function cfaToCurrency(cfa, currency) {
    if (!Number.isFinite(cfa) || cfa < 0) {
        throw new Error("cfa must be a non-negative number.");
    }
    return cfa / getWriterExchangeRateCfa(currency);
}
export function coinsToCurrency(coins, currency) {
    return cfaToCurrency(coinsToCfa(coins), currency);
}
export function roundMoney(value, decimals = 2) {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error("value must be a non-negative finite number.");
    }
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
}
/**
 * Financial calculation policy:
 * - Earnings are stored in integer SOMI coins.
 * - CFA conversion keeps full precision internally.
 * - Currency conversion is only rounded for presentation/payout amount.
 * - The exchange rate used for a withdrawal is snapshotted on that withdrawal.
 */
export function calculateWriterPayout(coins, currency) {
    const amountCfa = coinsToCfa(coins);
    const exchangeRateCfa = getWriterExchangeRateCfa(currency);
    const amount = roundMoney(amountCfa / exchangeRateCfa, 2);
    return {
        coins,
        amountCfa,
        currency,
        exchangeRateCfa,
        amount,
    };
}
