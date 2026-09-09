import { z } from "zod";

export const commentParamsSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
});

export const commentIdParamsSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  commentId: z.string().uuid(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(2000, "Comment cannot exceed 2000 characters."),
});
