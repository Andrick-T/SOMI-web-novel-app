import { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
import { getWallet } from "../economy/economy.service.js";
import type { AuthPrincipal } from "../auth/auth.types.js";

const requireUser = (user: AuthPrincipal | undefined) => {
  if (!user?.id) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  return user;
};

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const toUtcDay = (date: Date) => date.toISOString().slice(0, 10);

const getPreviousUtcDay = (date: string) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
};

const calculateDayStreak = (dates: Date[]) => {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(new Set(dates.map(toUtcDay))).sort((a, b) =>
    b.localeCompare(a),
  );

  if (uniqueDays.length === 0) {
    return 0;
  }

  const today = toUtcDay(new Date());
  const yesterday = getPreviousUtcDay(today);

  const latestDay = uniqueDays[0];

  // A streak only exists if the user read today or yesterday.
  if (latestDay !== today && latestDay !== yesterday) {
    return 0;
  }

  let streak = 1;
  let expectedPreviousDay = getPreviousUtcDay(latestDay);

  for (let index = 1; index < uniqueDays.length; index += 1) {
    if (uniqueDays[index] !== expectedPreviousDay) {
      break;
    }

    streak += 1;
    expectedPreviousDay = getPreviousUtcDay(expectedPreviousDay);
  }

  return streak;
};

const calculateReadingGenres = (
  progress: Array<{
    bookId: string;
    book: {
      genres: Array<{
        genre: {
          name: string;
        };
      }>;
    };
  }>,
) => {
  const booksById = new Map<string, string[]>();

  for (const entry of progress) {
    if (!booksById.has(entry.bookId)) {
      booksById.set(
        entry.bookId,
        entry.book.genres.map((item) => item.genre.name),
      );
    }
  }

  const genreCounts = new Map<string, number>();

  for (const genres of booksById.values()) {
    for (const genre of genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }

  const total = Array.from(genreCounts.values()).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (total === 0) {
    return [];
  }

  return Array.from(genreCounts.entries())
    .map(([genre, count]) => ({
      genre,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
};

type ProfileAccount = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
  profile: {
    displayName: string | null;
    avatar: string | null;
    bio: string | null;
    preferences: Prisma.JsonValue | null;
  } | null;
};

const mapAccount = (account: ProfileAccount) => ({
  user: {
    id: account.id,
    email: account.email,
    username: account.username,
    role: account.role,
    status: account.status,
    createdAt: account.createdAt.toISOString(),
  },

  profile: {
    displayName: account.profile?.displayName ?? null,
    avatar: account.profile?.avatar ?? null,
    bio: account.profile?.bio ?? null,
    preferences: account.profile?.preferences ?? {},
  },
});

const getProfileAccount = async (userId: string) => {
  const account = await prisma.user.findUnique({
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
      profile: {
        select: {
          displayName: true,
          avatar: true,
          bio: true,
          preferences: true,
        },
      },
    },
  });

  if (!account) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "User profile not found.");
  }

  return account;
};

const getReadingStats = async (userId: string) => {
  const progress = await prisma.readingProgress.findMany({
    where: {
      userId,
      progressPercentage: {
        gt: 0,
      },
    },
    select: {
      bookId: true,
      progressPercentage: true,
      lastReadAt: true,
      chapter: {
        select: {
          readingTime: true,
        },
      },
      book: {
        select: {
          genres: {
            select: {
              genre: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const booksRead = new Set(progress.map((entry) => entry.bookId)).size;

  const readingMinutes = progress.reduce((total, entry) => {
    const percentage = clampPercentage(Number(entry.progressPercentage));

    return total + Number(entry.chapter.readingTime) * (percentage / 100);
  }, 0);

  const readingHours = Math.round((readingMinutes / 60) * 10) / 10;

  return {
    stats: {
      booksRead,
      readingHours,
      dayStreak: calculateDayStreak(progress.map((entry) => entry.lastReadAt)),
      averageRating: null,
    },
    readingGenres: calculateReadingGenres(progress),
  };
};

export async function getProfile(user: AuthPrincipal | undefined) {
  const currentUser = requireUser(user);

  const [account, walletResult, readingData] = await Promise.all([
    getProfileAccount(currentUser.id),
    getWallet(currentUser.id),
    getReadingStats(currentUser.id),
  ]);

  return {
    ...mapAccount(account),
    wallet: walletResult.wallet,
    ...readingData,
  };
}

export async function updateProfile(
  user: AuthPrincipal | undefined,
  input: {
    username?: string;
    displayName?: string | null;
    bio?: string | null;
    avatar?: string | null;
    preferences?: {
      notifications?: boolean;
      darkMode?: boolean;
      language?: string;
    };
  },
) {
  const currentUser = requireUser(user);

  try {
    await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.userProfile.findUnique({
        where: {
          userId: currentUser.id,
        },
        select: {
          preferences: true,
        },
      });

      const existingPreferences =
        existingProfile?.preferences &&
        typeof existingProfile.preferences === "object" &&
        !Array.isArray(existingProfile.preferences)
          ? existingProfile.preferences
          : {};

      const mergedPreferences =
        input.preferences !== undefined
          ? {
              ...(existingPreferences as Record<string, Prisma.JsonValue>),
              ...input.preferences,
            }
          : existingPreferences;

      if (input.username !== undefined) {
        await tx.user.update({
          where: {
            id: currentUser.id,
          },
          data: {
            username: input.username,
          },
        });
      }

      await tx.userProfile.upsert({
        where: {
          userId: currentUser.id,
        },
        create: {
          userId: currentUser.id,
          displayName: input.displayName ?? null,
          bio: input.bio ?? null,
          avatar: input.avatar ?? null,
          preferences: mergedPreferences,
        },
        update: {
          ...(input.displayName !== undefined
            ? {
                displayName: input.displayName,
              }
            : {}),

          ...(input.bio !== undefined
            ? {
                bio: input.bio,
              }
            : {}),

          ...(input.avatar !== undefined
            ? {
                avatar: input.avatar,
              }
            : {}),

          ...(input.preferences !== undefined
            ? {
                preferences: mergedPreferences,
              }
            : {}),
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "USERNAME_ALREADY_EXISTS",
        "That username is already in use.",
      );
    }

    throw error;
  }

  // Always return the same complete shape as GET /profile.
  return getProfile(currentUser);
}
