import { appConfig } from "../../config/env";
import { apiAuthRepository } from "./authRepository";

export type ChapterComment = {
  id: string;
  parentId: string | null;
  content: string;
  gifId: string | null;
  gifUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string | null;
  };
  replies: ChapterComment[];
};

export type CreateChapterCommentOptions = {
  parentId?: string | null;
  gifId?: string | null;
  gifUrl?: string | null;
};

const publicRequest = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const baseUrl = appConfig.apiBaseUrl.replace(/\/$/, "");

  const requestUrl = `${baseUrl}${path}`;

  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(requestUrl, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(body?.error?.message ?? "Unable to load comments.");
  }

  return response.status === 204 ? (undefined as T) : response.json();
};

export const apiCommentsRepository = {
  async list(bookId: string, chapterId: string) {
    const result = await publicRequest<{
      comments: ChapterComment[];
    }>(`/api/v1/books/${bookId}/chapters/${chapterId}/comments`);

    return result.comments;
  },

  async create(
    bookId: string,
    chapterId: string,
    content: string,
    options?: CreateChapterCommentOptions,
  ) {
    const result = await apiAuthRepository.authorizedRequest<{
      comment: ChapterComment;
    }>(`/api/v1/books/${bookId}/chapters/${chapterId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        content,
        parentId: options?.parentId ?? null,
        gifId: options?.gifId ?? null,
        gifUrl: options?.gifUrl ?? null,
      }),
    });

    return result.comment;
  },

  async remove(bookId: string, chapterId: string, commentId: string) {
    await apiAuthRepository.authorizedRequest<void>(
      `/api/v1/books/${bookId}/chapters/${chapterId}/comments/${commentId}`,
      {
        method: "DELETE",
      },
    );
  },
};
