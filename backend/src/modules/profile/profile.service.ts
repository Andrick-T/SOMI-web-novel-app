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

const calculateDayStreak = (dates: Date[]) => {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      dates.map((date) => {
        const value = new Date(date);
        return value.toISOString().slice(0, 10);
      }),
    ),
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDays.length === 0) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`);
    const current = new Date(`${uniqueDays[index]}T00:00:00.000Z`);

    const difference =
      (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);

    if (difference !== 1) {
      break;
    }

    streak += 1;
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
  const booksById = new Map<
    string,
    {
      genres: string[];
    }
  >();

  for (const entry of progress) {
    if (!booksById.has(entry.bookId)) {
      booksById.set(entry.bookId, {
        genres: entry.book.genres.map((item) => item.genre.name),
      });
    }
  }

  const genreCounts = new Map<string, number>();

  for (const book of booksById.values()) {
    for (const genre of book.genres) {
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

export async function getProfile(user: AuthPrincipal | undefined) {
  const currentUser = requireUser(user);

  const [account, walletResult, progress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUser.id },
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
    }),

    getWallet(currentUser.id),

    prisma.readingProgress.findMany({
      where: {
        userId: currentUser.id,
        progressPercentage: {
          gt: 0,
        },
      },
      select: {
        bookId: true,
        chapterId: true,
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
    }),
  ]);

  if (!account) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "User profile not found.");
  }

  const booksRead = new Set(progress.map((entry) => entry.bookId)).size;

  const readingMinutes = progress.reduce((total, entry) => {
    const percentage = clampPercentage(Number(entry.progressPercentage));

    return total + Number(entry.chapter.readingTime) * (percentage / 100);
  }, 0);

  const readingHours = Math.round((readingMinutes / 60) * 10) / 10;

  const dayStreak = calculateDayStreak(
    progress.map((entry) => entry.lastReadAt),
  );

  const readingGenres = calculateReadingGenres(progress);

  return {
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

    wallet: walletResult.wallet,

    stats: {
      booksRead,
      readingHours,
      dayStreak,
      averageRating: null,
    },

    readingGenres,
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
    return await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.userProfile.findUnique({
        where: { userId: currentUser.id },
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

      const mergedPreferences = input.preferences
        ? {
            ...(existingPreferences as Record<string, Prisma.JsonValue>),
            ...input.preferences,
          }
        : existingPreferences;

      if (input.username !== undefined) {
        await tx.user.update({
          where: { id: currentUser.id },
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
            ? { displayName: input.displayName }
            : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
          ...(input.preferences !== undefined
            ? { preferences: mergedPreferences }
            : {}),
        },
      });

      return getProfileFromTransaction(tx, currentUser.id);
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
}

async function getProfileFromTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const account = await tx.user.findUnique({
    where: { id: userId },
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

  return {
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
  };
}
