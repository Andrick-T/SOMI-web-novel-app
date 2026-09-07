import { PrismaClient } from "@prisma/client";
import { hasDatabaseUrl } from "./env.js";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function checkDatabaseConnection(): Promise<{
  status: "connected" | "disconnected";
  latencyMs?: number;
  message?: string;
}> {
  if (!hasDatabaseUrl) {
    return {
      status: "disconnected",
      message: "DATABASE_URL is not configured.",
    };
  }

  try {
    const startedAt = Date.now();
    await prisma.$queryRaw`SELECT 1 as ok`;
    return {
      status: "connected",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "disconnected",
      message:
        error instanceof Error ? error.message : "Unknown database error.",
    };
  }
}
