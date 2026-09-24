export const SUPPORTED_WRITER_CURRENCIES = ["XAF", "USD", "EUR", "CAD"] as const;
export type WriterCurrency = (typeof SUPPORTED_WRITER_CURRENCIES)[number];

export const WRITER_PAYOUT_METHODS = [
  "ORANGE_MONEY",
  "MTN_MOBILE_MONEY",
  "PAYPAL",
] as const;
export type WriterPayoutMethod = (typeof WRITER_PAYOUT_METHODS)[number];

export const COINS_PER_CFA = 4.2;
export const CFA_PER_COIN = 1 / COINS_PER_CFA;

export const WRITER_EXCHANGE_RATES_CFA: Readonly<Record<WriterCurrency, number>> = {
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
] as const;
export type WriterWithdrawalStatus =
  (typeof WRITER_WITHDRAWAL_STATUSES)[number];

export const ACTIVE_WRITER_WITHDRAWAL_STATUSES = [
  "PENDING",
  "PROCESSING",
] as const;

export function isSupportedWriterCurrency(value: string): value is WriterCurrency {
  return (SUPPORTED_WRITER_CURRENCIES as readonly string[]).includes(value);
}

export function getWriterExchangeRateCfa(currency: WriterCurrency): number {
  return WRITER_EXCHANGE_RATES_CFA[currency];
}

export function coinsToCfa(coins: number): number {
  if (!Number.isInteger(coins) || coins < 0) {
    throw new Error("coins must be a non-negative integer.");
  }
  return coins * CFA_PER_COIN;
}

export function cfaToCurrency(cfa: number, currency: WriterCurrency): number {
  if (!Number.isFinite(cfa) || cfa < 0) {
    throw new Error("cfa must be a non-negative number.");
  }
  return cfa / getWriterExchangeRateCfa(currency);
}

export function coinsToCurrency(coins: number, currency: WriterCurrency): number {
  return cfaToCurrency(coinsToCfa(coins), currency);
}

export function roundMoney(value: number, decimals = 2): number {
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
export function calculateWriterPayout(coins: number, currency: WriterCurrency) {
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
