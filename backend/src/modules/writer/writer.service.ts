import { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
import type { AuthPrincipal } from "../auth/auth.types.js";
import {
  calculateWriterPayout,
  MINIMUM_WRITER_WITHDRAWAL_COINS,
  isSupportedWriterCurrency,
  type WriterPayoutMethod,
  type WriterCurrency,
} from "./writer.finance.js";

export const WRITER_SHARE_PERCENTAGE = 65;

export function calculateWriterEarningCoins(coinsSpent: number) {
  if (!Number.isInteger(coinsSpent) || coinsSpent < 0) {
    throw new Error("coinsSpent must be a non-negative integer.");
  }

  return Math.floor((coinsSpent * WRITER_SHARE_PERCENTAGE) / 100);
}

const languages = ["en", "fr"] as const;

type LanguageCode = (typeof languages)[number];

const assertWriter = (viewer: AuthPrincipal | undefined) => {
  if (!viewer) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  if (!["WRITER", "ADMIN"].includes(viewer.role.toUpperCase())) {
    throw new AppError(403, "FORBIDDEN", "Writer permission is required.");
  }

  return viewer;
};

const serializeContent = (content: string | Record<string, unknown>) =>
  typeof content === "string" ? content : JSON.stringify(content);

async function ownedBook(writer: AuthPrincipal | undefined, bookId: string) {
  const viewer = assertWriter(writer);

  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
  }

  if (viewer.role.toUpperCase() !== "ADMIN" && book.authorId !== viewer.id) {
    throw new AppError(403, "FORBIDDEN", "You do not own this book.");
  }

  return book;
}

async function ownedChapter(
  writer: AuthPrincipal | undefined,
  bookId: string,
  chapterId: string,
) {
  const book = await ownedBook(writer, bookId);

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter || chapter.bookId !== book.id) {
    throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
  }

  return {
    book,
    chapter,
  };
}

const mapLocalization = (localization: {
  id: string;
  bookId: string;
  languageCode: string;
  title: string;
  description: string | null;
  status: string;
  sourceVersion: number;
  contentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...localization,
  createdAt: localization.createdAt.toISOString(),
  updatedAt: localization.updatedAt.toISOString(),
});

export async function getWriterProfile(writer: AuthPrincipal | undefined) {
  const viewer = assertWriter(writer);

  const profile = await prisma.writerProfile.findUnique({
    where: {
      userId: viewer.id,
    },
  });

  return profile;
}

export async function saveWriterProfile(
  writer: AuthPrincipal | undefined,
  input: {
    displayName?: string | null;
    penName?: string | null;
    bio?: string | null;
    avatar?: string | null;
    banner?: string | null;
    preferredCurrency?: "XAF" | "USD" | "EUR" | "CAD";
    payoutMethod?: "ORANGE_MONEY" | "MTN_MOBILE_MONEY" | "PAYPAL" | null;
    payoutAccount?: string | null;
    payoutAccountName?: string | null;
  },
) {
  const viewer = assertWriter(writer);

  return prisma.writerProfile.upsert({
    where: {
      userId: viewer.id,
    },
    create: {
      userId: viewer.id,
      ...input,
    },
    update: input,
  });
}

export async function getBookLocalizations(
  writer: AuthPrincipal | undefined,
  bookId: string,
) {
  await ownedBook(writer, bookId);

  const records = await prisma.bookLocalization.findMany({
    where: { bookId },
    orderBy: {
      languageCode: "asc",
    },
  });

  return records.map(mapLocalization);
}

/**
 * Save editable book-localization data.
 *
 * IMPORTANT:
 * This function intentionally does NOT accept or mutate status.
 *
 * Any existing READY_FOR_SUBMISSION state is invalidated when the
 * localization is edited because the content has changed.
 */
export async function saveBookLocalization(
  writer: AuthPrincipal | undefined,
  bookId: string,
  input: {
    languageCode: LanguageCode;
    title: string;
    description?: string | null;
  },
) {
  await ownedBook(writer, bookId);

  const record = await prisma.bookLocalization.upsert({
    where: {
      bookId_languageCode: {
        bookId,
        languageCode: input.languageCode,
      },
    },

    create: {
      bookId,
      languageCode: input.languageCode,
      title: input.title,
      description: input.description ?? null,
      status: "NEEDS_PROOFREADING",
    },

    update: {
      title: input.title,
      description: input.description ?? null,

      /*
       * Any edit makes the localization require
       * proofreading again.
       */
      status: "NEEDS_PROOFREADING",

      sourceVersion: {
        increment: input.languageCode === "en" ? 1 : 0,
      },
    },
  });

  return mapLocalization(record);
}

