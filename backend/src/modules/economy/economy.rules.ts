/**
 * SOMI economy rules.
 *
 * These are the platform's current commercial rules. Provider-specific
 * settlement logic must remain separate and must never override these values.
 */
export const COIN_CONVERSION_RATE_CFA = 4.2;
export const MINIMUM_PURCHASE_CFA = 125;

export const COIN_PACKAGES = {
  starter: { amountCfa: 125, coins: 525 },
  standard: { amountCfa: 275, coins: 1155 },
  plus: { amountCfa: 425, coins: 1785 },
  premium: { amountCfa: 850, coins: 3570 },
} as const;

export type CoinPackageId = keyof typeof COIN_PACKAGES;

export const ACCEPTED_CURRENCIES = ["XAF", "USD", "CAD", "EUR"] as const;

export const CAMEROON_PAYMENT_METHODS = [
  "ORANGE_MONEY",
  "MTN_MOBILE_MONEY",
  "EXPRESS_UNION",
  "VISA_MASTERCARD",
] as const;

export const COINS_EXPIRE = false;

export const REFUND_POLICY = {
  minBusinessDays: 2,
  maxBusinessDays: 10,
  caseByCase: true,
  notificationChannel: "EMAIL",
} as const;

export const WRITER_REVENUE_SHARE = 0.65;
export const MINIMUM_WRITER_WITHDRAWAL_CFA = 5000;
export const MINIMUM_WRITER_WITHDRAWAL_COINS = 21000;

/**
 * Intentionally unresolved E1 rules:
 * - foreign-currency -> CFA conversion source/rate;
 * - treatment of a provider-confirmed payment whose coin settlement failed;
 * - rounding/precision policy for the 65% writer share when a chapter unlock
 *   produces a fractional coin amount.
 */
