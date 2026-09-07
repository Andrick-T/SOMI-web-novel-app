import { Router, type RequestHandler, type Response } from "express";
import { validate } from "../../common/middleware/validate.js";
import { AppError } from "../../common/errors/http-error.js";
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from "./auth.schemas.js";
import { changePassword, getSafeUser, login, refresh, register, revokeSession } from "./auth.service.js";
import { requireAuth } from "./auth.middleware.js";
import type { AuthRequest } from "./auth.types.js";
import { verifyRefreshToken } from "./auth.crypto.js";
import { env } from "../../config/env.js";

export const authRouter = Router();
const asyncRoute = (handler: RequestHandler): RequestHandler => (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };
const attempts = new Map<string, { count: number; resetAt: number }>();
const rateLimit = (req: AuthRequest, res: Response, next: Parameters<RequestHandler>[2]) => {
	const now = Date.now();
	const key = req.ip ?? "unknown";
	const current = attempts.get(key);
	if (!current || current.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 60_000 });
	else if (++current.count > 20) { res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Try again later.", details: [] } }); return; }
	next();
};
const setRefreshCookie = (res: Response, token: string) => res.setHeader("Set-Cookie", `${env.AUTH_COOKIE_NAME}=${token}; HttpOnly; Path=/api/v1/auth; Max-Age=${env.REFRESH_TOKEN_TTL_DAYS * 86400}; SameSite=Lax${env.NODE_ENV === "production" ? "; Secure" : ""}`);
const clearRefreshCookie = (res: Response) => res.setHeader("Set-Cookie", `${env.AUTH_COOKIE_NAME}=; HttpOnly; Path=/api/v1/auth; Max-Age=0; SameSite=Lax${env.NODE_ENV === "production" ? "; Secure" : ""}`);
const readRefresh = (req: AuthRequest) => req.body.refreshToken ?? req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${env.AUTH_COOKIE_NAME}=`))?.slice(env.AUTH_COOKIE_NAME.length + 1);
const meta = (req: AuthRequest) => ({ ip: req.ip, userAgent: req.get("user-agent") });

authRouter.post("/register", rateLimit, validate(registerSchema), asyncRoute(async (req, res) => { const result = await register(req.body, meta(req)); setRefreshCookie(res, result.refreshToken); res.status(201).json(result); }));
authRouter.post("/login", rateLimit, validate(loginSchema), asyncRoute(async (req, res) => { const result = await login(req.body, meta(req)); setRefreshCookie(res, result.refreshToken); res.json(result); }));
authRouter.post("/refresh", rateLimit, validate(refreshSchema), asyncRoute(async (req, res) => { const token = readRefresh(req); if (!token) throw new AppError(401, "INVALID_REFRESH_TOKEN", "Authentication session is invalid or expired."); const result = await refresh(token, meta(req)); setRefreshCookie(res, result.refreshToken); res.json(result); }));
authRouter.post("/logout", asyncRoute(async (req, res) => { const token = readRefresh(req); if (token) { try { const payload = verifyRefreshToken(token); if (typeof payload.sub === "string") await revokeSession(payload.sub); } catch { /* logout intentionally idempotent */ } } clearRefreshCookie(res); res.status(204).send(); }));
authRouter.get("/me", requireAuth, asyncRoute(async (req: AuthRequest, res) => res.json({ user: await getSafeUser(req.user!.id) })));
authRouter.post("/change-password", rateLimit, requireAuth, validate(changePasswordSchema), asyncRoute(async (req: AuthRequest, res) => { await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword); res.status(204).send(); }));