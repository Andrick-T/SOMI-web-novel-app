export type TransactionType =
  | "COIN_PURCHASE"
  | "CHAPTER_UNLOCK"
  | "REFUND"
  | "BONUS"
  | "ADJUSTMENT";

export type TransactionStatus = "success" | "pending" | "failed";

export interface Wallet {
  userId: string;
  balance: number;
  currency: "SOMI";
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  currency: "SOMI";
  amount: number;
  coins: number;
  status: TransactionStatus;
  reference: string;
  createdAt: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  amountCfa: number;
  coins: number;
  bonusCoins?: number;
  popular?: boolean;
  bestValue?: boolean;
}

export type EntitlementStatus = "LOCKED" | "UNLOCKED" | "PENDING" | "FAILED";

export interface ChapterEntitlement {
  userId: string;
  bookId: string;
  chapterId: string;
  status: EntitlementStatus;
  pricePaid: number;
  coinsSpent: number;
  unlockedAt?: string;
}

export const coinPackageCatalog: CoinPackage[] = [
  { id: "starter", name: "Starter", amountCfa: 100, coins: 680 },
  {
    id: "standard",
    name: "Standard",
    amountCfa: 175,
    coins: 3150,
    popular: true,
  },
  { id: "plus", name: "Plus", amountCfa: 425, coins: 8000 },
  {
    id: "premium",
    name: "Premium",
    amountCfa: 850,
    coins: 17000,
    bestValue: true,
  },
];

export const MINIMUM_PURCHASE_CFA = 100;

export function getCoinsFromCfa(amountCfa: number): number {
  const config = coinPackageCatalog.find((pkg) => pkg.amountCfa === amountCfa);
  if (config) return config.coins;

  const exactPackages = new Map<number, number>([
    [175, 3150],
    [425, 8000],
    [850, 17000],
  ]);
  if (exactPackages.has(amountCfa)) return exactPackages.get(amountCfa)!;

  return Math.max(0, Math.round(amountCfa * 6.8));
}

export function createWallet({
  userId,
  balance = 0,
}: {
  userId: string;
  balance?: number;
}): Wallet {
  return {
    userId,
    balance: Math.max(0, balance),
    currency: "SOMI",
  };
}

export function canAffordChapter(balance: number, priceCoins: number): boolean {
  return priceCoins >= 0 && balance >= priceCoins;
}

export function createTransaction({
  userId,
  type,
  coins,
  reference,
  status = "success",
  createdAt = new Date().toISOString(),
}: {
  userId: string;
  type: TransactionType;
  coins: number;
  reference: string;
  status?: TransactionStatus;
  createdAt?: string;
}): Transaction {
  return {
    id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    userId,
    type,
    currency: "SOMI",
    amount: coins,
    coins,
    status,
    reference,
    createdAt,
  };
}

export function unlockChapterEntitlement({
  userId,
  bookId,
  chapterId,
  priceCoins,
  wallet,
  existingEntitlements,
}: {
  userId: string;
  bookId: string;
  chapterId: string;
  priceCoins: number;
  wallet: Wallet;
  existingEntitlements: ChapterEntitlement[];
}): {
  success: boolean;
  reason?: "duplicate" | "insufficient-funds" | "invalid";
  wallet: Wallet;
  entitlements: ChapterEntitlement[];
  transaction?: Transaction;
} {
  const hasAccess = existingEntitlements.some(
    (entitlement) =>
      entitlement.chapterId === chapterId && entitlement.bookId === bookId,
  );

  if (!bookId || !chapterId) {
    return {
      success: false,
      reason: "invalid",
      wallet,
      entitlements: existingEntitlements,
    };
  }

  if (hasAccess) {
    return {
      success: false,
      reason: "duplicate",
      wallet,
      entitlements: existingEntitlements,
    };
  }

  if (!canAffordChapter(wallet.balance, priceCoins)) {
    return {
      success: false,
      reason: "insufficient-funds",
      wallet,
      entitlements: existingEntitlements,
    };
  }

  const nextWallet = {
    ...wallet,
    balance: Math.max(0, wallet.balance - priceCoins),
  };

  const entitlement: ChapterEntitlement = {
    userId,
    bookId,
    chapterId,
    status: "UNLOCKED",
    pricePaid: priceCoins,
    coinsSpent: priceCoins,
    unlockedAt: new Date().toISOString(),
  };

  const transaction = createTransaction({
    userId,
    type: "CHAPTER_UNLOCK",
    coins: -priceCoins,
    reference: `${bookId}:${chapterId}`,
  });

  return {
    success: true,
    wallet: nextWallet,
    entitlements: [...existingEntitlements, entitlement],
    transaction,
  };
}

export function purchaseCoins({
  userId,
  packageId,
  wallet,
  transactionHistory,
}: {
  userId: string;
  packageId: string;
  wallet: Wallet;
  transactionHistory: Transaction[];
}) {
  const selected = coinPackageCatalog.find((pkg) => pkg.id === packageId);
  if (!selected) {
    return { success: false, wallet, transactions: transactionHistory };
  }

  if (selected.amountCfa < MINIMUM_PURCHASE_CFA) {
    return { success: false, wallet, transactions: transactionHistory };
  }

  const nextWallet = {
    ...wallet,
    balance: wallet.balance + selected.coins,
  };

  const purchaseTransaction = createTransaction({
    userId,
    type: "COIN_PURCHASE",
    coins: selected.coins,
    reference: selected.id,
  });

  return {
    success: true,
    wallet: nextWallet,
    transactions: [...transactionHistory, purchaseTransaction],
  };
}
