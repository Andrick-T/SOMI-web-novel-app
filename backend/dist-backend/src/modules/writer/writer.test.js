import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import { creditWalletFromTrustedPayment } from "../economy/economy.service.js";
const app = createApp();
const password = "Somi-writer-password-123";
const created = {
    users: [],
    books: [],
    chapters: [],
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
const createBook = async (token) => {
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
        await prisma.$queryRaw `SELECT 1`;
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
    it("rejects an intentionally incomplete submission, then accepts a valid one and blocks duplicates", async () => {
        const writerA = await createWriter();
        const writerB = await createWriter();
        const book = await createBook(writerA.token);
        const chapterResponse = await request(app)
            .post(`/api/v1/books/${book.id}/chapters`)
            .set("Authorization", `Bearer ${writerA.token}`)
            .send({
            title: "Chapter One",
            number: 1,
            content: "English content",
        });
        expect(chapterResponse.status).toBe(201);
        const chapterId = chapterResponse.body.chapter.id;
        created.chapters.push(chapterId);
        // Ownership isolation must still hold.
        const forbidden = await request(app)
            .get(`/api/v1/writer/books/${book.id}/localizations`)
            .set("Authorization", `Bearer ${writerB.token}`);
        expect(forbidden.status).toBe(403);
        // Prepare the English book localization.
        const enLocalization = await request(app)
            .patch(`/api/v1/writer/books/${book.id}/localizations/en`)
            .set("Authorization", `Bearer ${writerA.token}`)
            .send({
            languageCode: "en",
            title: "English title",
        });
        expect(enLocalization.status).toBe(200);
        const enReady = await request(app)
            .post(`/api/v1/writer/books/${book.id}/localizations/en/ready`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(enReady.status).toBe(200);
        expect(enReady.body.localization.status).toBe("READY_FOR_SUBMISSION");
        // Prepare the French chapter localization so that the ONLY
        // intentionally invalid prerequisite is the French BOOK localization.
        const frChapter = await request(app)
            .patch(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/autosave`)
            .set("Authorization", `Bearer ${writerA.token}`)
            .send({
            languageCode: "fr",
            title: "Chapitre Un",
            content: "Contenu français",
            contentFormat: "plain-text",
            clientVersion: 0,
        });
        expect(frChapter.status).toBe(200);
        const frChapterReady = await request(app)
            .post(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/localizations/fr/ready`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(frChapterReady.status).toBe(200);
        expect(frChapterReady.body.localization.status).toBe("READY_FOR_SUBMISSION");
        // Deliberately DO NOT create or mark the French BOOK localization
        // as ready. This makes the submission genuinely invalid.
        const submissionsBeforeInvalidAttempt = await prisma.writerSubmission.count({
            where: { bookId: book.id },
        });
        const incomplete = await request(app)
            .post(`/api/v1/writer/books/${book.id}/submit`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(incomplete.status).toBe(422);
        expect(incomplete.body.error.code).toBe("LOCALIZATION_INCOMPLETE");
        // The failed submission must not mutate the book lifecycle.
        const afterInvalidBook = await prisma.book.findUnique({
            where: { id: book.id },
            select: { status: true },
        });
        expect(afterInvalidBook?.status).toBe("DRAFT");
        // The failed submission must not create a submission record.
        const submissionsAfterInvalidAttempt = await prisma.writerSubmission.count({
            where: { bookId: book.id },
        });
        expect(submissionsAfterInvalidAttempt).toBe(submissionsBeforeInvalidAttempt);
        // Now make the fixture genuinely valid.
        const frLocalization = await request(app)
            .patch(`/api/v1/writer/books/${book.id}/localizations/fr`)
            .set("Authorization", `Bearer ${writerA.token}`)
            .send({
            languageCode: "fr",
            title: "Titre français",
        });
        expect(frLocalization.status).toBe(200);
        const frReady = await request(app)
            .post(`/api/v1/writer/books/${book.id}/localizations/fr/ready`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(frReady.status).toBe(200);
        expect(frReady.body.localization.status).toBe("READY_FOR_SUBMISSION");
        // Valid submission must now succeed.
        const submitted = await request(app)
            .post(`/api/v1/writer/books/${book.id}/submit`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(submitted.status).toBe(201);
        const submittedBook = await prisma.book.findUnique({
            where: { id: book.id },
            select: { status: true },
        });
        expect(submittedBook?.status).toBe("SUBMITTED");
        const submissionsAfterValidAttempt = await prisma.writerSubmission.count({
            where: { bookId: book.id },
        });
        expect(submissionsAfterValidAttempt).toBe(1);
        // Duplicate active submission must be rejected.
        const duplicate = await request(app)
            .post(`/api/v1/writer/books/${book.id}/submit`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(duplicate.status).toBe(409);
        expect(duplicate.body.error.code).toBe("INVALID_STATE_TRANSITION");
        // The lifecycle guard rejects resubmission once the book is already SUBMITTED.
        // Most importantly, no second submission record may be created.
        const submissionsAfterDuplicate = await prisma.writerSubmission.count({
            where: { bookId: book.id },
        });
        expect(submissionsAfterDuplicate).toBe(1);
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
    it("persists rich chapter formatting without altering the stored representation", async () => {
        const writer = await createWriter();
        const book = await createBook(writer.token);
        const chapterResponse = await request(app)
            .post(`/api/v1/books/${book.id}/chapters`)
            .set("Authorization", `Bearer ${writer.token}`)
            .send({
            title: "Rich Formatting",
            number: 1,
            content: "Initial chapter content",
        });
        expect(chapterResponse.status).toBe(201);
        const chapterId = chapterResponse.body.chapter.id;
        created.chapters.push(chapterId);
        const richContent = [
            "# Chapter One",
            "",
            "This is **bold**, this is _italic_, and this is `inline code`.",
            "",
            "- First item",
            "- Second item",
            "",
            "> A quoted passage.",
            "",
            "A final paragraph with **nested _formatting_**.",
        ].join("\n");
        const saved = await request(app)
            .patch(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/autosave`)
            .set("Authorization", `Bearer ${writer.token}`)
            .send({
            languageCode: "en",
            title: "Rich Formatting",
            content: richContent,
            contentFormat: "plain-text",
            clientVersion: 0,
        });
        expect(saved.status).toBe(200);
        console.log("RICH AUTOSAVE RESPONSE:", JSON.stringify(saved.body, null, 2));
        expect(saved.body.content).toBe(richContent);
        expect(saved.body.contentVersion).toBe(1);
        const persisted = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: {
                title: true,
                content: true,
                contentVersion: true,
                status: true,
                wordCount: true,
            },
        });
        expect(persisted).not.toBeNull();
        expect(persisted?.title).toBe("Rich Formatting");
        expect(persisted?.content).toBe(richContent);
        expect(persisted?.contentVersion).toBe(1);
        expect(persisted?.status).toBe("DRAFT");
        expect(persisted?.wordCount).toBeGreaterThan(0);
        const reloaded = await request(app)
            .get(`/api/v1/books/${book.id}/chapters/${chapterId}`)
            .set("Authorization", `Bearer ${writer.token}`);
        expect(reloaded.status).toBe(200);
        expect(reloaded.body.chapter.content).toBe(richContent);
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
            .post(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/assets/upload`)
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
            .post(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/assets/upload`)
            .set("Authorization", `Bearer ${writerA.token}`)
            .set("Content-Type", "image/svg+xml")
            .set("X-Asset-Alt-Text", "Unsupported SVG")
            .send("<svg></svg>");
        expect(svg.status).toBe(400);
        expect(svg.body.error.code).toBe("INVALID_IMAGE");
        const malformed = await request(app)
            .post(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/assets/upload`)
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
        for (const languageCode of ["en", "fr"]) {
            const localization = await request(app)
                .patch(`/api/v1/writer/books/${book.id}/localizations/${languageCode}`)
                .set("Authorization", `Bearer ${writer.token}`)
                .send({
                languageCode,
                title: `${languageCode} title`,
            });
            expect(localization.status).toBe(200);
            const ready = await request(app)
                .post(`/api/v1/writer/books/${book.id}/localizations/${languageCode}/ready`)
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
            .post(`/api/v1/writer/books/${book.id}/chapters/${chapterId}/localizations/fr/ready`)
            .set("Authorization", `Bearer ${writer.token}`);
        expect(ready.status).toBe(200);
        const submission = await request(app)
            .post(`/api/v1/writer/books/${book.id}/submit`)
            .set("Authorization", `Bearer ${writer.token}`);
        expect(submission.status).toBe(201);
        expect(submission.body.submission.status).toBe("SUBMITTED");
    });
    it("isolates earnings and earning transactions to the authenticated writer", async () => {
        const writerA = await createWriter();
        const writerB = await createWriter();
        /*
         * Create one book/chapter owned by each writer through the real
         * writer API.
         */
        const bookA = await createBook(writerA.token);
        const bookB = await createBook(writerB.token);
        const chapterAResponse = await request(app)
            .post(`/api/v1/books/${bookA.id}/chapters`)
            .set("Authorization", `Bearer ${writerA.token}`)
            .send({
            title: "Writer A Premium Chapter",
            number: 1,
            content: "Writer A premium content",
        });
        expect(chapterAResponse.status).toBe(201);
        const chapterBResponse = await request(app)
            .post(`/api/v1/books/${bookB.id}/chapters`)
            .set("Authorization", `Bearer ${writerB.token}`)
            .send({
            title: "Writer B Premium Chapter",
            number: 1,
            content: "Writer B premium content",
        });
        expect(chapterBResponse.status).toBe(201);
        const chapterAId = chapterAResponse.body.chapter.id;
        const chapterBId = chapterBResponse.body.chapter.id;
        created.chapters.push(chapterAId, chapterBId);
        /*
         * Promote the fixture content to PUBLISHED/PREMIUM so the real
         * economy unlock endpoint can be exercised.
         *
         * This is fixture preparation only; the earning itself is created
         * through the real wallet -> unlock -> attribution path.
         */
        await prisma.book.update({
            where: { id: bookA.id },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });
        await prisma.book.update({
            where: { id: bookB.id },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });
        await prisma.chapter.update({
            where: { id: chapterAId },
            data: {
                accessType: "PREMIUM",
                price: 120,
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });
        await prisma.chapter.update({
            where: { id: chapterBId },
            data: {
                accessType: "PREMIUM",
                price: 120,
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });
        /*
         * Create a real reader through the authentication API.
         */
        const readerEmail = `earnings-isolation-${Date.now()}@example.test`;
        const readerResponse = await request(app)
            .post("/api/v1/auth/register")
            .send({
            email: readerEmail,
            password: "Somi-earnings-isolation-123",
            name: "Earnings Isolation Reader",
        });
        expect(readerResponse.status).toBe(201);
        const readerId = readerResponse.body.user.id;
        const readerToken = readerResponse.body.accessToken;
        created.users.push(readerId);
        /*
         * Fund the reader through the trusted-payment service.
         */
        await creditWalletFromTrustedPayment({
            userId: readerId,
            packageId: "starter",
            providerReference: `earnings-isolation-payment-${Date.now()}`,
            verified: true,
        });
        /*
         * Real economy flow:
         *
         * reader wallet
         *   -> chapter unlock
         *   -> wallet transaction
         *   -> entitlement
         *   -> writer earning attribution
         *
         * Unlock Writer A's chapter.
         */
        const unlockA = await request(app)
            .post(`/api/v1/books/${bookA.id}/chapters/${chapterAId}/unlock`)
            .set("Authorization", `Bearer ${readerToken}`)
            .send({});
        expect(unlockA.status).toBe(200);
        expect(unlockA.body.alreadyUnlocked).not.toBe(true);
        /*
         * Unlock Writer B's chapter.
         */
        const unlockB = await request(app)
            .post(`/api/v1/books/${bookB.id}/chapters/${chapterBId}/unlock`)
            .set("Authorization", `Bearer ${readerToken}`)
            .send({});
        expect(unlockB.status).toBe(200);
        expect(unlockB.body.alreadyUnlocked).not.toBe(true);
        /*
         * Verify the two earnings were actually attributed to the
         * correct writers before testing the API isolation boundary.
         */
        const databaseEarnings = await prisma.writerEarning.findMany({
            where: {
                chapterId: {
                    in: [chapterAId, chapterBId],
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        expect(databaseEarnings).toHaveLength(2);
        const earningA = databaseEarnings.find((earning) => earning.chapterId === chapterAId);
        const earningB = databaseEarnings.find((earning) => earning.chapterId === chapterBId);
        expect(earningA).toBeDefined();
        expect(earningB).toBeDefined();
        expect(earningA.writerId).toBe(writerA.id);
        expect(earningB.writerId).toBe(writerB.id);
        expect(earningA.coins).toBe(120);
        expect(earningB.coins).toBe(120);
        /*
         * ============================================================
         * Writer A earnings
         * ============================================================
         */
        const writerAEarnings = await request(app)
            .get("/api/v1/writer/earnings")
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(writerAEarnings.status).toBe(200);
        expect(writerAEarnings.body.totalCoins).toBe(120);
        expect(writerAEarnings.body.pendingCoins).toBe(120);
        expect(writerAEarnings.body.availableCoins).toBe(0);
        /*
         * Writer A transaction list must contain only A's earning.
         */
        const writerATransactions = await request(app)
            .get("/api/v1/writer/earnings/transactions")
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(writerATransactions.status).toBe(200);
        expect(writerATransactions.body.transactions).toHaveLength(1);
        expect(writerATransactions.body.transactions[0]).toMatchObject({
            id: earningA.id,
            bookId: bookA.id,
            chapterId: chapterAId,
            coins: 120,
            status: "PENDING",
        });
        expect(writerATransactions.body.transactions.some((transaction) => transaction.id === earningB.id)).toBe(false);
        /*
         * ============================================================
         * Writer B earnings
         * ============================================================
         */
        const writerBEarnings = await request(app)
            .get("/api/v1/writer/earnings")
            .set("Authorization", `Bearer ${writerB.token}`);
        expect(writerBEarnings.status).toBe(200);
        expect(writerBEarnings.body.totalCoins).toBe(120);
        expect(writerBEarnings.body.pendingCoins).toBe(120);
        expect(writerBEarnings.body.availableCoins).toBe(0);
        /*
         * Writer B transaction list must contain only B's earning.
         */
        const writerBTransactions = await request(app)
            .get("/api/v1/writer/earnings/transactions")
            .set("Authorization", `Bearer ${writerB.token}`);
        expect(writerBTransactions.status).toBe(200);
        expect(writerBTransactions.body.transactions).toHaveLength(1);
        expect(writerBTransactions.body.transactions[0]).toMatchObject({
            id: earningB.id,
            bookId: bookB.id,
            chapterId: chapterBId,
            coins: 120,
            status: "PENDING",
        });
        expect(writerBTransactions.body.transactions.some((transaction) => transaction.id === earningA.id)).toBe(false);
        /*
         * ============================================================
         * Query-parameter IDOR attempts
         * ============================================================
         *
         * The endpoint must ignore arbitrary writerId parameters and
         * continue using the authenticated session as the authority.
         */
        const writerAAttack = await request(app)
            .get(`/api/v1/writer/earnings?writerId=${writerB.id}`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(writerAAttack.status).toBe(200);
        expect(writerAAttack.body.totalCoins).toBe(120);
        const writerAAttackTransactions = await request(app)
            .get(`/api/v1/writer/earnings/transactions?writerId=${writerB.id}`)
            .set("Authorization", `Bearer ${writerA.token}`);
        expect(writerAAttackTransactions.status).toBe(200);
        expect(writerAAttackTransactions.body.transactions).toHaveLength(1);
        expect(writerAAttackTransactions.body.transactions[0].id).toBe(earningA.id);
        const writerBAttack = await request(app)
            .get(`/api/v1/writer/earnings?writerId=${writerA.id}`)
            .set("Authorization", `Bearer ${writerB.token}`);
        expect(writerBAttack.status).toBe(200);
        expect(writerBAttack.body.totalCoins).toBe(120);
        const writerBAttackTransactions = await request(app)
            .get(`/api/v1/writer/earnings/transactions?writerId=${writerA.id}`)
            .set("Authorization", `Bearer ${writerB.token}`);
        expect(writerBAttackTransactions.status).toBe(200);
        expect(writerBAttackTransactions.body.transactions).toHaveLength(1);
        expect(writerBAttackTransactions.body.transactions[0].id).toBe(earningB.id);
        /*
         * ============================================================
         * Authentication / role boundaries
         * ============================================================
         */
        const unauthenticated = await request(app).get("/api/v1/writer/earnings");
        expect(unauthenticated.status).toBe(401);
        const readerForbidden = await request(app)
            .get("/api/v1/writer/earnings")
            .set("Authorization", `Bearer ${readerToken}`);
        expect(readerForbidden.status).toBe(403);
        const readerTransactionsForbidden = await request(app)
            .get("/api/v1/writer/earnings/transactions")
            .set("Authorization", `Bearer ${readerToken}`);
        expect(readerTransactionsForbidden.status).toBe(403);
    });
});
