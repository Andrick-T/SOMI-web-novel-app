import { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
import { attributeWriterEarning } from "../writer/writer.service.js";

const PUBLISHED = "PUBLISHED";
const PREMIUM = "PREMIUM";
const COMPLETED = "COMPLETED";

export const coinPackages = {
  starter: { amountCfa: 175, coins: 3150 },
  plus: { amountCfa: 425, coins: 8000 },
  premium: { amountCfa: 850, coins: 17000 },
} as const;

export type TrustedPaymentEvent = {
  userId: string;
  packageId?: keyof typeof coinPackages;
  amountCfa?: number;
  providerReference: string;
  verified: true;
};

// Persisted balances are whole coins. 6.8 is represented as 34/5 and rounded
// to the nearest whole coin, with halves rounded up, without floating point math.
export function getCoinsForCustomPurchase(amountCfa: number) {
  if (!Number.isSafeInteger(amountCfa) || amountCfa < 100) {
    throw new AppError(
      422,
      "INVALID_PURCHASE_AMOUNT",
      "Purchase amount must be at least 100 FCFA.",
    );
  }

  return Math.floor((amountCfa * 34 + 2) / 5);
}

export function getPurchaseRule(event: TrustedPaymentEvent) {
  if (event.verified !== true || !event.providerReference.trim()) {
    throw new AppError(
      422,
      "UNVERIFIED_PAYMENT",
      "A verified payment event is required.",
    );
  }

  if (event.packageId) {
    const packageConfig = coinPackages[event.packageId];

    if (
      !packageConfig ||
      (event.amountCfa !== undefined &&
        event.amountCfa !== packageConfig.amountCfa)
    ) {
      throw new AppError(
        422,
        "INVALID_PAYMENT_AMOUNT",
        "Payment amount does not match the selected package.",
      );
    }

    return packageConfig;
  }

  if (event.amountCfa === undefined) {
    throw new AppError(
      422,
      "INVALID_PURCHASE_AMOUNT",
      "A package or custom amount is required.",
    );
  }

  return {
    amountCfa: event.amountCfa,
    coins: getCoinsForCustomPurchase(event.amountCfa),
  };
}

const isPrismaConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === "P2002" || error.code === "P2034");

/**
 * Read-only wallet lookup.
 *
 * IMPORTANT:
 * GET /wallet must never create persistent financial state.
 *
 * Wallets are created by trusted financial operations such as a verified
 * payment. A user who has no wallet yet receives a zero-balance projection.
 */
export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    return {
      wallet: {
        balance: 0,
        currency: "SOMI",
      },
    };
  }

  return {
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
    },
  };
}

export async function getTransactions(
  userId: string,
  limit: number,
  offset: number,
) {
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    coins: transaction.coins,
    status: transaction.status,
    reference: transaction.reference,
    metadata: transaction.metadata,
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function getChapterEntitlement(
  userId: string,
  bookId: string,
  chapterId: string,
) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      bookId: true,
      status: true,
      accessType: true,
      book: { select: { status: true } },
    },
  });

  if (
    !chapter ||
    chapter.bookId !== bookId ||
    chapter.status !== PUBLISHED ||
    chapter.book.status !== PUBLISHED
  ) {
    throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
  }

  if (chapter.accessType !== PREMIUM) {
    return { entitled: true, access: "FREE" };
  }

  const entitlement = await prisma.chapterEntitlement.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  return {
    entitled: Boolean(entitlement),
    access: entitlement ? "UNLOCKED" : "LOCKED",
  };
}

export async function unlockChapter(
  userId: string,
  bookId: string,
  chapterId: string,
  attempt = 0,
) {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const chapter = await tx.chapter.findUnique({
          where: { id: chapterId },
          select: {
            bookId: true,
            status: true,
            accessType: true,
            price: true,
            book: { select: { status: true } },
          },
        });

        if (
          !chapter ||
          chapter.bookId !== bookId ||
          chapter.status !== PUBLISHED ||
          chapter.book.status !== PUBLISHED
        ) {
          throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
        }

        if (chapter.accessType !== PREMIUM) {
          throw new AppError(
            409,
            "CHAPTER_NOT_PREMIUM",
            "This chapter is free.",
          );
        }

        if (chapter.price <= 0) {
          throw new AppError(
            422,
            "INVALID_CHAPTER_PRICE",
            "This chapter has no valid price.",
          );
        }

        const existing = await tx.chapterEntitlement.findUnique({
          where: { userId_chapterId: { userId, chapterId } },
        });

        if (existing) {
          const wallet = await tx.wallet.findUnique({
            where: { userId },
          });

          return {
            entitled: true,
            alreadyUnlocked: true,
            balance: wallet?.balance ?? 0,
          };
        }

        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new AppError(404, "WALLET_NOT_FOUND", "Wallet not found.");
        }

        if (wallet.balance < chapter.price) {
          throw new AppError(
            409,
            "INSUFFICIENT_BALANCE",
            "Insufficient SOMI coin balance.",
          );
        }

        const updated = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            balance: { gte: chapter.price },
          },
          data: {
            balance: { decrement: chapter.price },
          },
        });

        if (updated.count !== 1) {
          throw new AppError(
            409,
            "INSUFFICIENT_BALANCE",
            "Insufficient SOMI coin balance.",
          );
        }

        const balanceAfter = wallet.balance - chapter.price;

        const transaction = await tx.walletTransaction.create({
          data: {
            userId,
            type: "CHAPTER_UNLOCK",
            amount: -chapter.price,
            coins: -chapter.price,
            status: COMPLETED,
            reference: `chapter:${bookId}:${chapterId}`,
            metadata: {
              balanceBefore: wallet.balance,
              balanceAfter,
            },
          },
        });

        await tx.chapterEntitlement.create({
          data: {
            userId,
            bookId,
            chapterId,
            transactionId: transaction.id,
          },
        });

        return {
          entitled: true,
          alreadyUnlocked: false,
          balance: balanceAfter,
          transactionId: transaction.id,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (!result.alreadyUnlocked && result.transactionId) {
      await attributeWriterEarning(`chapter:${bookId}:${chapterId}`);
    }

    return result;
  } catch (error) {
    if (isPrismaConflict(error)) {
      const entitlement = await prisma.chapterEntitlement.findUnique({
        where: { userId_chapterId: { userId, chapterId } },
      });

      if (entitlement) {
        return {
          entitled: true,
          alreadyUnlocked: true,
          balance: (await getWallet(userId)).wallet.balance,
        };
      }

      if (attempt < 3) {
        return unlockChapter(userId, bookId, chapterId, attempt + 1);
      }
    }

    throw error;
  }
}

export async function creditWalletFromTrustedPayment(
  event: TrustedPaymentEvent,
) {
  const packageConfig = getPurchaseRule(event);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.walletTransaction.findFirst({
      where: { reference: event.providerReference },
    });

    if (existing) {
      return existing;
    }

    const wallet = await tx.wallet.upsert({
      where: { userId: event.userId },
      create: { userId: event.userId },
      update: {},
    });

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: packageConfig.coins },
      },
    });

    return tx.walletTransaction.create({
      data: {
        userId: event.userId,
        type: "COIN_PURCHASE",
        amount: packageConfig.amountCfa,
        coins: packageConfig.coins,
        status: COMPLETED,
        reference: event.providerReference,
        metadata: {
          packageId: event.packageId,
          balanceAfter: updated.balance,
        },
      },
    });
  });
}
