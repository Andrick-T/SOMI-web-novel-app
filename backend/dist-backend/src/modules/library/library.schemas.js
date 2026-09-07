import { z } from "zod";
export const bookIdParamsSchema = z.object({
    bookId: z.string().uuid(),
});
export const progressParamsSchema = z.object({
    bookId: z.string().uuid(),
    chapterId: z.string().uuid(),
});
export const saveProgressSchema = z.object({
    progressPercent: z.number().min(0).max(100),
    position: z.number().int().nonnegative().default(0),
    updatedAt: z.string().datetime().optional(),
});