/**
 * Explicit lifecycle transition:
 *
 * NEEDS_PROOFREADING -> READY_FOR_SUBMISSION
 *
 * A client cannot manufacture this state through PATCH.
 */
export async function markBookLocalizationReady(
  writer: AuthPrincipal | undefined,
  bookId: string,
  languageCode: LanguageCode,
) {
  await ownedBook(writer, bookId);

  const localization = await prisma.bookLocalization.findUnique({
    where: {
      bookId_languageCode: {
        bookId,
        languageCode,
      },
    },
  });

  if (!localization) {
    throw new AppError(
      422,
      "LOCALIZATION_INCOMPLETE",
      "Book localization must be saved before review.",
    );
  }

  if (!localization.title.trim()) {
    throw new AppError(
      422,
      "LOCALIZATION_INCOMPLETE",
      "Book localization title is required.",
    );
  }

  const updated = await prisma.bookLocalization.update({
    where: {
      bookId_languageCode: {
        bookId,
        languageCode,
      },
    },
    data: {
      status: "READY_FOR_SUBMISSION",
    },
  });

  return mapLocalization(updated);
}

export async function autosaveChapter(
  writer: AuthPrincipal | undefined,
  bookId: string,
  chapterId: string,
  input: {
    languageCode: LanguageCode;
    title: string;
    content: string | Record<string, unknown>;
    contentFormat: string;
    clientVersion: number;
  },
) {
  const { chapter } = await ownedChapter(writer, bookId, chapterId);

  const content = serializeContent(input.content);

  if (input.languageCode === "en") {
    if (chapter.contentVersion !== input.clientVersion) {
      throw new AppError(
        409,
        "AUTOSAVE_CONFLICT",
        "This chapter changed elsewhere.",
        [
          {
            serverVersion: chapter.contentVersion,
          },
        ],
      );
    }

    const updated = await prisma.chapter.updateMany({
      where: {
        id: chapterId,
        contentVersion: input.clientVersion,
      },
      data: {
        title: input.title,
        content,
        contentVersion: {
          increment: 1,
        },
        status: "DRAFT",
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      },
    });

    if (updated.count !== 1) {
      throw new AppError(
        409,
        "AUTOSAVE_CONFLICT",
        "This chapter changed elsewhere.",
      );
    }

    return prisma.chapter.findUniqueOrThrow({
      where: {
        id: chapterId,
      },
    });
  }

  const localization = await prisma.chapterLocalization.findUnique({
    where: {
      chapterId_languageCode: {
        chapterId,
        languageCode: input.languageCode,
      },
    },
  });

  const version = localization?.contentVersion ?? 0;

  if (version !== input.clientVersion) {
    throw new AppError(
      409,
      "AUTOSAVE_CONFLICT",
      "This translation changed elsewhere.",
      [
        {
          serverVersion: version,
        },
      ],
    );
  }

  return prisma.chapterLocalization.upsert({
    where: {
      chapterId_languageCode: {
        chapterId,
        languageCode: input.languageCode,
      },
    },

    create: {
      chapterId,
      languageCode: input.languageCode,
      title: input.title,
      content,
      contentFormat: input.contentFormat,
      status: "NEEDS_PROOFREADING",
      contentVersion: 1,
      sourceVersion: chapter.contentVersion,
    },

    update: {
      title: input.title,
      content,
      contentFormat: input.contentFormat,

      /*
       * Editing translated content invalidates
       * its previous proofreading state.
       */
      status: "NEEDS_PROOFREADING",

      contentVersion: {
        increment: 1,
      },
    },
  });
}

export async function requestTranslation(
  writer: AuthPrincipal | undefined,
  bookId: string,
  _input: {
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    includeMetadata: boolean;
    includeChapters: boolean;
  },
) {
  await ownedBook(writer, bookId);

  throw new AppError(
    501,
    "TRANSLATION_NOT_CONFIGURED",
    "No translation provider is configured.",
  );
}

