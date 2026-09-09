import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
const app = createApp();
const password = "Somi-content-password-123";
const created = {
    users: [],
    books: [],
    chapters: [],
};
const cookieValue = (response) => {
    const cookies = response.headers["set-cookie"];
    const cookie = cookies?.find((value) => value.startsWith("somi_refresh_token="));
    return cookie?.split(";")[0].split("=")[1];
};
const createUser = async (role = "WRITER") => {
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
        refreshToken: cookieValue(register),
    };
};
describe("Phase 7C content lifecycle", () => {
    beforeAll(async () => {
        await prisma.$queryRaw `SELECT 1`;
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
        expect(publicList.body.books.some((book) => book.id === createResponse.body.book.id)).toBe(false);
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
        const publicChapter = await request(app).get(`/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`);
        expect(publicChapter.status).toBe(404);
        const admin = await createUser("ADMIN");
        const publish = await request(app)
            .patch(`/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`)
            .set("Authorization", `Bearer ${admin.accessToken}`)
            .send({ status: "PUBLISHED" });
        expect(publish.status).toBe(200);
        expect(publish.body.chapter.status).toBe("PUBLISHED");
        const published = await request(app).get(`/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`);
        expect(published.status).toBe(200);
        expect(published.body.chapter.title).toBe("First Chapter");
        const otherUser = await createUser("WRITER");
        const forbidden = await request(app)
            .patch(`/api/v1/books/${createBook.body.book.id}/chapters/${createChapter.body.chapter.id}`)
            .set("Authorization", `Bearer ${otherUser.accessToken}`)
            .send({ title: "Hacked" });
        expect(forbidden.status).toBe(403);
    });
    it("creates every new chapter as an owner-scoped draft and ignores client lifecycle status", async () => {
        const writer = await createUser("WRITER");
        const createBook = await request(app)
            .post("/api/v1/books")
            .set("Authorization", `Bearer ${writer.accessToken}`)
            .send({
            title: "Chapter Creation Integrity Book",
            slug: `chapter-integrity-${randomUUID()}`,
            synopsis: "Book used for chapter creation acceptance testing.",
            genres: [],
            tags: [],
        });
        expect(createBook.status).toBe(201);
        const bookId = createBook.body.book.id;
        created.books.push(bookId);
        const createChapter = await request(app)
            .post(`/api/v1/books/${bookId}/chapters`)
            .set("Authorization", `Bearer ${writer.accessToken}`)
            .send({
            title: "Protected First Chapter",
            number: 1,
            content: "This chapter must remain a draft regardless of any lifecycle value supplied by the client.",
            // Malicious client attempt:
            status: "PUBLISHED",
        });
        expect(createChapter.status).toBe(201);
        const chapter = createChapter.body.chapter;
        created.chapters.push(chapter.id);
        expect(chapter.bookId).toBe(bookId);
        expect(chapter.status).toBe("DRAFT");
        const persisted = await prisma.chapter.findUnique({
            where: { id: chapter.id },
            select: {
                id: true,
                bookId: true,
                title: true,
                number: true,
                status: true,
                publishedAt: true,
                accessType: true,
                price: true,
                wordCount: true,
                readingTime: true,
            },
        });
        expect(persisted).not.toBeNull();
        expect(persisted?.bookId).toBe(bookId);
        expect(persisted?.title).toBe("Protected First Chapter");
        expect(persisted?.number).toBe(1);
        expect(persisted?.status).toBe("DRAFT");
        expect(persisted?.publishedAt).toBeNull();
        expect(persisted?.accessType).toBe("FREE");
        expect(persisted?.price).toBe(0);
        expect(persisted?.wordCount).toBeGreaterThan(0);
        expect(persisted?.readingTime).toBeGreaterThanOrEqual(1);
        const persistedBook = await prisma.book.findUnique({
            where: { id: bookId },
            select: {
                id: true,
                authorId: true,
                totalChapters: true,
            },
        });
        expect(persistedBook).not.toBeNull();
        expect(persistedBook?.authorId).toBe(writer.userId);
        expect(persistedBook?.totalChapters).toBe(1);
        const publicChapter = await request(app).get(`/api/v1/books/${bookId}/chapters/${chapter.id}`);
        expect(publicChapter.status).toBe(404);
        const ownerChapter = await request(app)
            .get(`/api/v1/books/${bookId}/chapters/${chapter.id}`)
            .set("Authorization", `Bearer ${writer.accessToken}`);
        expect(ownerChapter.status).toBe(200);
        expect(ownerChapter.body.chapter.id).toBe(chapter.id);
        expect(ownerChapter.body.chapter.bookId).toBe(bookId);
        expect(ownerChapter.body.chapter.status).toBe("DRAFT");
    });
    it("creates every new book as an owner-scoped draft and ignores client lifecycle status", async () => {
        const writer = await createUser("WRITER");
        const slug = `protected-book-${randomUUID()}`;
        const response = await request(app)
            .post("/api/v1/books")
            .set("Authorization", `Bearer ${writer.accessToken}`)
            .send({
            title: "Protected Lifecycle Book",
            slug,
            synopsis: "Lifecycle must be server controlled.",
            genres: [],
            tags: [],
            // Malicious client attempt:
            status: "PUBLISHED",
        });
        expect(response.status).toBe(201);
        const book = response.body.book;
        created.books.push(book.id);
        // Ownership must come from the authenticated principal.
        expect(book.authorId).toBe(writer.userId);
        // Publication state must never come from the client.
        expect(book.status).toBe("DRAFT");
        // Verify the actual persisted database state.
        const persisted = await prisma.book.findUnique({
            where: { id: book.id },
            select: {
                id: true,
                authorId: true,
                title: true,
                slug: true,
                status: true,
                publishedAt: true,
            },
        });
        expect(persisted).not.toBeNull();
        expect(persisted?.authorId).toBe(writer.userId);
        expect(persisted?.title).toBe("Protected Lifecycle Book");
        expect(persisted?.slug).toBe(slug);
        expect(persisted?.status).toBe("DRAFT");
        expect(persisted?.publishedAt).toBeNull();
        // Draft must not leak through the public API.
        const publicDetail = await request(app).get(`/api/v1/books/${book.id}`);
        expect(publicDetail.status).toBe(404);
        // Owner must be able to retrieve the draft.
        const ownerDetail = await request(app)
            .get(`/api/v1/books/${book.id}`)
            .set("Authorization", `Bearer ${writer.accessToken}`);
        expect(ownerDetail.status).toBe(200);
        expect(ownerDetail.body.book.id).toBe(book.id);
        expect(ownerDetail.body.book.authorId).toBe(writer.userId);
        expect(ownerDetail.body.book.status).toBe("DRAFT");
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
            .send({ title: "Updated Book Title" });
        expect(allowedUpdate.status).toBe(200);
        expect(allowedUpdate.body.book.title).toBe("Updated Book Title");
        expect(allowedUpdate.body.book.status).toBe("DRAFT");
        const lifecycleUpdate = await request(app)
            .patch(`/api/v1/books/${book.body.book.id}`)
            .set("Authorization", `Bearer ${writerA.accessToken}`)
            .send({ status: "UNPUBLISHED" });
        expect(lifecycleUpdate.status).toBe(409);
    });
    it("prevents a writer from creating a chapter inside another writer's book", async () => {
        const writerA = await createUser("WRITER");
        const writerB = await createUser("WRITER");
        const createBook = await request(app)
            .post("/api/v1/books")
            .set("Authorization", `Bearer ${writerA.accessToken}`)
            .send({
            title: "Writer A Private Book",
            slug: `writer-a-private-${randomUUID()}`,
            genres: [],
            tags: [],
        });
        expect(createBook.status).toBe(201);
        const bookId = createBook.body.book.id;
        created.books.push(bookId);
        const attack = await request(app)
            .post(`/api/v1/books/${bookId}/chapters`)
            .set("Authorization", `Bearer ${writerB.accessToken}`)
            .send({
            title: "Unauthorized Chapter",
            number: 1,
            content: "Writer B must not be able to create content in Writer A's book.",
        });
        expect(attack.status).toBe(403);
        const chapters = await prisma.chapter.findMany({
            where: { bookId },
            select: { id: true },
        });
        expect(chapters).toHaveLength(0);
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: { totalChapters: true },
        });
        expect(book?.totalChapters).toBe(0);
    });
});
