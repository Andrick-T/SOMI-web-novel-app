import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import { createAccessToken, hashPassword } from "../auth/auth.crypto.js";

const app = createApp();

const passwordHash = await hashPassword("profile-test-password");

const ids = {
  users: [] as string[],
};

let reader: {
  id: string;
  token: string;
};

const createUser = async () => {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@profile.test`,
      username: `profile_${randomUUID().replace(/-/g, "_").slice(0, 20)}`,
      passwordHash,
      role: "READER",
      status: "ACTIVE",
      profile: {
        create: {
          displayName: "Profile Test User",
          bio: "Initial bio",
          preferences: {
            notifications: true,
            darkMode: true,
            language: "en",
          },
        },
      },
    },
  });

  ids.users.push(user.id);

  return {
    id: user.id,
    token: createAccessToken(user.id, user.role),
  };
};

describe("Profile API", () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;

    reader = await createUser();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: ids.users,
        },
      },
    });

    await prisma.$disconnect();
  });

  it("requires authentication", async () => {
    const response = await request(app).get("/api/v1/profile");

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's profile", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${reader.token}`);

    expect(response.status).toBe(200);

    expect(response.body.profile).toMatchObject({
      user: {
        id: reader.id,
        email: expect.any(String),
        username: expect.any(String),
        role: "READER",
        status: "ACTIVE",
      },
      profile: {
        displayName: "Profile Test User",
        bio: "Initial bio",
        preferences: {
          notifications: true,
          darkMode: true,
          language: "en",
        },
      },
      wallet: {
        balance: 0,
        currency: "SOMI",
      },
      stats: {
        booksRead: 0,
        readingHours: 0,
        dayStreak: 0,
        averageRating: null,
      },
      readingGenres: [],
    });
  });

  it("updates profile fields and preserves preferences", async () => {
    const response = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${reader.token}`)
      .send({
        displayName: "Updated Reader",
        bio: "Updated bio",
        preferences: {
          notifications: false,
        },
      });

    expect(response.status).toBe(200);

    expect(response.body.profile).toMatchObject({
      user: {
        id: reader.id,
      },
      profile: {
        displayName: "Updated Reader",
        bio: "Updated bio",
        preferences: {
          notifications: false,
          darkMode: true,
          language: "en",
        },
      },
      wallet: {
        balance: 0,
        currency: "SOMI",
      },
      stats: {
        booksRead: 0,
        readingHours: 0,
        dayStreak: 0,
        averageRating: null,
      },
      readingGenres: [],
    });
  });

  it("updates the username", async () => {
    const username = `updated_${randomUUID().replace(/-/g, "_").slice(0, 20)}`;

    const response = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${reader.token}`)
      .send({
        username,
      });

    expect(response.status).toBe(200);

    expect(response.body.profile.user.username).toBe(username);

    const stored = await prisma.user.findUnique({
      where: {
        id: reader.id,
      },
    });

    expect(stored?.username).toBe(username);
  });

  it("rejects invalid profile data", async () => {
    const response = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${reader.token}`)
      .send({
        username: "bad username!",
      });

    expect(response.status).toBe(400);
  });
});