export async function markChapterLocalizationReady(
  writer: AuthPrincipal | undefined,
  bookId: string,
  chapterId: string,
  languageCode: LanguageCode,
) {
  await ownedChapter(writer, bookId, chapterId);

  const localization = await prisma.chapterLocalization.updateMany({
    where: {
      chapterId,
      languageCode,
    },
    data: {
      status: "READY_FOR_SUBMISSION",
    },
  });

  if (localization.count !== 1) {
    throw new AppError(
      422,
      "LOCALIZATION_INCOMPLETE",
      "Translated chapter content must be saved before review.",
    );
  }

  return prisma.chapterLocalization.findUniqueOrThrow({
    where: {
      chapterId_languageCode: {
        chapterId,
        languageCode,
      },
    },
  });
}

export async function submitBook(
  writer: AuthPrincipal | undefined,
  bookId: string,
) {
  const book = await ownedBook(writer, bookId);

  /*
   * A Writer submission may only originate from DRAFT.
   *
   * Once submitBook() runs, the book becomes SUBMITTED.
   * A published book cannot be submitted again through this route.
   */
  if (book.status !== "DRAFT") {
    throw new AppError(
      409,
      "INVALID_STATE_TRANSITION",
      `Book cannot be submitted from state ${book.status}.`,
    );
  }

  const [localizations, chapters] = await Promise.all([
    prisma.bookLocalization.findMany({
      where: { bookId },
    }),

    prisma.chapter.findMany({
      where: { bookId },
      orderBy: {
        number: "asc",
      },
    }),
  ]);

  const byLanguage = new Map(
    localizations.map((entry) => [entry.languageCode, entry]),
  );

  for (const languageCode of languages) {
    const localization = byLanguage.get(languageCode);

    if (!localization || localization.status !== "READY_FOR_SUBMISSION") {
      throw new AppError(
        422,
        "LOCALIZATION_INCOMPLETE",
        `${languageCode} book localization is not ready.`,
      );
    }
  }

  if (
    chapters.length === 0 ||
    chapters.some((chapter) => !chapter.content.trim())
  ) {
    throw new AppError(
      422,
      "SUBMISSION_INVALID",
      "Every book must contain non-empty chapters.",
    );
  }

  const translatedChapters = await prisma.chapterLocalization.findMany({
    where: {
      chapterId: {
        in: chapters.map((chapter) => chapter.id),
      },
      languageCode: "fr",
    },
  });

  if (
    translatedChapters.length !== chapters.length ||
    translatedChapters.some(
      (chapter) => chapter.status !== "READY_FOR_SUBMISSION",
    )
  ) {
    throw new AppError(
      422,
      "LOCALIZATION_INCOMPLETE",
      "Every chapter must have a reviewed French localization.",
    );
  }

  const active = await prisma.writerSubmission.findFirst({
    where: {
      bookId,
      status: {
        in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"],
      },
    },
  });

  if (active) {
    throw new AppError(
      409,
      "SUBMISSION_ALREADY_ACTIVE",
      "This book already has an active submission.",
    );
  }

  const submission = await prisma.writerSubmission.create({
    data: {
      writerId: book.authorId,
      bookId,
      status: "SUBMITTED",
    },
  });

  await prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      status: "SUBMITTED",
    },
  });

  return submission;
}

export async function getWriterSubmissions(writer: AuthPrincipal | undefined) {
  const viewer = assertWriter(writer);

  return prisma.writerSubmission.findMany({
    where: {
      writerId: viewer.id,
    },
    orderBy: {
      submittedAt: "desc",
    },
    select: {
      id: true,
      bookId: true,
      chapterId: true,
      languageCode: true,
      status: true,
      rejectionReason: true,
      submittedAt: true,
      reviewedAt: true,
    },
  });
}

export async function getWriterEarnings(writer: AuthPrincipal | undefined) {
  const viewer = assertWriter(writer);

  const [aggregate, pending] = await Promise.all([
    prisma.writerEarning.aggregate({
      where: {
        writerId: viewer.id,
      },
      _sum: {
        coins: true,
      },
    }),

    prisma.writerEarning.aggregate({
      where: {
        writerId: viewer.id,
        status: "PENDING",
      },
      _sum: {
        coins: true,
      },
    }),
  ]);

  return {
    totalCoins: aggregate._sum.coins ?? 0,

    pendingCoins: pending._sum.coins ?? 0,

    availableCoins: (aggregate._sum.coins ?? 0) - (pending._sum.coins ?? 0),
  };
}

export async function getWriterEarningTransactions(
  writer: AuthPrincipal | undefined,
) {
  const viewer = assertWriter(writer);

  return prisma.writerEarning.findMany({
    where: {
      writerId: viewer.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      bookId: true,
      chapterId: true,
      sourceTransactionId: true,
      coins: true,
      status: true,
      createdAt: true,
    },
  });
}


