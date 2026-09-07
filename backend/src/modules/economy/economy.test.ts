import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import {
  creditWalletFromTrustedPayment,
  getCoinsForCustomPurchase,
} from "./economy.service.js";

const app = createApp();
const password = "Somi-economy-password-123";
const createdUsers: string[] = [];
const createdBooks: string[] = [];

const createReader = async () => {
  const email = `reader-${randomUUID()}@example.test`;
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password, name: "Economy Reader" });
  expect(response.status).toBe(201);
  createdUsers.push(response.body.user.id);
  return {
    userId: response.body.user.id,
    accessToken: response.body.accessToken,
  };
};

const createPremiumChapter = async (ownerId: string) => {
  const book = await prisma.book.create({
    data: {
      authorId: ownerId,
      title: "Economy Book",
      slug: `economy-${randomUUID()}`,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  createdBooks.push(book.id);
  return prisma.chapter.create({
    data: {
      bookId: book.id,
      number: 1,
      title: "Premium Chapter",
      content: "Premium content that must remain protected.",
      accessType: "PREMIUM",
      price: 120,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
};

describe("Phase 7E economy integration", () => {
  beforeEach(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    await prisma.chapter
      .deleteMany({ where: { bookId: { in: createdBooks } } })
      .catch(() => undefined);
    await prisma.book
      .deleteMany({ where: { id: { in: createdBooks } } })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({ where: { id: { in: createdUsers } } })
      .catch(() => undefined);
    await prisma.$disconnect();
  });

  it("returns an isolated persisted wallet and rejects unauthenticated access", async () => {
    const reader = await createReader();
    const unauthenticated = await request(app).get("/api/v1/wallet");
    expect(unauthenticated.status).toBe(401);

    const first = await request(app)
      .get("/api/v1/wallet")
      .set("Authorization", `Bearer ${reader.accessToken}`);
    expect(first.status).toBe(200);
    expect(first.body.wallet.balance).toBe(0);

    await creditWalletFromTrustedPayment({
      userId: reader.userId,
      packageId: "starter",
      providerReference: `payment-${randomUUID()}`,
      verified: true,
    });
    const second = await request(app)
      .get("/api/v1/wallet")
      .set("Authorization", `Bearer ${reader.accessToken}`);
    expect(second.body.wallet.balance).toBe(3150);
  });

  it("uses exact package pricing, integer-safe custom pricing, and payment idempotency", async () => {
    expect(getCoinsForCustomPurchase(100)).toBe(680);
    expect(getCoinsForCustomPurchase(175)).toBe(1190);

    const reader = await createReader();
    const reference = `payment-${randomUUID()}`;
    await creditWalletFromTrustedPayment({
      userId: reader.userId,
      packageId: "plus",
      providerReference: reference,
      verified: true,
    });
    await creditWalletFromTrustedPayment({
      userId: reader.userId,
      packageId: "plus",
      providerReference: reference,
      verified: true,
    });
    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: reader.userId },
    });
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: reader.userId },
    });
    expect(wallet.balance).toBe(8000);
    expect(transactions).toHaveLength(1);
    await expect(
      creditWalletFromTrustedPayment({
        userId: reader.userId,
        amountCfa: 99,
        providerReference: `payment-${randomUUID()}`,
        verified: true,
      }),
    ).rejects.toMatchObject({ code: "INVALID_PURCHASE_AMOUNT" });
    await expect(
      creditWalletFromTrustedPayment({
        userId: reader.userId,
        packageId: "starter",
        providerReference: `payment-${randomUUID()}`,
        verified: false as true,
      }),
    ).rejects.toMatchObject({ code: "UNVERIFIED_PAYMENT" });
  });

  it("unlocks at the persisted chapter price, records the ledger, and is idempotent", async () => {
    const reader = await createReader();
    const chapter = await createPremiumChapter(reader.userId);
    await creditWalletFromTrustedPayment({
      userId: reader.userId,
      packageId: "starter",
      providerReference: `payment-${randomUUID()}`,
      verified: true,
    });

    const first = await request(app)
      .post(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/unlock`)
      .set("Authorization", `Bearer ${reader.accessToken}`)
      .send({ price: 1, coins: 1 });
    expect(first.status).toBe(200);
    expect(first.body.balance).toBe(3030);

    const second = await request(app)
      .post(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/unlock`)
      .set("Authorization", `Bearer ${reader.accessToken}`)
      .send({ price: 1, coins: 1 });
    expect(second.body.alreadyUnlocked).toBe(true);

    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: reader.userId },
    });
    const debit = await prisma.walletTransaction.findMany({
      where: { userId: reader.userId, type: "CHAPTER_UNLOCK" },
    });
    const entitlement = await prisma.chapterEntitlement.findUnique({
      where: {
        userId_chapterId: { userId: reader.userId, chapterId: chapter.id },
      },
    });
    expect(wallet.balance).toBe(3030);
    expect(debit).toHaveLength(1);
    expect(debit[0].amount).toBe(-120);
    expect(
      debit[0].metadata as { balanceBefore: number; balanceAfter: number },
    ).toEqual({ balanceBefore: 3150, balanceAfter: 3030 });
    expect(entitlement).not.toBeNull();
  });

  it("protects insufficient funds, IDOR, and concurrent duplicate unlocks", async () => {
    const readerA = await createReader();
    const readerB = await createReader();
    const chapter = await createPremiumChapter(readerA.userId);
    await prisma.wallet.upsert({
      where: { userId: readerA.userId },
      create: { userId: readerA.userId, balance: 120 },
      update: { balance: 120 },
    });
    await prisma.wallet.upsert({
      where: { userId: readerB.userId },
      create: { userId: readerB.userId, balance: 120 },
      update: { balance: 120 },
    });

    const [one, two] = await Promise.all([
      request(app)
        .post(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/unlock`)
        .set("Authorization", `Bearer ${readerA.accessToken}`)
        .send({}),
      request(app)
        .post(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/unlock`)
        .set("Authorization", `Bearer ${readerA.accessToken}`)
        .send({}),
    ]);
    expect(
      [one.status, two.status].every(
        (status) => status === 200 || status === 409,
      ),
    ).toBe(true);
    const entitlementCount = await prisma.chapterEntitlement.count({
      where: { userId: readerA.userId, chapterId: chapter.id },
    });
    const debitCount = await prisma.walletTransaction.count({
      where: { userId: readerA.userId, type: "CHAPTER_UNLOCK" },
    });
    const readerAWallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: readerA.userId },
    });
    expect(entitlementCount).toBe(1);
    expect(readerAWallet.balance).toBe(0);
    expect(debitCount).toBe(1);

    const readerBWallet = await request(app)
      .get("/api/v1/wallet")
      .set("Authorization", `Bearer ${readerB.accessToken}`);
    expect(readerBWallet.body.wallet.balance).toBe(120);
    const forbiddenEntitlement = await request(app)
      .get(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/entitlement`)
      .set("Authorization", `Bearer ${readerB.accessToken}`);
    expect(forbiddenEntitlement.body.entitled).toBe(false);
  });
});
