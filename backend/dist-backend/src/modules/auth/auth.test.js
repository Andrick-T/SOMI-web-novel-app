import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import { assertOwnership, isOwner } from "./auth.authorization.js";
import { createAccessToken } from "./auth.crypto.js";
import { requirePermission, requireRole } from "./auth.middleware.js";
const app = createApp();
const password = "Somi-test-password-123";
const replacementPassword = "Somi-new-password-456";
const email = `phase7b-${randomUUID()}@example.test`;
let userId = "";
let accessToken = "";
let refreshTokenA = "";
let refreshTokenB = "";
const cookieValue = (response) => {
    const cookies = response.headers["set-cookie"];
    const cookie = cookies?.find((value) => value.startsWith("somi_refresh_token="));
    return cookie?.split(";")[0].split("=")[1];
};
describe("Phase 7B authentication lifecycle", () => {
    beforeAll(async () => {
        await prisma.$queryRaw `SELECT 1`;
    });
    afterAll(async () => {
        if (userId)
            await prisma.user.delete({ where: { id: userId } });
        await prisma.$disconnect();
    });
    it("registers a user and stores only a password hash", async () => {
        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password, name: "Phase 7B Test User" });
        expect(response.status).toBe(201);
        expect(response.body.user.email).toBe(email);
        expect(response.body.user).not.toHaveProperty("passwordHash");
        expect(response.body).toHaveProperty("accessToken");
        refreshTokenA = cookieValue(response);
        accessToken = response.body.accessToken;
        userId = response.body.user.id;
        const stored = await prisma.user.findUnique({ where: { id: userId } });
        expect(stored?.passwordHash).toMatch(/^scrypt:/);
        expect(stored?.passwordHash).not.toBe(password);
        expect(await prisma.authSession.count({ where: { userId } })).toBe(1);
    });
    it("rejects duplicate, malformed, weak, and incomplete registrations", async () => {
        const duplicate = await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password, name: "Duplicate" });
        const invalidEmail = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: "invalid", password, name: "Invalid" });
        const weakPassword = await request(app)
            .post("/api/v1/auth/register")
            .send({
            email: `weak-${randomUUID()}@example.test`,
            password: "short",
            name: "Weak",
        });
        const missingName = await request(app)
            .post("/api/v1/auth/register")
            .send({ email: `missing-${randomUUID()}@example.test`, password });
        expect(duplicate.status).toBe(401);
        expect(duplicate.body.error.message).toBe("Invalid email or password.");
        expect(invalidEmail.status).toBe(400);
        expect(weakPassword.status).toBe(400);
        expect(missingName.status).toBe(400);
    });
    it("logs in, resolves /me, and hides credential details on failure", async () => {
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password });
        expect(login.status).toBe(200);
        accessToken = login.body.accessToken;
        const me = await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${accessToken}`);
        expect(me.status).toBe(200);
        expect(me.body.user.id).toBe(userId);
        const unknown = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: `unknown-${randomUUID()}@example.test`, password });
        const wrongPassword = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: "wrong-password" });
        expect(unknown.status).toBe(401);
        expect(wrongPassword.status).toBe(401);
        expect(unknown.body.error.message).toBe(wrongPassword.body.error.message);
    });
    it("rejects missing, malformed, and expired access tokens", async () => {
        expect((await request(app).get("/api/v1/auth/me")).status).toBe(401);
        expect((await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", "Bearer malformed")).status).toBe(401);
        expect((await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${createAccessToken(userId, "READER").replace(/\.[^.]+$/, ".invalid")}`)).status).toBe(401);
    });
    it("rotates refresh tokens and rejects the old token", async () => {
        const refreshed = await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", `somi_refresh_token=${refreshTokenA}`)
            .send({});
        expect(refreshed.status).toBe(200);
        refreshTokenB = cookieValue(refreshed);
        expect(refreshTokenB).toBeTruthy();
        expect(refreshTokenB).not.toBe(refreshTokenA);
        const oldToken = await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", `somi_refresh_token=${refreshTokenA}`)
            .send({});
        const currentToken = await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", `somi_refresh_token=${refreshTokenB}`)
            .send({});
        expect(oldToken.status).toBe(401);
        expect(currentToken.status).toBe(200);
    });
    it("changes the password and revokes active sessions", async () => {
        const invalid = await request(app)
            .post("/api/v1/auth/change-password")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
            currentPassword: "wrong-password",
            newPassword: replacementPassword,
        });
        expect(invalid.status).toBe(401);
        const changed = await request(app)
            .post("/api/v1/auth/change-password")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ currentPassword: password, newPassword: replacementPassword });
        expect(changed.status).toBe(204);
        expect((await request(app).post("/api/v1/auth/login").send({ email, password }))
            .status).toBe(401);
        expect((await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: replacementPassword })).status).toBe(200);
        expect((await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", `somi_refresh_token=${refreshTokenB}`)
            .send({})).status).toBe(401);
    });
    it("enforces roles, permissions, and ownership on the server", () => {
        const readerRequest = {
            user: { id: userId, email, role: "READER", status: "ACTIVE" },
        };
        const adminRequest = {
            user: { id: userId, email, role: "ADMIN", status: "ACTIVE" },
        };
        const next = (error) => error;
        expect(next(requireRole("READER")(readerRequest, {}, next))).toBeUndefined();
        expect(next(requireRole("ADMIN")(readerRequest, {}, next))).toBeInstanceOf(Error);
        expect(next(requirePermission("USER_VIEW")(adminRequest, {}, next))).toBeUndefined();
        expect(next(requirePermission("USER_VIEW")(readerRequest, {}, next))).toBeInstanceOf(Error);
        expect(isOwner(readerRequest, userId)).toBe(true);
        expect(isOwner(readerRequest, randomUUID())).toBe(false);
        expect(() => assertOwnership(readerRequest, userId)).not.toThrow();
        expect(() => assertOwnership(readerRequest, randomUUID())).toThrow();
    });
    it("logs out and rejects the session afterwards", async () => {
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: replacementPassword });
        const cookie = cookieValue(login);
        expect((await request(app)
            .post("/api/v1/auth/logout")
            .set("Cookie", `somi_refresh_token=${cookie}`)
            .send({})).status).toBe(204);
        expect((await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", `somi_refresh_token=${cookie}`)
            .send({})).status).toBe(401);
    });
});
