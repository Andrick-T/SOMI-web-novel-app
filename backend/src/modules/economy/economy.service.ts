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

/**
 * SOMI coin conversion:
 *
 * 1 CFA = 4.2 coins
 *
 * Persisted wallet balances are whole coins.
 * Conversion is therefore implemented as:
 *
 * amountCfa × 21 / 5
 *
 * and rounded to the nearest whole coin, with halves rounded up.
 *
 * No floating-point arithmetic is used for the conversion.
 */
export function getCoinsForCustomPurchase(amountCfa: number): number {
  if (!Number.isSafeInteger(amountCfa) || amountCfa < MINIMUM_PURCHASE_CFA) {
    throw new AppError(
      422,
      "INVALID_PURCHASE_AMOUNT",
      "Purchase amount must be at least 125 FCFA.",
    );
  }

  return Math.floor((amountCfa * 21 + 2) / 5);
}

/**
 * Create a persisted SOMI payment intent.
 *
 * This function does NOT credit coins.
 *
 * Flow:
 *   1. Validate the selected package.
 *   2. Generate a unique SOMI reference.
 *   3. Persist the payment as PENDING.
 *   4. Return the information required to initiate the provider checkout.
 *
 * Coins are credited only after a trusted provider verification event.
 */
export async function createPaymentIntent(
  userId: string,
  packageId: CoinPackageId,
) {
  const packageConfig = coinPackages[packageId];

  if (!packageConfig) {
    throw new AppError(422, "INVALID_PACKAGE", "Unknown coin package.");
  }

  const somiReference = `SOMI-${new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

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

/**
 * Mark a pending payment as failed.
 *
 * This operation never credits the wallet.
 */
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

/**
 * Expire payments that were never completed before their expiration time.
 */
export async function expirePendingPayments(now = new Date()) {
  const result = await prisma.payment.updateMany({
    where: {
      status: {
        in: ["PENDING", "PROCESSING"],
      },
      expiresAt: {
        not: null,
        lte: now,
      },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return {
    expired: result.count,
  };
}

/**
 * Cancel a payment belonging to the authenticated user.
 *
 * A completed payment can never be cancelled.
 * Terminal failed/cancelled/expired payments are returned unchanged.
 */
export async function cancelPayment(userId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
  });

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  }

  if (payment.status === "SUCCESS") {
    throw new AppError(
      409,
      "PAYMENT_ALREADY_COMPLETED",
      "A completed payment cannot be cancelled.",
    );
  }

  if (["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status)) {
    return {
      paymentId: payment.id,
      status: payment.status,
    };
  }

  const updated = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      userId,
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    data: {
      status: "CANCELLED",
    },
  });

  if (updated.count !== 1) {
    const current = await prisma.payment.findUnique({
      where: {
        id: payment.id,
      },
    });

    if (!current) {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }

    if (current.status === "SUCCESS") {
      throw new AppError(
        409,
        "PAYMENT_ALREADY_COMPLETED",
        "A completed payment cannot be cancelled.",
      );
    }

    return {
      paymentId: current.id,
      status: current.status,
    };
  }

  return {
    paymentId: payment.id,
    status: "CANCELLED",
  };
}

/**
 * Retrieve a user's payment using the SOMI reference.
 *
 * User scoping prevents IDOR.
 */
export async function getPaymentByReference(
  userId: string,
  somiReference: string,
) {
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      somiReference,
    },
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

/**
 * Retrieve a user's payment by internal payment ID.
 *
 * User scoping prevents IDOR.
 */
export async function getPayment(userId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
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

/**
 * Trusted CinetPay verification event.
 *
 * This type represents a result that has already been obtained
 * from the CinetPay verification layer.
 *
 * The service does not trust arbitrary client-side payment data.
 */
export type CinetPayVerifiedEvent = {
  somiReference: string;
  providerReference: string;
  status: "ACCEPTED" | "REFUSED" | "PENDING";
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  verifiedAt: Date;
};

/**
 * Process a verified CinetPay event.
 *
 * This is the ONLY entry point that converts a verified external
 * payment into a successful SOMI wallet credit.
 *
 * Flow:
 *
 * ACCEPTED
 *   → validate payment
 *   → mark PROCESSING
 *   → atomically settle payment
 *   → credit wallet
 *   → create ledger transaction
 *   → SUCCESS
 *
 * PENDING
 *   → mark PROCESSING
 *   → no wallet credit
 *
 * REFUSED
 *   → mark FAILED
 *   → no wallet credit
 */
export async function handleVerifiedCinetPayEvent(
  event: CinetPayVerifiedEvent,
) {
  if (!event.somiReference.trim()) {
    throw new AppError(
      422,
      "INVALID_PAYMENT_REFERENCE",
      "A SOMI payment reference is required.",
    );
  }

  if (!event.providerReference.trim()) {
    throw new AppError(
      422,
      "INVALID_PROVIDER_REFERENCE",
      "A CinetPay provider reference is required.",
    );
  }

  if (!Number.isFinite(event.amount) || event.amount <= 0) {
    throw new AppError(
      422,
      "INVALID_PAYMENT_AMOUNT",
      "A valid payment amount is required.",
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      somiReference: event.somiReference,
    },
  });

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  }

  if (payment.provider !== "CINETPAY") {
    throw new AppError(
      409,
      "PAYMENT_PROVIDER_MISMATCH",
      "Payment provider mismatch.",
    );
  }

  if (
    Number(payment.amount) !== event.amount ||
    payment.currency !== event.currency
  ) {
    throw new AppError(
      409,
      "PAYMENT_AMOUNT_MISMATCH",
      "Verified payment does not match the SOMI payment.",
    );
  }

  if (
    payment.providerReference &&
    payment.providerReference !== event.providerReference
  ) {
    throw new AppError(
      409,
      "PAYMENT_REFERENCE_MISMATCH",
      "Provider reference mismatch.",
    );
  }

  /**
   * A payment already successfully settled is idempotent.
   *
   * Do not attempt to credit it a second time.
   */
  if (payment.status === "SUCCESS") {
    const existingTransaction = await prisma.walletTransaction.findUnique({
      where: {
        paymentId: payment.id,
      },
    });

    return {
      status: "SUCCESS" as const,
      paymentId: payment.id,
      walletTransactionId: existingTransaction?.id ?? null,
      alreadySettled: true,
    };
  }

  if (["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status)) {
    throw new AppError(
      409,
      "PAYMENT_NOT_SETTLEABLE",
      "This payment cannot be settled.",
    );
  }

  if (event.status === "PENDING") {
    const updated = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      data: {
        status: "PROCESSING",
        providerReference: event.providerReference,
        paymentMethod: event.paymentMethod ?? payment.paymentMethod,
      },
    });

    if (updated.count === 0) {
      const current = await prisma.payment.findUnique({
        where: {
          id: payment.id,
        },
      });

      if (current?.status === "SUCCESS") {
        return {
          status: "SUCCESS" as const,
          paymentId: current.id,
          walletTransactionId:
            (
              await prisma.walletTransaction.findUnique({
                where: {
                  paymentId: current.id,
                },
              })
            )?.id ?? null,
          alreadySettled: true,
        };
      }

      throw new AppError(
        409,
        "PAYMENT_NOT_SETTLEABLE",
        "This payment is no longer pending.",
      );
    }

    return {
      status: "PROCESSING" as const,
      paymentId: payment.id,
    };
  }

  if (event.status === "REFUSED") {
    const updated = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      data: {
        status: "FAILED",
        providerReference: event.providerReference,
        paymentMethod: event.paymentMethod ?? payment.paymentMethod,
        verifiedAt: event.verifiedAt,
      },
    });

    if (updated.count === 0) {
      const current = await prisma.payment.findUnique({
        where: {
          id: payment.id,
        },
      });

      if (current?.status === "SUCCESS") {
        return {
          status: "SUCCESS" as const,
          paymentId: current.id,
          alreadySettled: true,
        };
      }

      if (current) {
        return {
          status: current.status,
          paymentId: current.id,
        };
      }

      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }

    return {
      status: "FAILED" as const,
      paymentId: payment.id,
    };
  }

  /**
   * ACCEPTED
   *
   * Move the payment into PROCESSING before settlement.
   * The actual wallet credit happens only inside
   * settleVerifiedPayment().
   */
  await prisma.payment.updateMany({
    where: {
      id: payment.id,
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    data: {
      status: "PROCESSING",
      providerReference: event.providerReference,
      paymentMethod: event.paymentMethod ?? payment.paymentMethod,
      verifiedAt: event.verifiedAt,
    },
  });

  return settleVerifiedPayment(payment.id);
}

/**
 * Read-only wallet lookup.
 *
 * IMPORTANT:
 * GET /wallet must never create financial state.
 *
 * A user without a wallet receives a zero-balance projection.
 * Wallet creation occurs only during a trusted financial operation.
 */
export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
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
      currency: "SOMI",
    },
  };
}

/**
 * Retrieve paginated payment history for the authenticated user.
 */
export async function getPaymentHistory(
  userId: string,
  limit: number,
  offset: number,
) {
  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        packageId: true,
        amount: true,
        currency: true,
        amountCfa: true,
        coins: true,
        somiReference: true,
        providerReference: true,
        provider: true,
        paymentMethod: true,
        status: true,
        verifiedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.payment.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    payments: payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      expiresAt: payment.expiresAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    })),
    total,
    limit,
    offset,
  };
}

/**
 * Retrieve the authenticated user's wallet ledger.
 */
export async function getTransactions(
  userId: string,
  limit: number,
  offset: number,
) {
  const transactions = await prisma.walletTransaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
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

/**
 * Check whether a user has access to a chapter.
 */
export async function getChapterEntitlement(
  userId: string,
  bookId: string,
  chapterId: string,
) {
  const chapter = await prisma.chapter.findUnique({
    where: {
      id: chapterId,
    },
    select: {
      bookId: true,
      status: true,
      accessType: true,
      book: {
        select: {
          status: true,
        },
      },
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
    return {
      entitled: true,
      access: "FREE",
    };
  }

  const entitlement = await prisma.chapterEntitlement.findUnique({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
      },
    },
  });

  return {
    entitled: Boolean(entitlement),
    access: entitlement ? "UNLOCKED" : "LOCKED",
  };
}

/**
 * Unlock a premium chapter using the user's existing SOMI balance.
 *
 * IMPORTANT:
 * The client does NOT provide or control the chapter price.
 * The server always reads the persisted chapter.price.
 *
 * Flow:
 *   1. Validate the chapter.
 *   2. Validate that it is premium.
 *   3. Detect an existing entitlement.
 *   4. Read the wallet.
 *   5. Verify sufficient balance.
 *   6. Atomically decrement the wallet.
 *   7. Create the CHAPTER_UNLOCK ledger entry.
 *   8. Create the entitlement.
 *   9. Attribute writer earnings after the transaction succeeds.
 *
 * Serializable isolation + retry protects against concurrent
 * duplicate unlock requests.
 */
export async function unlockChapter(
  userId: string,
  bookId: string,
  chapterId: string,
  attempt = 0,
): Promise<{
  entitled: boolean;
  alreadyUnlocked: boolean;
  balance: number;
  transactionId?: string;
}> {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const chapter = await tx.chapter.findUnique({
          where: {
            id: chapterId,
          },
          select: {
            bookId: true,
            status: true,
            accessType: true,
            price: true,
            book: {
              select: {
                status: true,
              },
            },
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
          where: {
            userId_chapterId: {
              userId,
              chapterId,
            },
          },
        });

        if (existing) {
          const wallet = await tx.wallet.findUnique({
            where: {
              userId,
            },
          });

          return {
            entitled: true,
            alreadyUnlocked: true,
            balance: wallet?.balance ?? 0,
          };
        }

        const wallet = await tx.wallet.findUnique({
          where: {
            userId,
          },
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
            balance: {
              gte: chapter.price,
            },
          },
          data: {
            balance: {
              decrement: chapter.price,
            },
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
        where: {
          userId_chapterId: {
            userId,
            chapterId,
          },
        },
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

/**
 * Atomically settle a verified payment.
 *
 * This function is deliberately separate from payment intent creation.
 *
 * A payment becomes SUCCESS and credits coins only here.
 *
 * Transaction:
 *   Payment claim
 *       ↓
 *   Wallet upsert
 *       ↓
 *   Wallet increment
 *       ↓
 *   WalletTransaction creation
 *
 * All operations happen inside the same serializable transaction.
 *
 * The paymentId unique constraint on WalletTransaction provides
 * an additional idempotency boundary.
 */
export async function settleVerifiedPayment(paymentId: string, attempt = 0) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

        if (!payment) {
          throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
        }

        if (
          payment.status === "FAILED" ||
          payment.status === "CANCELLED" ||
          payment.status === "EXPIRED"
        ) {
          throw new AppError(
            409,
            "PAYMENT_NOT_SETTLEABLE",
            "This payment cannot be settled.",
          );
        }

        /**
         * Claim the payment.
         *
         * Only PENDING/PROCESSING payments can be claimed.
         * This prevents duplicate settlement from creating
         * duplicate wallet credits.
         */
        const claim = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: {
              in: ["PENDING", "PROCESSING"],
            },
          },
          data: {
            status: "SUCCESS",
          },
        });

        if (claim.count === 0) {
          const settled = await tx.payment.findUnique({
            where: {
              id: payment.id,
            },
          });

          if (settled?.status === "SUCCESS") {
            const existing = await tx.walletTransaction.findUnique({
              where: {
                paymentId: payment.id,
              },
            });

            return {
              paymentId: payment.id,
              walletTransactionId: existing?.id ?? null,
              balance: null,
              coins: payment.coins,
              status: "SUCCESS" as const,
              alreadySettled: true,
            };
          }

          throw new AppError(
            409,
            "PAYMENT_NOT_SETTLEABLE",
            "This payment is not ready for settlement.",
          );
        }

        const wallet = await tx.wallet.upsert({
          where: {
            userId: payment.userId,
          },
          create: {
            userId: payment.userId,
          },
          update: {},
        });

        const updatedWallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },
          data: {
            balance: {
              increment: payment.coins,
            },
          },
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
          status: "SUCCESS" as const,
          alreadySettled: false,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    /**
     * Serializable transactions can legitimately fail with
     * P2034 under concurrent payment callbacks.
     *
     * Retry a bounded number of times rather than recursively
     * retrying forever.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034" &&
      attempt < 3
    ) {
      return settleVerifiedPayment(paymentId, attempt + 1);
    }

    throw error;
  }
}

function isPrismaConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2034")
  );
}
