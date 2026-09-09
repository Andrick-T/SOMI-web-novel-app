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
  content: comment.content,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString(),
  author: {
    id: comment.user.id,
    username: comment.user.username,
    displayName: comment.user.profile?.displayName ?? comment.user.username,
    avatar: comment.user.profile?.avatar ?? null,
  },
});

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

  return comments.map(mapComment);
}

export async function createChapterComment(
  user: AuthPrincipal | undefined,
  bookId: string,
  chapterId: string,
  content: string,
) {
  const currentUser = requireUser(user);

  await getPublishedChapter(bookId, chapterId);

  const comment = await commentModel.create({
    data: {
      userId: currentUser.id,
      bookId,
      chapterId,
      content: content.trim(),
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
