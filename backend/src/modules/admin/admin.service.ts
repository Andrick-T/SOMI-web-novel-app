import type { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
import { getBookDetail } from "../content/content.service.js";
import { mapBookSummary, mapUserSummary } from "./admin.mapper.js";
import type {
  AdminAuditEvent,
  AdminAuditResponse,
  AdminBookSummary,
  AdminBooksResponse,
  AdminDashboardSummary,
  AdminEconomySummary,
  AdminPlatformSettings,
  AdminTransactionSummary,
  AdminTransactionsResponse,
  AdminUserSummary,
  AdminUsersResponse,
  AdminWritersResponse,
  DashboardIssue,
} from "./admin.types.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const clampPage = (page: number) => Math.max(1, page);
const clampLimit = (limit: number) => Math.min(100, Math.max(1, limit));

const formatRelativeTime = (date: Date, now: Date) => {
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.round(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) {
    return `${Math.round(diffMs / 3_600_000)}h ago`;
  }

  return `${Math.round(diffMs / DAY_MS)}d ago`;
};

/**
 * Maps Prisma JSON metadata into a safe object for the admin API.
 *
 * Audit metadata must never expose secrets or authentication material.
 * Individual audit writers are responsible for only storing safe data.
 */
const mapAuditMetadata = (
  metadata: Prisma.JsonValue | null,
): Record<string, unknown> | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return metadata as Record<string, unknown>;
};