const serializeWithdrawal = (withdrawal: {
  id: string;
  writerId: string;
  status: string;
  coins: number;
  amountCfa: Prisma.Decimal;
  currency: string;
  exchangeRateCfa: Prisma.Decimal;
  amount: Prisma.Decimal;
  payoutMethod: string;
  payoutAccount: string;
  payoutAccountName: string | null;
  failureCount: number;
  failureMessage: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: withdrawal.id,
  writerId: withdrawal.writerId,
  status: withdrawal.status,
  coins: withdrawal.coins,
  amountCfa: Number(withdrawal.amountCfa),
  currency: withdrawal.currency,
  exchangeRateCfa: Number(withdrawal.exchangeRateCfa),
  amount: Number(withdrawal.amount),
  payoutMethod: withdrawal.payoutMethod,
  payoutAccount: withdrawal.payoutAccount,
  payoutAccountName: withdrawal.payoutAccountName,
  failureCount: withdrawal.failureCount,
  failureMessage: withdrawal.failureMessage,
  reviewedBy: withdrawal.reviewedBy,
  reviewedAt: withdrawal.reviewedAt?.toISOString() ?? null,
  processedAt: withdrawal.processedAt?.toISOString() ?? null,
  createdAt: withdrawal.createdAt.toISOString(),
  updatedAt: withdrawal.updatedAt.toISOString(),
});

async function getWriterWithdrawalAvailableCoins(writerId: string) {
  const [earnings, withdrawals] = await Promise.all([
    prisma.writerEarning.aggregate({
      where: {
        writerId,
        },
      _sum: { coins: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: {
        writerId,
        status: {
          in: ["PENDING", "PROCESSING", "COMPLETED"],
        },
      },
      _sum: { coins: true },
    }),
  ]);

  return Math.max(
    0,
    (earnings._sum.coins ?? 0) - (withdrawals._sum.coins ?? 0),
  );
}

export async function getWriterWithdrawalSummary(
  writer: AuthPrincipal | undefined,
) {
  const viewer = assertWriter(writer);
  const availableCoins = await getWriterWithdrawalAvailableCoins(viewer.id);

  return {
    availableCoins,
    minimumCoins: MINIMUM_WRITER_WITHDRAWAL_COINS,
    eligible: availableCoins >= MINIMUM_WRITER_WITHDRAWAL_COINS,
  };
}

export async function getWriterWithdrawals(
  writer: AuthPrincipal | undefined,
) {
  const viewer = assertWriter(writer);

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      writerId: viewer.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return withdrawals.map(serializeWithdrawal);
}


export async function getWriterSupportTickets(writer: AuthPrincipal | undefined) {
  const viewer = assertWriter(writer);
  return prisma.supportTicket.findMany({
    where: { userId: viewer.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function createWriterSupportTicket(
  writer: AuthPrincipal | undefined,
  input: {
    category: string;
    subject: string;
    body: string;
    withdrawalId?: string;
  },
) {
  const viewer = assertWriter(writer);
  const category = input.category.trim().toUpperCase();
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!category || !subject || !body) {
    throw new AppError(400, "SUPPORT_TICKET_INVALID", "Category, subject and message are required.");
  }

  if (input.withdrawalId) {
    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: { id: input.withdrawalId, writerId: viewer.id },
      select: { id: true },
    });
    if (!withdrawal) {
      throw new AppError(404, "WITHDRAWAL_NOT_FOUND", "Withdrawal request not found.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: viewer.id,
        category,
        subject,
        relatedWithdrawalId: input.withdrawalId ?? null,
        messages: {
          create: {
            senderId: viewer.id,
            body,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, senderId: true, body: true, createdAt: true },
        },
      },
    });
    return ticket;
  });
}

