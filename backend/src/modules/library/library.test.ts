import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import { createAccessToken, hashPassword } from "../auth/auth.crypto.js";

const app = createApp();
const passwordHash = await hashPassword("phase7d-test-password");
const ids = {
  users: [] as string[],
  books: [] as string[],
  chapters: [] as string[],
};
let readerA: { id: string; token: string };
let readerB: { id: string; token: string };
let bookA: { id: string };
let bookB: { id: string };
let chapterA: { id: string };
let chapterB: { id: string };

const createUser = async () => {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@phase7d.test`,
      username: `phase7d-${randomUUID()}`,
      passwordHash,
      role: "READER",
      status: "ACTIVE",
    },
  });
  ids.users.push(user.id);
  return { id: user.id, token: createAccessToken(user.id, user.role) };
};

describe("Phase 7D library and reading progress API", () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    readerA = await createUser();
    readerB = await createUser();
    bookA = await prisma.book.create({
      data: {
        authorId: readerA.id,
        title: "Phase 7D Book A",
        slug: `phase7d-a-${randomUUID()}`,
        status: "PUBLISHED",
      },
    });
    bookB = await prisma.book.create({
      data: {
        authorId: readerA.id,
        title: "Phase 7D Book B",
        slug: `phase7d-b-${randomUUID()}`,
        status: "PUBLISHED",
      },
    });
    ids.books.push(bookA.id, bookB.id);
    chapterA = await prisma.chapter.create({
      data: {
        bookId: bookA.id,
        number: 1,
        title: "A1",
        content: "A",
        status: "PUBLISHED",
      },
    });
    chapterB = await prisma.chapter.create({
      data: {
        bookId: bookB.id,
        number: 1,
        title: "B1",
        content: "B",
        status: "PUBLISHED",
      },
    });
    ids.chapters.push(chapterA.id, chapterB.id);
  });

  afterAll(async () => {
    await prisma.readingProgress.deleteMany({
      where: { userId: { in: ids.users } },
    });
    await prisma.libraryItem.deleteMany({
      where: { userId: { in: ids.users } },
    });
    await prisma.chapter.deleteMany({ where: { id: { in: ids.chapters } } });
    await prisma.book.deleteMany({ where: { id: { in: ids.books } } });
    await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
    await prisma.$disconnect();
  });

  it("requires authentication and validates progress input", async () => {
    expect((await request(app).get("/api/v1/library")).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/v1/books/not-a-uuid/reading-progress")
          .set("Authorization", `Bearer ${readerA.token}`)
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(
            `/api/v1/books/${bookA.id}/chapters/${chapterA.id}/reading-progress`,
          )
          .set("Authorization", `Bearer ${readerA.token}`)
          .send({ progressPercent: 101, position: 0 })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(
            `/api/v1/books/${bookA.id}/chapters/${chapterA.id}/reading-progress`,
          )
          .set("Authorization", `Bearer ${readerA.token}`)
          .send({ progressPercent: 10, position: -1 })
      ).status,
    ).toBe(400);
  });

  it("persists idempotent library membership and isolates users", async () => {
    const first = await request(app)
      .post(`/api/v1/library/${bookA.id}`)
      .set("Authorization", `Bearer ${readerA.token}`);
    const second = await request(app)
      .post(`/api/v1/library/${bookA.id}`)
      .set("Authorization", `Bearer ${readerA.token}`);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(
      await prisma.libraryItem.count({
        where: { userId: readerA.id, bookId: bookA.id },
      }),
    ).toBe(1);
    expect(
      (
        await request(app)
          .get("/api/v1/library")
          .set("Authorization", `Bearer ${readerB.token}`)
      ).body.items,
    ).toHaveLength(0);
    expect(
      (
        await request(app)
          .delete(`/api/v1/library/${bookA.id}`)
          .set("Authorization", `Bearer ${readerA.token}`)
      ).status,
    ).toBe(204);
    expect(
      await prisma.book.findUnique({ where: { id: bookA.id } }),
    ).not.toBeNull();
  });

  it("persists, retrieves, isolates, and rejects cross-book progress", async () => {
    const auth = { Authorization: `Bearer ${readerA.token}` };
    const saved = await request(app)
      .put(`/api/v1/books/${bookA.id}/chapters/${chapterA.id}/reading-progress`)
      .set(auth)
      .send({
        progressPercent: 42,
        position: 12840,
        updatedAt: "2026-09-04T00:00:00.000Z",
      });
    expect(saved.status).toBe(200);
    expect(saved.body.item).toMatchObject({
      bookId: bookA.id,
      chapterId: chapterA.id,
      progressPercent: 42,
      position: 12840,
    });
    const wrongPair = await request(app)
      .put(`/api/v1/books/${bookA.id}/chapters/${chapterB.id}/reading-progress`)
      .set(auth)
      .send({ progressPercent: 90, position: 9 });
    expect(wrongPair.status).toBe(404);
    expect(
      (
        await request(app)
          .get(`/api/v1/books/${bookA.id}/reading-progress`)
          .set({ Authorization: `Bearer ${readerB.token}` })
      ).body.items,
    ).toHaveLength(0);
    expect(
      (await request(app).get("/api/v1/reading-progress/continue").set(auth))
        .body.item.chapterId,
    ).toBe(chapterA.id);
  });

  it("keeps newer server state over an older client state", async () => {
    const auth = { Authorization: `Bearer ${readerA.token}` };
    await request(app)
      .put(`/api/v1/books/${bookB.id}/chapters/${chapterB.id}/reading-progress`)
      .set(auth)
      .send({
        progressPercent: 80,
        position: 800,
        updatedAt: "2026-09-04T00:10:00.000Z",
      });
    const older = await request(app)
      .put(`/api/v1/books/${bookB.id}/chapters/${chapterB.id}/reading-progress`)
      .set(auth)
      .send({
        progressPercent: 5,
        position: 5,
        updatedAt: "2026-09-04T00:01:00.000Z",
      });
    expect(older.body.item).toMatchObject({
      progressPercent: 80,
      position: 800,
    });
    const newer = await request(app)
      .put(`/api/v1/books/${bookB.id}/chapters/${chapterB.id}/reading-progress`)
      .set(auth)
      .send({
        progressPercent: 90,
        position: 900,
        updatedAt: "2026-09-04T00:20:00.000Z",
      });
    expect(newer.body.item).toMatchObject({
      progressPercent: 90,
      position: 900,
    });
    expect(
      await prisma.readingProgress.findUnique({
        where: {
          userId_bookId_chapterId: {
            userId: readerA.id,
            bookId: bookB.id,
            chapterId: chapterB.id,
          },
        },
      }),
    ).toMatchObject({ progressPercentage: 90, position: 900 });
  });
});
