import { z } from "zod";
export const bookStatusSchema = z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]);
export const chapterStatusSchema = z.enum([
    "DRAFT",
    "PUBLISHED",
    "UNPUBLISHED",
]);
export const accessTypeSchema = z.enum(["FREE", "PREMIUM"]);
export const createBookSchema = z.object({
    title: z.string().trim().min(1).max(200),
    slug: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    synopsis: z.string().trim().max(4000).optional().nullable().default(null),
    cover: z.string().trim().url().optional().nullable().default(null),
    heroImage: z.string().trim().url().optional().nullable().default(null),
    status: bookStatusSchema.optional().default("DRAFT"),
    genres: z.array(z.string().trim().min(1)).default([]),
    tags: z.array(z.string().trim().min(1)).default([]),
});
export const updateBookSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
    synopsis: z.string().trim().max(4000).optional().nullable(),
    cover: z.string().trim().url().optional().nullable(),
    heroImage: z.string().trim().url().optional().nullable(),
    status: bookStatusSchema.optional(),
    genres: z.array(z.string().trim().min(1)).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
});
export const createChapterSchema = z.object({
    title: z.string().trim().min(1).max(200),
    number: z.number().int().positive().max(10000),
    content: z.string().trim().min(1).max(50000),
    status: chapterStatusSchema.optional().default("DRAFT"),
    accessType: accessTypeSchema.optional().default("FREE"),
    price: z.number().int().nonnegative().optional().default(0),
});
export const updateChapterSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    number: z.number().int().positive().max(10000).optional(),
    content: z.string().trim().min(1).max(50000).optional(),
    status: chapterStatusSchema.optional(),
    accessType: accessTypeSchema.optional(),
    price: z.number().int().nonnegative().optional(),
});
