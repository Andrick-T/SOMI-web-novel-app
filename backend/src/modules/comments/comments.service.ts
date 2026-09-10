import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/http-error.js";
import type { AuthPrincipal } from "../auth/auth.types.js";

const commentModel: any = (prisma as any).comment ?? (prisma as any).comments;

const requireUser = (user: AuthPrincipal | undefined) => {
  if (!user?.id) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  return user;
};

const getPublishedChapter = async (bookId: string, chapterId: string) => {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      bookId,
      status: "PUBLISHED",
      book: {
        status: "PUBLISHED",
      },
    },
    select: {
      id: true,
      bookId: true,
    },
  });

  if (!chapter) {
    throw new AppError(404, "CHAPTER_NOT_FOUND", "Chapter not found.");
  }

  return chapter;
};

const mapComment = (comment: any) => ({
  id: comment.id,
  parentId: comment.parentId ?? null,
  content: comment.content,
  gifId: comment.gifId ?? null,
  gifUrl: comment.gifUrl ?? null,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString(),
  author: {
    id: comment.user.id,
    username: comment.user.username,
    displayName: comment.user.profile?.displayName ?? comment.user.username,
    avatar: comment.user.profile?.avatar ?? null,
  },
  replies: [],
});

const buildCommentTree = (comments: any[]) => {
  const nodes = new Map<string, any>();
  const roots: any[] = [];

  for (const comment of comments) {
    nodes.set(comment.id, mapComment(comment));
  }

  for (const comment of comments) {
    const node = nodes.get(comment.id);

    if (!node) {
      continue;
    }

    if (!comment.parentId) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(comment.parentId);

    if (parent) {
      parent.replies.push(node);
    } else {
      // Defensive fallback for an invalid/missing parent.
      roots.push(node);
    }
  }

  const sortByNewest = (items: any[]) => {
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    for (const item of items) {
      sortByNewest(item.replies);
    }
  };

  sortByNewest(roots);

  return roots;
};

export async function listChapterComments(bookId: string, chapterId: string) {
  await getPublishedChapter(bookId, chapterId);

  const comments = await commentModel.findMany({
    where: {
      bookId,
      chapterId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              displayName: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return buildCommentTree(comments);
}

export async function createChapterComment(
  user: AuthPrincipal | undefined,
  bookId: string,
  chapterId: string,
  content: string,
  parentId?: string | null,
  gifId?: string | null,
  gifUrl?: string | null,
) {
  const currentUser = requireUser(user);

  await getPublishedChapter(bookId, chapterId);

  const normalizedContent = content.trim();
  const normalizedParentId = parentId ?? null;
  const normalizedGifId = gifId?.trim() || null;
  const normalizedGifUrl = gifUrl?.trim() || null;

  if (!normalizedContent && !normalizedGifUrl) {
    throw new AppError(400, "EMPTY_COMMENT", "Comment cannot be empty.");
  }

  if (
    (normalizedGifId && !normalizedGifUrl) ||
    (!normalizedGifId && normalizedGifUrl)
  ) {
    throw new AppError(
      400,
      "INVALID_GIF",
      "GIF ID and GIF URL must be provided together.",
    );
  }

  if (normalizedGifUrl) {
    try {
      const url = new URL(normalizedGifUrl);
      const hostname = url.hostname.toLowerCase();

      const isAllowedGiphyHost =
        hostname === "media.giphy.com" ||
        hostname === "i.giphy.com" ||
        /^media\d+\.giphy\.com$/.test(hostname);

      if (url.protocol !== "https:" || !isAllowedGiphyHost) {
        throw new AppError(400, "INVALID_GIF", "GIF must be hosted by GIPHY.");
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(400, "INVALID_GIF", "Invalid GIF URL.");
    }
  }

  if (normalizedParentId) {
    const parentComment = await commentModel.findFirst({
      where: {
        id: normalizedParentId,
        bookId,
        chapterId,
      },
      select: {
        id: true,
      },
    });

    if (!parentComment) {
      throw new AppError(
        400,
        "INVALID_PARENT_COMMENT",
        "The parent comment does not belong to this chapter.",
      );
    }
  }

  const comment = await commentModel.create({
    data: {
      userId: currentUser.id,
      bookId,
      chapterId,
      parentId: normalizedParentId,
      content: normalizedContent,
      gifId: normalizedGifId,
      gifUrl: normalizedGifUrl,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              displayName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  return mapComment(comment);
}

export async function deleteChapterComment(
  user: AuthPrincipal | undefined,
  bookId: string,
  chapterId: string,
  commentId: string,
) {
  const currentUser = requireUser(user);

  const comment = await commentModel.findFirst({
    where: {
      id: commentId,
      bookId,
      chapterId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!comment) {
    throw new AppError(404, "COMMENT_NOT_FOUND", "Comment not found.");
  }

  const isOwner = comment.userId === currentUser.id;
  const isAdmin = currentUser.role.toUpperCase() === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "FORBIDDEN", "You cannot delete this comment.");
  }

  await commentModel.delete({
    where: {
      id: comment.id,
    },
  });
}
