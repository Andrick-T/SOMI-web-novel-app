import path from "node:path";
import { config as loadDotEnv } from "dotenv";
import { z } from "zod";
loadDotEnv({ path: path.resolve(process.cwd(), ".env") });
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1).optional(),
    REDIS_URL: z.string().optional(),
    JWT_SECRET: z.string().min(12).optional(),
    JWT_REFRESH_SECRET: z.string().min(12).optional(),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    AUTH_COOKIE_NAME: z.string().default("somi_refresh_token"),
    CORS_ORIGIN: z.string().optional(),
    APP_NAME: z.string().default("SOMI API"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
}
export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const hasDatabaseUrl = Boolean(env.DATABASE_URL && env.DATABASE_URL.trim().length > 0);
