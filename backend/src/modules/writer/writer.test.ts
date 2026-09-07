import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";

const app = createApp();
const password = "Somi-writer-password-123";
const created = {
  users: [] as string[],
  books: [] as string[],
  chapters: [] as string[],
};

const createWriter = async () => {
  const email = `writer-${randomUUID()}@example.test`;
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password, name: "Writer Test" });
  expect(response.status).toBe(201);
  await prisma.user.update({
    where: { id: response.body.user.id },
    data: { role: "WRITER" },
  });
  created.users.push(response.body.user.id);
  return { id: response.body.user.id, token: response.body.accessToken };
};

const createBook = async (token: string) => {
  const response = await request(app)
    .post("/api/v1/books")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Bilingual Draft",
      slug: `bilingual-${randomUUID()}`,
      genres: [],
      tags: [],
    });
  expect(response.status).toBe(201);
  created.books.push(response.body.book.id);
  return response.body.book;
};

describe("Phase 7F Writer workflow", () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    for (const bookId of created.books)
      await prisma.book
        .delete({ where: { id: bookId } })
        .catch(() => undefined);
    for (const userId of created.users)
      await prisma.user
        .delete({ where: { id: userId } })
        .catch(() => undefined);
    await prisma.$disconnect();
  });

  it("isolates localizations and rejects incomplete bilingual submissions", async () => {
    const writerA = await createWriter();
    const writerB = await createWriter();
    const book = await createBook(writerA.token);
    const chapterResponse = await request(app)
      .post(`/api/v1/books/${book.id}/chapters`)
      .set("Authorization", `Bearer ${writerA.token}`)
      .send({ title: "Chapter One", number: 1, content: "English content" });
    expect(chapterResponse.status).toBe(201);
    const chapterId = chapterResponse.body.chapter.id;
    created.chapters.push(chapterId);

    const forbidden = await request(app)
      .get(`/api/v1/writer/books/${book.id}/localizations`)
      .set("Authorization", `Bearer ${writerB.token}`);
    expect(forbidden.status).toBe(403);
    for (const languageCode of ["en", "fr"] as const) {
      const localization = await request(app)
        .patch(`/api/v1/writer/books/${book.id}/localizations/${languageCode}`)
        .set("Authorization", `Bearer ${writerA.token}`)
        .send({
          languageCode,
          title: `${languageCode} title`,
        });

      expect(localization.status).toBe(200);

      const ready = await request(app)
        .post(
          `/api/v1/writer/books/${book.id}/localizations/${languageCode}/ready`,
        )
        .set("Authorization", `Bearer ${writerA.token}`);

      expect(ready.status).toBe(200);
      expect(ready.body.localization.status).toBe("READY_FOR_SUBMISSION");
    }

    const incomplete = await request(app)
      .post(`/api/v1/writer/books/${book.id}/submit`)
      .set("Authorization", `Bearer ${writerA.token}`);
    expect(incomplete.status).toBe(422);
    expect(incomplete.body.error.code).toBe("LOCALIZATION_INCOMPLETE");
  });

  it("persists autosave and rejects stale versions", async () => {
    const writer = await createWriter();
    const book = await createBook(writer.token);
    const chapterResponse = await request(app)
      .post(`/api/v1/books/${book.id}/chapters`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({ title: "Autosave", number: 1, content: "Initial" });
    const chapterId = chapterResponse.body.chapter.id;
    created.chapters.push(chapterId);

    const saved = await request(app)
      .patch(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/autosave`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({
        languageCode: "en",
        title: "Updated",
        content: "**formatted**",
        clientVersion: 0,
      });
    expect(saved.status).toBe(200);

    const stale = await request(app)
      .patch(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/autosave`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({
        languageCode: "en",
        title: "Stale",
        content: "stale",
        clientVersion: 0,
      });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("AUTOSAVE_CONFLICT");
  });

  it("scopes the profile to the session and stores a real binary asset", async () => {
    const writerA = await createWriter();
    const writerB = await createWriter();
    const book = await createBook(writerA.token);
    const chapterResponse = await request(app)
      .post(`/api/v1/books/${book.id}/chapters`)
      .set("Authorization", `Bearer ${writerA.token}`)
      .send({ title: "Illustrated", number: 1, content: "Image chapter" });
    const chapterId = chapterResponse.body.chapter.id;
    created.chapters.push(chapterId);

    const profile = await request(app)
      .patch("/api/v1/writer/profile")
      .set("Authorization", `Bearer ${writerA.token}`)
      .send({ displayName: "Writer A", bio: "Own profile" });
    expect(profile.status).toBe(200);
    expect(profile.body.profile.userId).toBe(writerA.id);

    const png = Buffer.from("89504e470d0a1a0a", "hex");
    const upload = await request(app)
      .post(
        `/api/v1/writer/books/${book.id}/chapters/${chapterId}/assets/upload`,
      )
      .set("Authorization", `Bearer ${writerA.token}`)
      .set("Content-Type", "image/png")
      .set("X-Asset-Alt-Text", "A small illustration")
      .send(png);
    expect(upload.status).toBe(201);
    expect(upload.body.asset.writerId).toBe(writerA.id);
    expect(upload.body.asset.storageKey).toMatch(/^writer\//);

    const foreignRead = await request(app)
      .get(`/api/v1/writer/assets/${upload.body.asset.id}`)
      .set("Authorization", `Bearer ${writerB.token}`);
    expect(foreignRead.status).toBe(403);

    const read = await request(app)
      .get(`/api/v1/writer/assets/${upload.body.asset.id}`)
      .set("Authorization", `Bearer ${writerA.token}`);
    expect(read.status).toBe(200);
    expect(read.headers["content-type"]).toContain("image/png");
    expect(Buffer.from(read.body).equals(png)).toBe(true);

    const svg = await request(app)
      .post(
        `/api/v1/writer/books/${book.id}/chapters/${chapterId}/assets/upload`,
      )
      .set("Authorization", `Bearer ${writerA.token}`)
      .set("Content-Type", "image/svg+xml")
      .set("X-Asset-Alt-Text", "Unsupported SVG")
      .send("<svg></svg>");
    expect(svg.status).toBe(400);
    expect(svg.body.error.code).toBe("INVALID_IMAGE");

    const malformed = await request(app)
      .post(
        `/api/v1/writer/books/${book.id}/chapters/${chapterId}/assets/upload`,
      )
      .set("Authorization", `Bearer ${writerA.token}`)
      .set("Content-Type", "image/png")
      .set("X-Asset-Alt-Text", "Malformed")
      .send(Buffer.from("not-a-png"));
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe("INVALID_IMAGE");
  });

  it("rejects direct publication and accepts a reviewed bilingual submission", async () => {
    const writer = await createWriter();
    const book = await createBook(writer.token);
    const chapterResponse = await request(app)
      .post(`/api/v1/books/${book.id}/chapters`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({
        title: "Submission chapter",
        number: 1,
        content: "English chapter",
      });
    const chapterId = chapterResponse.body.chapter.id;
    created.chapters.push(chapterId);

    const directBook = await request(app)
      .patch(`/api/v1/books/${book.id}`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({ status: "PUBLISHED" });
    expect(directBook.status).toBe(409);

    const directChapter = await request(app)
      .patch(`/api/v1/books/${book.id}/chapters/${chapterId}`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({ status: "PUBLISHED" });
    expect(directChapter.status).toBe(409);
    for (const languageCode of ["en", "fr"] as const) {
      const localization = await request(app)
        .patch(`/api/v1/writer/books/${book.id}/localizations/${languageCode}`)
        .set("Authorization", `Bearer ${writer.token}`)
        .send({
          languageCode,
          title: `${languageCode} title`,
        });

      expect(localization.status).toBe(200);

      const ready = await request(app)
        .post(
          `/api/v1/writer/books/${book.id}/localizations/${languageCode}/ready`,
        )
        .set("Authorization", `Bearer ${writer.token}`);

      expect(ready.status).toBe(200);
      expect(ready.body.localization.status).toBe("READY_FOR_SUBMISSION");
    }
    const translated = await request(app)
      .patch(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/autosave`)
      .set("Authorization", `Bearer ${writer.token}`)
      .send({
        languageCode: "fr",
        title: "Titre",
        content: "Contenu francais",
        contentFormat: "plain-text",
        clientVersion: 0,
      });
    expect(translated.status).toBe(200);
    const ready = await request(app)
      .post(
        `/api/v1/writer/books/${book.id}/chapters/${chapterId}/localizations/fr/ready`,
      )
      .set("Authorization", `Bearer ${writer.token}`);
    expect(ready.status).toBe(200);

    const submission = await request(app)
      .post(`/api/v1/writer/books/${book.id}/submit`)
      .set("Authorization", `Bearer ${writer.token}`);
    expect(submission.status).toBe(201);
    expect(submission.body.submission.status).toBe("SUBMITTED");
  });
});
