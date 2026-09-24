import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
import { attributeWriterEarning } from "../writer/writer.service.js";
import {
  COIN_PACKAGES,
  MINIMUM_PURCHASE_CFA,
  type CoinPackageId,
} from "./economy.rules.js";

const PUBLISHED = "PUBLISHED";
const PREMIUM = "PREMIUM";
const COMPLETED = "COMPLETED";

export const coinPackages = COIN_PACKAGES;

export type TrustedPaymentEvent = {
  userId: string;
  packageId?: CoinPackageId;
  amountCfa?: number;
  providerReference: string;
  verified: true;
};

// Persisted balances are whole coins. The 4.2 CFA conversion is represented as
// 21/5 and rounded to the nearest whole coin, with halves rounded up, without
// floating point math.
export function getCoinsForCustomPurchase(amountCfa: number) {
  if (!Number.isSafeInteger(amountCfa) || amountCfa < MINIMUM_PURCHASE_CFA) {
    throw new AppError(
      422,
      "INVALID_PURCHASE_AMOUNT",
      "Purchase amount must be at least 125 FCFA.",
    );
  }

  return Math.floor((amountCfa * 21 + 2) / 5);
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
export async function createPaymentIntent(
  userId: string,
  packageId: CoinPackageId,
) {
  const packageConfig = coinPackages[packageId];

  if (!packageConfig) {
    throw new AppError(422, "INVALID_PACKAGE", "Unknown coin package.");
  }

  const somiReference = `SOMI-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      userId,
      packageId,
      amount: packageConfig.amountCfa,
      currency: "XAF",
      amountCfa: packageConfig.amountCfa,
      coins: packageConfig.coins,
      somiReference,
      provider: "CINETPAY",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return {
    paymentId: payment.id,
    somiReference: payment.somiReference,
    packageId: payment.packageId,
    amount: Number(payment.amount),
    currency: payment.currency,
    coins: payment.coins,
    provider: payment.provider,
    status: payment.status,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
  };
}



export async function markPaymentFailed(paymentId: string) {
  await prisma.payment.updateMany({
    where: {
      id: paymentId,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });
}



export async function findPaymentBySomiReference(userId: string, somiReference: string) {
  const payment = await prisma.payment.findFirst({
    where: { userId, somiReference },
  });

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  }

  return {
    id: payment.id,
    somiReference: payment.somiReference,
    providerReference: payment.providerReference,
    packageId: payment.packageId,
    amount: Number(payment.amount),
    amountCfa: payment.amountCfa,
    currency: payment.currency,
    coins: payment.coins,
    provider: payment.provider,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

export type CinetPayVerifiedEvent = {
  somiReference: string;
  providerReference: string;
  status: "ACCEPTED" | "REFUSED" | "PENDING";
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  verifiedAt: Date;
};

export async function handleVerifiedCinetPayEvent(event: CinetPayVerifiedEvent) {
  const payment = await prisma.payment.findUnique({
    where: { somiReference: event.somiReference },
  });

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  }

  if (payment.provider !== "CINETPAY") {
    throw new AppError(409, "PAYMENT_PROVIDER_MISMATCH", "Payment provider mismatch.");
  }

  if (Number(payment.amount) !== event.amount || payment.currency !== event.currency) {
    throw new AppError(409, "PAYMENT_AMOUNT_MISMATCH", "Verified payment does not match the SOMI payment.");
  }

  if (payment.providerReference && payment.providerReference !== event.providerReference) {
    throw new AppError(409, "PAYMENT_REFERENCE_MISMATCH", "Provider reference mismatch.");
  }

  if (event.status === "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PROCESSING",
        providerReference: event.providerReference,
        paymentMethod: event.paymentMethod ?? payment.paymentMethod,
      },
    });
    return { status: "PROCESSING", paymentId: payment.id };
  }

  if (event.status === "REFUSED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        providerReference: event.providerReference,
        paymentMethod: event.paymentMethod ?? payment.paymentMethod,
        verifiedAt: event.verifiedAt,
      },
    });
    return { status: "FAILED", paymentId: payment.id };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PROCESSING",
      providerReference: event.providerReference,
      paymentMethod: event.paymentMethod ?? payment.paymentMethod,
      verifiedAt: event.verifiedAt,
    },
  });

  return settleVerifiedPayment(payment.id);
}

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

export async function settleVerifiedPayment(paymentId: string) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
        });

        if (!payment) {
          throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
        }

        if (payment.status === "FAILED" || payment.status === "CANCELLED" || payment.status === "EXPIRED") {
          throw new AppError(409, "PAYMENT_NOT_SETTLEABLE", "This payment cannot be settled.");
        }

        const claim = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          data: { status: "SUCCESS" },
        });

        if (claim.count === 0) {
          const settled = await tx.payment.findUnique({ where: { id: payment.id } });
          if (settled?.status === "SUCCESS") {
            const existing = await tx.walletTransaction.findUnique({
              where: { paymentId: payment.id },
            });
            return {
              paymentId: payment.id,
              walletTransactionId: existing?.id ?? null,
              balance: null,
              coins: payment.coins,
              status: "SUCCESS",
              alreadySettled: true,
            };
          }
          throw new AppError(409, "PAYMENT_NOT_SETTLEABLE", "This payment is not ready for settlement.");
        }

        const wallet = await tx.wallet.upsert({
          where: { userId: payment.userId },
          create: { userId: payment.userId },
          update: {},
        });

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: payment.coins } },
        });

        const walletTransaction = await tx.walletTransaction.create({
          data: {
            userId: payment.userId,
            type: "COIN_PURCHASE",
            amount: payment.amountCfa ?? Number(payment.amount),
            coins: payment.coins,
            status: COMPLETED,
            reference: payment.somiReference,
            paymentId: payment.id,
            metadata: {
              packageId: payment.packageId,
              provider: payment.provider,
              providerReference: payment.providerReference,
              balanceBefore: wallet.balance,
              balanceAfter: updatedWallet.balance,
            },
          },
        });

        return {
          paymentId: payment.id,
          walletTransactionId: walletTransaction.id,
          balance: updatedWallet.balance,
          coins: payment.coins,
          status: "SUCCESS",
          alreadySettled: false,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return settleVerifiedPayment(paymentId);
    }
    throw error;
  }
}
