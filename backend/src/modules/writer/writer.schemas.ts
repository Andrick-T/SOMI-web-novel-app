import { z } from "zod";

export const languageCodeSchema = z.enum(["en", "fr"]);

const unsafeContentPattern =
  /<\s*(script|iframe|object|embed)|on[a-z]+\s*=|javascript:/i;

export const richContentSchema = z
  .union([
    z.string().trim().min(1).max(100000),
    z.record(z.string(), z.unknown()),
  ])
  .refine(
    (value) => !unsafeContentPattern.test(JSON.stringify(value)),
    "Content contains unsafe markup or URLs.",
  );

export const localizationSchema = z.object({
  languageCode: languageCodeSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z
    .enum(["NOT_STARTED", "NEEDS_PROOFREADING", "READY_FOR_SUBMISSION"])
    .optional(),
});

export const autosaveSchema = z.object({
  languageCode: languageCodeSchema.default("en"),
  title: z.string().trim().min(1).max(200),
  content: richContentSchema,
  contentFormat: z
    .enum(["plain-text", "structured-rich-text"])
    .default("plain-text"),
  clientVersion: z.number().int().nonnegative(),
});

export const translationSchema = z
  .object({
    sourceLanguage: languageCodeSchema,
    targetLanguage: languageCodeSchema,
    includeMetadata: z.boolean().default(true),
    includeChapters: z.boolean().default(true),
  })
  .refine((value) => value.sourceLanguage !== value.targetLanguage, {
    message: "Source and target languages must differ.",
    path: ["targetLanguage"],
  });

export const assetSchema = z.object({
  chapterId: z.string().uuid().optional(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  width: z.number().int().positive().max(4096).optional(),
  height: z.number().int().positive().max(4096).optional(),
  altText: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(500).nullable().optional(),
});

export const assetMetadataSchema = z.object({
  altText: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(500).nullable().optional(),
  width: z.number().int().positive().max(4096).optional(),
  height: z.number().int().positive().max(4096).optional(),
});

export const writerProfileSchema = z.object({
  displayName: z.string().trim().max(100).nullable().optional(),
  penName: z.string().trim().max(100).nullable().optional(),
  bio: z.string().trim().max(4000).nullable().optional(),
  avatar: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
});
