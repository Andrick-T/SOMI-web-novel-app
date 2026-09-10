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

export const createCommentSchema = z
  .object({
    content: z
      .string()
      .trim()
      .max(2000, "Comment cannot exceed 2000 characters.")
      .default(""),

    parentId: z
      .string()
      .uuid("Invalid parent comment ID.")
      .nullable()
      .optional(),

    gifId: z.string().trim().max(100, "Invalid GIF ID.").nullable().optional(),

    gifUrl: z
      .string()
      .url("Invalid GIF URL.")
      .max(1000, "GIF URL is too long.")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const content = data.content.trim();
    const gifId = data.gifId?.trim() || null;
    const gifUrl = data.gifUrl?.trim() || null;

    if (!content && !gifUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Comment cannot be empty.",
      });
    }

    if ((gifId && !gifUrl) || (!gifId && gifUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gifUrl"],
        message: "GIF ID and GIF URL must be provided together.",
      });
    }

    if (gifUrl) {
      try {
        const url = new URL(gifUrl);
        const hostname = url.hostname.toLowerCase();

        const isAllowedGiphyHost =
          hostname === "media.giphy.com" ||
          hostname === "i.giphy.com" ||
          /^media\d+\.giphy\.com$/.test(hostname);

        if (url.protocol !== "https:" || !isAllowedGiphyHost) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["gifUrl"],
            message: "GIF must be hosted by GIPHY.",
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gifUrl"],
          message: "Invalid GIF URL.",
        });
      }
    }
  });