async function getAdminEconomyStats(): Promise<AdminEconomySummary> {
  const [
    totalCoinPurchases,
    totalCoinsSpent,
    revenue,
    refunds,
    failedPayments,
    pendingTransactions,
    totalWalletBalance,
    totalWriterEarnings,
  ] = await Promise.all([
    prisma.walletTransaction
      .aggregate({
        where: {
          type: "COIN_PURCHASE",
          status: "COMPLETED",
        },
        _sum: {
          coins: true,
        },
      })
      .then((result) => Number(result._sum.coins ?? 0)),

    prisma.walletTransaction
      .aggregate({
        where: {
          coins: {
            lt: 0,
          },
          status: "COMPLETED",
        },
        _sum: {
          coins: true,
        },
      })
      .then((result) => Math.abs(Number(result._sum.coins ?? 0))),

    prisma.walletTransaction
      .aggregate({
        where: {
          type: "COIN_PURCHASE",
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      })
      .then((result) => Number(result._sum.amount ?? 0)),

    prisma.walletTransaction
      .aggregate({
        where: {
          type: "REFUND",
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      })
      .then((result) => Number(result._sum.amount ?? 0)),

    prisma.walletTransaction.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.walletTransaction.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.wallet
      .aggregate({
        _sum: {
          balance: true,
        },
      })
      .then((result) => Number(result._sum.balance ?? 0)),

    prisma.writerEarning
      .aggregate({
        _sum: {
          coins: true,
        },
      })
      .then((result) => Number(result._sum.coins ?? 0)),
  ]);

  return {
    totalCoinPurchases,
    totalCoinsSpent,
    revenue,
    refunds,
    failedPayments,
    pendingTransactions,
    totalWalletBalance,
    totalWriterEarnings,
  };
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfWeek = new Date(now.getTime() - 7 * DAY_MS);

  const economy = await getAdminEconomyStats();

  const [
    totalUsers,
    activeUsers,
    newUsers,
    totalWriters,
    books,
    publishedBooks,
    pendingReviews,
    reportedContent,
    activeReaders,
    activeWriters,
    pendingModeration,
    transactionsToday,
    revenueToday,
    failedTransactions,
    booksPublishedThisWeek,
    chaptersPublishedThisWeek,
    pendingSubmissions,
    rejectedContent,
    suspendedUsers,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * DAY_MS),
        },
      },
    }),

    prisma.user.count({
      where: {
        role: "WRITER",
      },
    }),

    prisma.book.count(),

    prisma.book.count({
      where: {
        status: "PUBLISHED",
      },
    }),

    prisma.writerSubmission.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
      },
    }),

    0,

    prisma.user.count({
      where: {
        role: "READER",
        status: "ACTIVE",
      },
    }),

    prisma.user.count({
      where: {
        role: "WRITER",
        status: "ACTIVE",
      },
    }),

    prisma.writerSubmission.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
      },
    }),

    prisma.walletTransaction.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    }),

    prisma.walletTransaction
      .aggregate({
        where: {
          type: "COIN_PURCHASE",
          status: "COMPLETED",
          createdAt: {
            gte: startOfToday,
          },
        },
        _sum: {
          amount: true,
        },
      })
      .then((result) => Number(result._sum.amount ?? 0)),

    prisma.walletTransaction.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.book.count({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          gte: startOfWeek,
        },
      },
    }),

    prisma.chapter.count({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          gte: startOfWeek,
        },
      },
    }),

    prisma.writerSubmission.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
      },
    }),

    prisma.book.count({
      where: {
        status: "REJECTED",
      },
    }),

    prisma.user.count({
      where: {
        status: "SUSPENDED",
      },
    }),

    prisma.auditEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
      },
    }),
  ]);

  const needsAttention: DashboardIssue[] = [
    {
      id: "pending-reviews",
      label: "Books awaiting review",
      count: pendingReviews,
      severity: pendingReviews > 0 ? "high" : "low",
      path: "/admin/content",
    },
    {
      id: "failed-transactions",
      label: "Failed transactions",
      count: failedTransactions,
      severity: failedTransactions > 0 ? "medium" : "low",
      path: "/admin/economy",
    },
    {
      id: "suspended-users",
      label: "Users needing attention",
      count: suspendedUsers,
      severity: suspendedUsers > 0 ? "medium" : "low",
      path: "/admin/users",
    },
    {
      id: "pending-submissions",
      label: "Pending submissions",
      count: pendingSubmissions,
      severity: pendingSubmissions > 0 ? "high" : "low",
      path: "/admin/content",
    },
  ];

  const activity = recentAudit.map((event) => ({
    id: event.id,
    text: `${event.action
      .replace(/_/g, " ")
      .toLowerCase()} on ${event.targetType.toLowerCase()}`,
    time: formatRelativeTime(event.createdAt, now),
    type: event.targetType.toLowerCase(),
  }));

  return {
    totalUsers,
    activeUsers,
    newUsers,
    totalWriters,
    books,
    publishedBooks,
    pendingReviews,
    reportedContent,
    revenue: economy.revenue,
    coinsPurchased: economy.totalCoinPurchases,
    coinsSpent: economy.totalCoinsSpent,
    pendingTransactions: economy.pendingTransactions,
    activeReaders,
    activeWriters,
    pendingModeration,
    transactionsToday,
    revenueToday,
    needsAttention,
    activity,
    contentHealth: {
      booksPublishedThisWeek,
      chaptersPublishedThisWeek,
      pendingSubmissions,
      rejectedContent,
    },
    economyHealth: {
      coinsPurchased: economy.totalCoinPurchases,
      coinsSpent: economy.totalCoinsSpent,
      revenue: economy.revenue,
      refunds: economy.refunds,
      failedTransactions,
    },
  };
}

