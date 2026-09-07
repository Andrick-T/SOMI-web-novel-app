import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/http-error.js";
import { env } from "../../config/env.js";
import { createAccessToken, createRefreshToken, hashPassword, hashRefreshToken, verifyPassword, verifyRefreshToken } from "./auth.crypto.js";

type UserWithProfile = { id: string; email: string; role: string; status: string; createdAt: Date; passwordHash?: string; profile?: { displayName: string | null; avatar: string | null } | null };
const publicUser = (user: UserWithProfile) => {
  const role = user.role.toLowerCase();
  return { id: user.id, email: user.email, role, roles: [role], status: user.status.toLowerCase(), name: user.profile?.displayName ?? user.email.split("@")[0], avatar: user.profile?.avatar ?? undefined, createdAt: user.createdAt.toISOString() };
};
const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");

export async function register(input: { email: string; password: string; name: string }, meta: { ip?: string; userAgent?: string }) {
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw invalidCredentials();
  const user = await prisma.user.create({ data: { email: input.email, username: `${input.email.split("@")[0]}-${randomUUID().slice(0, 8)}`, passwordHash: await hashPassword(input.password), profile: { create: { displayName: input.name } } }, include: { profile: true } });
  return createSession(user, meta);
}

export async function login(input: { email: string; password: string }, meta: { ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { profile: true } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw invalidCredentials();
  if (user.status !== "ACTIVE") throw new AppError(403, "ACCOUNT_INACTIVE", "This account is not active.");
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return createSession(user, meta);
}

async function createSession(user: UserWithProfile, meta: { ip?: string; userAgent?: string }) {
  const session = await prisma.authSession.create({ data: { userId: user.id, refreshTokenHash: "pending", expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000), ipAddress: meta.ip, userAgent: meta.userAgent } });
  const refreshToken = createRefreshToken(session.id);
  await prisma.authSession.update({ where: { id: session.id }, data: { refreshTokenHash: hashRefreshToken(refreshToken) } });
  return { user: publicUser(user), accessToken: createAccessToken(user.id, user.role), refreshToken };
}

export async function refresh(refreshToken: string, meta: { ip?: string; userAgent?: string }) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const sessionId = typeof payload.sub === "string" ? payload.sub : "";
    const session = await prisma.authSession.findUnique({ where: { id: sessionId }, include: { user: { include: { profile: true } } } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.refreshTokenHash !== hashRefreshToken(refreshToken)) throw new Error("Invalid session");
    const next = await createSession(session.user, meta);
    await prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return next;
  } catch { throw new AppError(401, "INVALID_REFRESH_TOKEN", "Authentication session is invalid or expired."); }
}

export async function revokeSession(sessionId: string) { await prisma.authSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } }); }

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) throw invalidCredentials();
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  await prisma.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function getSafeUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
  return publicUser(user);
}