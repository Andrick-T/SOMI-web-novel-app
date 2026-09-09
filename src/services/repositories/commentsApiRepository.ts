import { apiAuthRepository } from "./authRepository";

export type ChapterComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string | null;
  };
};

export const apiCommentsRepository = {
  async list(bookId: string, chapterId: string) {
    const result = await apiAuthRepository.authorizedRequest<{
      comments: ChapterComment[];
    }>(`/api/v1/books/${bookId}/chapters/${chapterId}/comments`);

    return result.comments;
  },

  async create(bookId: string, chapterId: string, content: string) {
    const result = await apiAuthRepository.authorizedRequest<{
      comment: ChapterComment;
    }>(`/api/v1/books/${bookId}/chapters/${chapterId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
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