export async function requestWriterWithdrawal(
  writer: AuthPrincipal | undefined,
  input: {
    coins: number;
  },
) {
  const viewer = assertWriter(writer);

  if (!Number.isInteger(input.coins) || input.coins < MINIMUM_WRITER_WITHDRAWAL_COINS) {
    throw new AppError(
      422,
      "WITHDRAWAL_BELOW_MINIMUM",
      `A withdrawal requires at least ${MINIMUM_WRITER_WITHDRAWAL_COINS} coins.`,
    );
  }

  const profile = await prisma.writerProfile.findUnique({
    where: { userId: viewer.id },
    select: {
      preferredCurrency: true,
      payoutMethod: true,
      payoutAccount: true,
      payoutAccountName: true,
    },
  });

  if (!profile) {
    throw new AppError(
      422,
      "PAYOUT_PROFILE_REQUIRED",
      "Complete your payout profile before requesting a withdrawal.",
    );
  }

  if (!isSupportedWriterCurrency(profile.preferredCurrency)) {
    throw new AppError(
      422,
      "INVALID_PAYOUT_CURRENCY",
      "The configured payout currency is not supported.",
    );
  }

  if (!profile.payoutMethod || !profile.payoutAccount) {
    throw new AppError(
      422,
      "PAYOUT_PROFILE_REQUIRED",
      "A payout method and payout account are required.",
    );
  }

  const payoutMethods: readonly string[] = [
    "ORANGE_MONEY",
    "MTN_MOBILE_MONEY",
    "PAYPAL",
  ];
  if (!payoutMethods.includes(profile.payoutMethod)) {
    throw new AppError(
      422,
      "INVALID_PAYOUT_METHOD",
      "The configured payout method is not supported.",
    );
  }

  const kyc = await prisma.writerKyc.findUnique({
    where: { writerId: viewer.id },
    select: { status: true },
  });

  if (!kyc || kyc.status !== "APPROVED") {
    throw new AppError(
      409,
      "KYC_NOT_APPROVED",
      "KYC approval is required before requesting a withdrawal.",
    );
  }

  const payout = calculateWriterPayout(
    input.coins,
    profile.preferredCurrency as WriterCurrency,
  );

  try {
    const withdrawal = await prisma.$transaction(
      async (tx) => {
        const [earnings, reserved] = await Promise.all([
          tx.writerEarning.aggregate({
            where: {
              writerId: viewer.id,
              },
            _sum: { coins: true },
          }),
          tx.withdrawalRequest.aggregate({
            where: {
              writerId: viewer.id,
              status: {
                in: ["PENDING", "PROCESSING", "COMPLETED"],
              },
            },
            _sum: { coins: true },
          }),
        ]);

        const availableCoins = Math.max(
          0,
          (earnings._sum.coins ?? 0) - (reserved._sum.coins ?? 0),
        );

        if (input.coins > availableCoins) {
          throw new AppError(
            409,
            "INSUFFICIENT_AVAILABLE_EARNINGS",
            "The requested withdrawal exceeds your available earnings.",
            [{ availableCoins }],
          );
        }

        return tx.withdrawalRequest.create({
          data: {
            writerId: viewer.id,
            status: "PENDING",
            coins: input.coins,
            amountCfa: payout.amountCfa.toFixed(6),
            currency: payout.currency,
            exchangeRateCfa: payout.exchangeRateCfa.toFixed(6),
            amount: payout.amount.toFixed(6),
            payoutMethod: profile.payoutMethod as WriterPayoutMethod,
            payoutAccount: profile.payoutAccount,
            payoutAccountName: profile.payoutAccountName ?? null,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return serializeWithdrawal(withdrawal);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      throw new AppError(
        409,
        "WITHDRAWAL_CONFLICT",
        "Another withdrawal operation is being processed. Please try again.",
      );
    }
    throw error;
  }
}

export async function attributeWriterEarning(sourceTransactionId: string) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.findFirst({
      where: {
        OR: [
          {
            id: sourceTransactionId,
          },
          {
            reference: sourceTransactionId,
          },
        ],
      },
    });

    if (
      !transaction ||
      transaction.type !== "CHAPTER_UNLOCK" ||
      transaction.status !== "COMPLETED"
    ) {
      return null;
    }

    const reference = transaction.reference?.match(/^chapter:([^:]+):([^:]+)$/);

    const bookId = reference?.[1] ?? null;

    const chapterId = reference?.[2] ?? null;

    if (!bookId || !chapterId) {
      return null;
    }

    const chapter = await tx.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        bookId: true,
        book: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!chapter || chapter.bookId !== bookId) {
      return null;
    }

    return tx.writerEarning.upsert({
      where: {
        sourceTransactionId,
      },

      create: {
        sourceTransactionId,
        writerId: chapter.book.authorId,
        bookId,
        chapterId,
        coins: calculateWriterEarningCoins(Math.abs(transaction.coins)),
        status: "PENDING",
      },

      update: {},
    });
  });
}
