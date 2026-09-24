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

export const WRITER_EXCHANGE_RATES_CFA: Record<WriterCurrency, number> = {
  XAF: 1,
  USD: 550,
  EUR: 650,
  CAD: 404,
};

export const MINIMUM_WRITER_WITHDRAWAL_COINS = 21_000;
export const MINIMUM_WRITER_WITHDRAWAL_CFA = 5_000;

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
  return cfa / WRITER_EXCHANGE_RATES_CFA[currency];
}
