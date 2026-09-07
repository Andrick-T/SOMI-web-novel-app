import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";

const app = createApp();
const password = "Somi-content-password-123";
const created: { users: string[]; books: string[]; chapters: string[] } = {
  users: [],
  books: [],
  chapters: [],
};

const cookieValue = (response: request.Response) => {
  const cookies = response.headers["set-cookie"] as unknown as
    | string[]
    | undefined;
  const cookie = cookies?.find((value) =>
    value.startsWith("somi_refresh_token="),
  );
  return cookie?.split(";")[0].split("=")[1];
};

const createUser = async (role: "READER" | "WRITER" | "ADMIN" = "WRITER") => {
  const email = `${role.toLowerCase()}-${randomUUID()}@example.test`;
  const register = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password, name: `${role} Tester` });

  expect(register.status).toBe(201);
  await prisma.user.update({
    where: { id: register.body.user.id },
    data: { role },
  });

  created.users.push(register.body.user.id);
  return {
    userId: register.body.user.id,
    accessToken: register.body.accessToken,
    refreshToken: cookieValue(register)!,
  };
};

describe("Phase 7C content lifecycle", () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    for (const chapterId of created.chapters) {
      await prisma.chapter
        .deleteMany({ where: { id: chapterId } })
        .catch(() => undefined);
    }
    for (const bookId of created.books) {
      await prisma.book
        .deleteMany({ where: { id: bookId } })
        .catch(() => undefined);
    }
    for (const userId of created.users) {
      await prisma.user
        .delete({ where: { id: userId } })
        .catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("creates a book for the authenticated writer and hides drafts publicly", async () => {
    const writer = await createUser("WRITER");

    const createResponse = await request(app)
      .post("/api/v1/books")
      .set("Authorization", `Bearer ${writer.accessToken}`)
      .send({
        title: "Hidden Book",
        slug: `hidden-book-${randomUUID()}`,
        synopsis: "A draft book that should remain private.",
        cover: "https://cdn.example.com/cover.jpg",
        heroImage: "https://cdn.example.com/hero.jpg",
        genres: [],
        tags: [],
      });

    expect(createResponse.status).toBe(201);
    created.books.push(createResponse.body.book.id);
    expect(createResponse.body.book.authorId).toBe(writer.userId);
    expect(createResponse.body.book.status).toBe("DRAFT");

    const publicList = await request(app).get("/api/v1/books");
    expect(publicList.status).toBe(200);
    expect(
      publicList.body.books.some(
        (book: { id: string }) => book.id === createResponse.body.book.id,
      ),
    ).toBe(false);

    const ownBook = await request(app)
      .get(`/api/v1/books/${createResponse.body.book.id}`)
      .set("Authorization", `Bearer ${writer.accessToken}`);
    expect(ownBook.status).toBe(200);
    expect(ownBook.body.book.id).toBe(createResponse.body.book.id);
  });

  it("publishes a chapter only to the owner and rejects cross-book access", async () => {
    const writer = await createUser("WRITER");
    const createBook = await request(app)
      .post("/api/v1/books")
      .set("Authorization", `Bearer ${writer.accessToken}`)
      .send({
        title: "Public Book",
        slug: `public-book-${randomUUID()}`,
        synopsis: "Published book for chapter validation.",
        genres: [],
        tags: [],
      });

    expect(createBook.status).toBe(201);
    created.books.push(createBook.body.book.id);

    const createChapter = await request(app)
      .post(`/api/v1/books/${createBook.body.book.id}/chapters`)
      .set("Authorization", `Bearer ${writer.accessToken}`)
      .send({
        title: "First Chapter",
        number: 1,
        content: "This chapter content is draft by default.",
      });

    expect(createChapter.status).toBe(201);
    created.chapters.push(createChapter.body.chapter.id);
    expect(createChapter.body.chapter.status).toBe("DRAFT");

    const publicChapter = await request(app).get(
      `/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`,
    );
    expect(publicChapter.status).toBe(404);

    const admin = await createUser("ADMIN");
    const publish = await request(app)
      .patch(
        `/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`,
      )
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ status: "PUBLISHED" });
    expect(publish.status).toBe(200);
    expect(publish.body.chapter.status).toBe("PUBLISHED");

    const published = await request(app).get(
      `/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`,
    );
    expect(published.status).toBe(200);
    expect(published.body.chapter.title).toBe("First Chapter");

    const otherUser = await createUser("WRITER");
    const forbidden = await request(app)
      .patch(
        `/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`,
      )
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ title: "Hacked" });
    expect(forbidden.status).toBe(403);
  });

  it("prevents unauthorized updates and enforces book ownership", async () => {
    const writerA = await createUser("WRITER");
    const writerB = await createUser("WRITER");

    const book = await request(app)
      .post("/api/v1/books")
      .set("Authorization", `Bearer ${writerA.accessToken}`)
      .send({
        title: `Owned Book ${randomUUID()}`,
        slug: `owned-book-${randomUUID()}`,
        synopsis: "Should be owned by writer A only.",
        genres: [],
        tags: [],
      });

    expect(book.status).toBe(201);
    created.books.push(book.body.book.id);

    const forbiddenUpdate = await request(app)
      .patch(`/api/v1/books/${book.body.book.id}`)
      .set("Authorization", `Bearer ${writerB.accessToken}`)
      .send({ title: "Stolen title" });
    expect(forbiddenUpdate.status).toBe(403);

    const allowedUpdate = await request(app)
      .patch(`/api/v1/books/${book.body.book.id}`)
      .set("Authorization", `Bearer ${writerA.accessToken}`)
      .send({ title: "Updated Book Title", status: "UNPUBLISHED" });
    expect(allowedUpdate.status).toBe(200);
    expect(allowedUpdate.body.book.title).toBe("Updated Book Title");
    expect(allowedUpdate.body.book.status).toBe("UNPUBLISHED");
  });
});