export async function getAdminWriters(args: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminWritersResponse> {
  const page = clampPage(args.page ?? 1);
  const limit = clampLimit(args.limit ?? 20);
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: "WRITER",

    ...(args.search
      ? {
          OR: [
            {
              email: {
                contains: args.search,
              },
            },
            {
              username: {
                contains: args.search,
              },
            },
            {
              profile: {
                displayName: {
                  contains: args.search,
                },
              },
            },
          ],
        }
      : {}),

    ...(args.status && args.status !== "ALL"
      ? {
          status: args.status,
        }
      : {}),
  };

  const [writers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            displayName: true,
            avatar: true,
          },
        },
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  const items = await Promise.all(
    writers.map(async (writer) => {
      const [
        totalBooks,
        publishedBooks,
        submittedBooks,
        pendingSubmissions,
        publishedChapters,
        totalEarnings,
      ] = await Promise.all([
        prisma.book.count({
          where: {
            authorId: writer.id,
          },
        }),

        prisma.book.count({
          where: {
            authorId: writer.id,
            status: "PUBLISHED",
          },
        }),

        prisma.writerSubmission.count({
          where: {
            writerId: writer.id,
            status: "SUBMITTED",
          },
        }),

        prisma.writerSubmission.count({
          where: {
            writerId: writer.id,
            status: {
              in: ["SUBMITTED", "UNDER_REVIEW"],
            },
          },
        }),

        prisma.chapter.count({
          where: {
            status: "PUBLISHED",
            book: {
              authorId: writer.id,
            },
          },
        }),

        prisma.writerEarning
          .aggregate({
            where: {
              writerId: writer.id,
            },
            _sum: {
              coins: true,
            },
          })
          .then((result) => Number(result._sum.coins ?? 0)),
      ]);

      return {
        id: writer.id,
        name:
          writer.profile?.displayName ??
          writer.username ??
          writer.email.split("@")[0],
        email: writer.email,
        status: writer.status,
        joinedAt: writer.createdAt.toISOString(),
        lastActiveAt: (writer.lastLoginAt ?? writer.createdAt).toISOString(),
        totalBooks,
        publishedBooks,
        submittedBooks,
        pendingSubmissions,
        publishedChapters,
        totalEarnings,
        avatar: writer.profile?.avatar ?? null,
      };
    }),
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getAdminEconomySummary(): Promise<AdminEconomySummary> {
  return getAdminEconomyStats();
}

export async function getAdminTransactions(args: {
  search?: string;
  type?: string;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminTransactionsResponse> {
  const page = clampPage(args.page ?? 1);
  const limit = clampLimit(args.limit ?? 20);
  const skip = (page - 1) * limit;

  const where: Prisma.WalletTransactionWhereInput = {
    ...(args.type && args.type !== "ALL"
      ? {
          type: args.type,
        }
      : {}),

    ...(args.status && args.status !== "ALL"
      ? {
          status: args.status,
        }
      : {}),

    ...(args.userId
      ? {
          userId: args.userId,
        }
      : {}),

    ...(args.search
      ? {
          OR: [
            {
              id: {
                contains: args.search,
              },
            },
            {
              reference: {
                contains: args.search,
              },
            },
            {
              type: {
                contains: args.search,
              },
            },
            {
              status: {
                contains: args.search,
              },
            },
            {
              user: {
                username: {
                  contains: args.search,
                },
              },
            },
            {
              user: {
                email: {
                  contains: args.search,
                },
              },
            },
            {
              user: {
                profile: {
                  displayName: {
                    contains: args.search,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    }),

    prisma.walletTransaction.count({
      where,
    }),
  ]);

  const items: AdminTransactionSummary[] = transactions.map((transaction) => {
    const displayName =
      transaction.user.profile?.displayName ??
      transaction.user.username ??
      transaction.user.email.split("@")[0];

    return {
      id: transaction.id,
      userId: transaction.userId,
      user: displayName,
      type: transaction.type,
      amount: transaction.amount,
      currency: "SOMI",
      coins: transaction.coins,
      status: transaction.status,
      timestamp: transaction.createdAt.toISOString(),
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getAdminUsers(args: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const page = clampPage(args.page ?? 1);
  const limit = clampLimit(args.limit ?? 20);
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    ...(args.search
      ? {
          OR: [
            {
              email: {
                contains: args.search,
              },
            },
            {
              username: {
                contains: args.search,
              },
            },
            {
              profile: {
                displayName: {
                  contains: args.search,
                },
              },
            },
          ],
        }
      : {}),

    ...(args.role && args.role !== "ALL"
      ? {
          role: args.role,
        }
      : {}),

    ...(args.status && args.status !== "ALL"
      ? {
          status: args.status,
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            books: true,
            libraryItems: true,
            readings: true,
            transactions: true,
          },
        },
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  const items = await Promise.all(
    users.map(async (user) => {
      const booksPublished = await prisma.book.count({
        where: {
          authorId: user.id,
          status: "PUBLISHED",
        },
      });

      return mapUserSummary({
        ...user,
        booksPublished,
      });
    }),
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getAdminUserById(
  userId: string,
): Promise<AdminUserSummary> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      profile: {
        select: {
          displayName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          books: true,
          libraryItems: true,
          readings: true,
          transactions: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  const booksPublished = await prisma.book.count({
    where: {
      authorId: user.id,
      status: "PUBLISHED",
    },
  });

  return mapUserSummary({
    ...user,
    booksPublished,
  });
}

export async function getAdminBooks(args: {
  search?: string;
  status?: string;
  writerId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminBooksResponse> {
  const page = clampPage(args.page ?? 1);
  const limit = clampLimit(args.limit ?? 20);
  const skip = (page - 1) * limit;

  const where: Prisma.BookWhereInput = {
    ...(args.search
      ? {
          OR: [
            {
              title: {
                contains: args.search,
              },
            },
            {
              author: {
                profile: {
                  displayName: {
                    contains: args.search,
                  },
                },
              },
            },
            {
              author: {
                email: {
                  contains: args.search,
                },
              },
            },
          ],
        }
      : {}),

    ...(args.status && args.status !== "ALL"
      ? {
          status: args.status,
        }
      : {}),

    ...(args.writerId
      ? {
          authorId: args.writerId,
        }
      : {}),
  };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        chapters: {
          select: {
            id: true,
          },
        },
        submissions: {
          orderBy: {
            submittedAt: "desc",
          },
          take: 1,
          select: {
            status: true,
            rejectionReason: true,
            submittedAt: true,
          },
        },
      },
    }),

    prisma.book.count({
      where,
    }),
  ]);

  const items: AdminBookSummary[] = books.map((book) =>
    mapBookSummary({
      ...book,
      author: book.author,
      submissions: book.submissions,
    }),
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getAdminBookById(
  bookId: string,
): Promise<AdminBookSummary> {
  const detail = await getBookDetail(bookId, {
    id: "ADMIN",
    email: "admin@somi.app",
    role: "ADMIN",
    status: "ACTIVE",
  });

  void detail;

  const book = await prisma.book.findUnique({
    where: {
      id: bookId,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      chapters: {
        select: {
          id: true,
        },
      },
      submissions: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 1,
        select: {
          status: true,
          rejectionReason: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!book) {
    throw new AppError(404, "BOOK_NOT_FOUND", "Book not found.");
  }

  return mapBookSummary({
    ...book,
    author: book.author,
    submissions: book.submissions,
  });
}

export async function getAdminBookDetail(bookId: string): Promise<unknown> {
  return getBookDetail(bookId, {
    id: "ADMIN",
    email: "admin@somi.app",
    role: "ADMIN",
    status: "ACTIVE",
  });
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

export async function recordAdminAuditEvent(args: {
  actorId: string | null;
  actorName?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<AdminAuditEvent> {
  const event = await prisma.auditEvent.create({
    data: {
      actorId: args.actorId,
      actorName: args.actorName ?? null,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId ?? null,
      metadata: args.metadata
        ? (args.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return {
    id: event.id,
    actorId: event.actorId,
    actorName: event.actorName,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    metadata: mapAuditMetadata(event.metadata),
    timestamp: event.createdAt.toISOString(),
  };
}

export async function getAdminAuditEvents(args: {
  search?: string;
  action?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}): Promise<AdminAuditResponse> {
  const page = clampPage(args.page ?? 1);
  const limit = clampLimit(args.limit ?? 20);
  const skip = (page - 1) * limit;

  const where: Prisma.AuditEventWhereInput = {
    ...(args.action && args.action !== "ALL"
      ? {
          action: args.action,
        }
      : {}),

    ...(args.targetType && args.targetType !== "ALL"
      ? {
          targetType: args.targetType,
        }
      : {}),

    ...(args.search
      ? {
          OR: [
            {
              id: {
                contains: args.search,
              },
            },
            {
              actorId: {
                contains: args.search,
              },
            },
            {
              actorName: {
                contains: args.search,
              },
            },
            {
              action: {
                contains: args.search,
              },
            },
            {
              targetType: {
                contains: args.search,
              },
            },
            {
              targetId: {
                contains: args.search,
              },
            },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.auditEvent.count({
      where,
    }),
  ]);

  return {
    items: events.map((event) => ({
      id: event.id,
      actorId: event.actorId,
      actorName: event.actorName,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: mapAuditMetadata(event.metadata),
      timestamp: event.createdAt.toISOString(),
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Platform settings                                                          */
/* -------------------------------------------------------------------------- */

const DEFAULT_PLATFORM_SETTINGS = {
  platformName: "SOMI",
  supportEmail: "support@somi.app",
  maintenanceMode: false,
  moderationEnabled: true,
  writerRegistrationEnabled: true,
  autoPublishEnabled: false,
  coinConversionRate: 4.2,
  minimumPurchase: 125,
  chapterPricingRules: "premium chapters require explicit pricing",
  emailNotifications: true,
  moderationNotifications: true,
  paymentNotifications: true,
  sessionPolicy: "JWT",
  adminSessionTimeoutMinutes: 60,
  suspiciousActivityMonitoring: true,
} as const;

const mapPlatformSettings = (settings: {
  id: string;
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  moderationEnabled: boolean;
  writerRegistrationEnabled: boolean;
  autoPublishEnabled: boolean;
  coinConversionRate: number;
  minimumPurchase: number;
  chapterPricingRules: string;
  emailNotifications: boolean;
  moderationNotifications: boolean;
  paymentNotifications: boolean;
  sessionPolicy: string;
  adminSessionTimeoutMinutes: number;
  suspiciousActivityMonitoring: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminPlatformSettings => ({
  id: settings.id,
  platformName: settings.platformName,
  supportEmail: settings.supportEmail,
  maintenanceMode: settings.maintenanceMode,
  moderationEnabled: settings.moderationEnabled,
  writerRegistrationEnabled: settings.writerRegistrationEnabled,
  autoPublishEnabled: settings.autoPublishEnabled,
  coinConversionRate: settings.coinConversionRate,
  minimumPurchase: settings.minimumPurchase,
  chapterPricingRules: settings.chapterPricingRules,
  emailNotifications: settings.emailNotifications,
  moderationNotifications: settings.moderationNotifications,
  paymentNotifications: settings.paymentNotifications,
  sessionPolicy: settings.sessionPolicy,
  adminSessionTimeoutMinutes: settings.adminSessionTimeoutMinutes,
  suspiciousActivityMonitoring: settings.suspiciousActivityMonitoring,
  createdAt: settings.createdAt.toISOString(),
  updatedAt: settings.updatedAt.toISOString(),
});

export async function getAdminPlatformSettings(): Promise<AdminPlatformSettings> {
  let settings = await prisma.platformSettings.findFirst();

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        ...DEFAULT_PLATFORM_SETTINGS,
      },
    });
  }

  return mapPlatformSettings(settings);
}

export type UpdateAdminPlatformSettings = Partial<{
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  moderationEnabled: boolean;
  writerRegistrationEnabled: boolean;
  autoPublishEnabled: boolean;
  coinConversionRate: number;
  minimumPurchase: number;
  chapterPricingRules: string;
  emailNotifications: boolean;
  moderationNotifications: boolean;
  paymentNotifications: boolean;
  sessionPolicy: string;
  adminSessionTimeoutMinutes: number;
  suspiciousActivityMonitoring: boolean;
}>;

export async function updateAdminPlatformSettings(args: {
  actorId: string;
  actorName?: string | null;
  changes: UpdateAdminPlatformSettings;
}): Promise<AdminPlatformSettings> {
  let current = await prisma.platformSettings.findFirst();

  if (!current) {
    current = await prisma.platformSettings.create({
      data: {
        ...DEFAULT_PLATFORM_SETTINGS,
      },
    });
  }

  const changedFields = Object.keys(args.changes).filter((field) => {
    const key = field as keyof UpdateAdminPlatformSettings;

    return args.changes[key] !== current[key];
  });

  if (changedFields.length === 0) {
    return mapPlatformSettings(current);
  }

  const updated = await prisma.platformSettings.update({
    where: {
      id: current.id,
    },
    data: args.changes,
  });

  await recordAdminAuditEvent({
    actorId: args.actorId,
    actorName: args.actorName ?? null,
    action: "SETTING_CHANGED",
    targetType: "PLATFORM_SETTINGS",
    targetId: updated.id,
    metadata: {
      changedFields,
    },
  });

  return mapPlatformSettings(updated);
}
