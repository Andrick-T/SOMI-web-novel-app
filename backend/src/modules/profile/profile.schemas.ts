import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores.",
  );

const preferencesSchema = z
  .object({
    notifications: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z.string().trim().min(2).max(10).optional(),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    username: username.optional(),
    displayName: z.string().trim().min(1).max(100).nullable().optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    avatar: z.string().trim().url().max(1000).nullable().optional(),
    preferences: preferencesSchema.optional(),
  })
  .strict();
