import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { env } from "../../config/env.js";
const scrypt = promisify(scryptCallback);
const accessSecret = env.JWT_SECRET ?? (env.NODE_ENV === "production" ? "" : "development-access-secret");
const refreshSecret = env.JWT_REFRESH_SECRET ?? (env.NODE_ENV === "production" ? "" : "development-refresh-secret");
export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derived = (await scrypt(password, salt, 64));
    return `scrypt:${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
    const [, salt, encoded] = stored.split(":");
    if (!salt || !encoded)
        return false;
    const derived = (await scrypt(password, salt, 64));
    const expected = Buffer.from(encoded, "hex");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
}
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (value, secret) => createHmac("sha256", secret).update(value).digest("base64url");
export function createToken(payload, secret, ttlSeconds) {
    if (!secret)
        throw new Error("JWT secret is required in production.");
    const header = encode({ alg: "HS256", typ: "JWT" });
    const body = encode({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSeconds });
    return `${header}.${body}.${sign(`${header}.${body}`, secret)}`;
}
export function verifyToken(token, secret) {
    const [header, body, signature] = token.split(".");
    if (!secret || !header || !body || !signature || sign(`${header}.${body}`, secret) !== signature)
        throw new Error("Invalid token");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000))
        throw new Error("Expired token");
    return payload;
}
export const createAccessToken = (userId, role) => createToken({ sub: userId, role, type: "access" }, accessSecret, env.ACCESS_TOKEN_TTL_MINUTES * 60);
export const createRefreshToken = (sessionId) => createToken({ sub: sessionId, type: "refresh" }, refreshSecret, env.REFRESH_TOKEN_TTL_DAYS * 86400);
export const verifyAccessToken = (token) => verifyToken(token, accessSecret);
export const verifyRefreshToken = (token) => verifyToken(token, refreshSecret);
export const hashRefreshToken = (token) => createHmac("sha256", refreshSecret || "development-refresh-secret").update(token).digest("hex");
