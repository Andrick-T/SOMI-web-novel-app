import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import {
  createPaymentIntent,
  getCoinsForCustomPurchase,
  handleVerifiedCinetPayEvent,
} from "./economy.service.js";
import { COIN_PACKAGES, type CoinPackageId } from "./economy.rules.js";

const app = createApp();
const password = "Somi-economy-password-123";
const createdUsers: string[] = [];
const createdBooks: string[] = [];

const createReader = async () => {
  const email = `reader-${randomUUID()}@example.test`;

  const response = await request(app).post("/api/v1/auth/register").send({
    email,
    password,
    name: "Economy Reader",
  });

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

/**
 * Simulates the trusted payment lifecycle without bypassing the
 * production payment flow:
 *
 * createPaymentIntent
 * → Payment PENDING
 * → CinetPay PENDING verification
 * → PROCESSING
 * → CinetPay ACCEPTED verification
 * → SUCCESS
 * → wallet credit
 * → COIN_PURCHASE ledger transaction
 */
const completePackagePayment = async (
  userId: string,
  packageId: CoinPackageId,
) => {
  const intent = await createPaymentIntent(userId, packageId);
  const packageConfig = COIN_PACKAGES[packageId];

  const providerReference = `cinetpay-${randomUUID()}`;

  const processing = await handleVerifiedCinetPayEvent({
    somiReference: intent.somiReference,
    providerReference,
    status: "PENDING",
    amount: packageConfig.amountCfa,
    currency: "XAF",
    paymentMethod: "ORANGE_MONEY",
    verifiedAt: new Date(),
  });

  expect(processing.status).toBe("PROCESSING");

  const accepted = await handleVerifiedCinetPayEvent({
    somiReference: intent.somiReference,
    providerReference,
    status: "ACCEPTED",
    amount: packageConfig.amountCfa,
    currency: "XAF",
    paymentMethod: "ORANGE_MONEY",
    verifiedAt: new Date(),
  });

  return {
    intent,
    processing,
    accepted,
    providerReference,
  };
};

describe("Phase 14 economy integration", () => {
  beforeEach(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    await prisma.chapter
      .deleteMany({
        where: { bookId: { in: createdBooks } },
      })
      .catch(() => undefined);

    await prisma.book
      .deleteMany({
        where: { id: { in: createdBooks } },
      })
      .catch(() => undefined);

    await prisma.user
      .deleteMany({
        where: { id: { in: createdUsers } },
      })
      .catch(() => undefined);

    await prisma.$disconnect();
  });

  it("returns an isolated persisted wallet, rejects unauthenticated access, and credits only after verified settlement", async () => {
    const reader = await createReader();

    const unauthenticated = await request(app).get("/api/v1/wallet");

    expect(unauthenticated.status).toBe(401);

    const first = await request(app)
      .get("/api/v1/wallet")
      .set("Authorization", `Bearer ${reader.accessToken}`);

    expect(first.status).toBe(200);
    expect(first.body.wallet.balance).toBe(0);

    const payment = await createPaymentIntent(reader.userId, "starter");

    const pendingWallet = await request(app)
      .get("/api/v1/wallet")
      .set("Authorization", `Bearer ${reader.accessToken}`);

    expect(pendingWallet.status).toBe(200);
    expect(pendingWallet.body.wallet.balance).toBe(0);

    await handleVerifiedCinetPayEvent({
      somiReference: payment.somiReference,
      providerReference: `cinetpay-${randomUUID()}`,
      status: "ACCEPTED",
      amount: COIN_PACKAGES.starter.amountCfa,
      currency: "XAF",
      paymentMethod: "ORANGE_MONEY",
      verifiedAt: new Date(),
    });

    const second = await request(app)
      .get("/api/v1/wallet")
      .set("Authorization", `Bearer ${reader.accessToken}`);

    expect(second.status).toBe(200);
    expect(second.body.wallet.balance).toBe(525);

    const walletTransaction = await prisma.walletTransaction.findFirstOrThrow({
      where: {
        userId: reader.userId,
        type: "COIN_PURCHASE",
      },
    });

    expect(walletTransaction.coins).toBe(525);
    expect(walletTransaction.paymentId).toBe(payment.paymentId);
  });

  it("uses exact package pricing, integer-safe custom pricing, and payment idempotency", async () => {
    expect(getCoinsForCustomPurchase(125)).toBe(525);
    expect(getCoinsForCustomPurchase(175)).toBe(735);

    const reader = await createReader();

    const payment = await completePackagePayment(reader.userId, "plus");

    expect(payment.intent.amount).toBe(425);
    expect(payment.intent.currency).toBe("XAF");
    expect(payment.intent.coins).toBe(1785);
    expect(payment.accepted.status).toBe("SUCCESS");

    const duplicate = await handleVerifiedCinetPayEvent({
      somiReference: payment.intent.somiReference,
      providerReference: payment.providerReference,
      status: "ACCEPTED",
      amount: COIN_PACKAGES.plus.amountCfa,
      currency: "XAF",
      paymentMethod: "ORANGE_MONEY",
      verifiedAt: new Date(),
    });

    expect(duplicate.status).toBe("SUCCESS");

    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: reader.userId },
    });

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        userId: reader.userId,
        type: "COIN_PURCHASE",
      },
    });

    const persistedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.intent.paymentId },
    });

    expect(wallet.balance).toBe(1785);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].paymentId).toBe(payment.intent.paymentId);
    expect(persistedPayment.status).toBe("SUCCESS");
  });

  it("rejects invalid verified payment data without crediting the wallet", async () => {
    const reader = await createReader();
    const payment = await createPaymentIntent(reader.userId, "starter");

    await expect(
      handleVerifiedCinetPayEvent({
        somiReference: payment.somiReference,
        providerReference: `cinetpay-${randomUUID()}`,
        status: "ACCEPTED",
        amount: 999,
        currency: "XAF",
        paymentMethod: "ORANGE_MONEY",
        verifiedAt: new Date(),
      }),
    ).rejects.toMatchObject({
      code: "PAYMENT_AMOUNT_MISMATCH",
    });

    await expect(
      handleVerifiedCinetPayEvent({
        somiReference: payment.somiReference,
        providerReference: `cinetpay-${randomUUID()}`,
        status: "ACCEPTED",
        amount: COIN_PACKAGES.starter.amountCfa,
        currency: "EUR",
        paymentMethod: "ORANGE_MONEY",
        verifiedAt: new Date(),
      }),
    ).rejects.toMatchObject({
      code: "PAYMENT_AMOUNT_MISMATCH",
    });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: reader.userId },
    });

    expect(wallet).toBeNull();

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: reader.userId },
    });

    expect(transactions).toHaveLength(0);
  });

  it("marks refused payments as failed without crediting the wallet", async () => {
    const reader = await createReader();

    const payment = await createPaymentIntent(reader.userId, "starter");

    const result = await handleVerifiedCinetPayEvent({
      somiReference: payment.somiReference,
      providerReference: `cinetpay-${randomUUID()}`,
      status: "REFUSED",
      amount: COIN_PACKAGES.starter.amountCfa,
      currency: "XAF",
      paymentMethod: "ORANGE_MONEY",
      verifiedAt: new Date(),
    });

    expect(result.status).toBe("FAILED");

    const persistedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.paymentId },
    });

    expect(persistedPayment.status).toBe("FAILED");

    const wallet = await prisma.wallet.findUnique({
      where: { userId: reader.userId },
    });

    expect(wallet).toBeNull();

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: reader.userId },
    });

    expect(transactions).toHaveLength(0);
  });

  it("unlocks at the persisted chapter price, records the ledger, and is idempotent", async () => {
    const reader = await createReader();
    const chapter = await createPremiumChapter(reader.userId);

    await completePackagePayment(reader.userId, "starter");

    const first = await request(app)
      .post(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/unlock`)
      .set("Authorization", `Bearer ${reader.accessToken}`)
      .send({
        price: 1,
        coins: 1,
      });

    expect(first.status).toBe(200);
    expect(first.body.balance).toBe(405);

    const second = await request(app)
      .post(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/unlock`)
      .set("Authorization", `Bearer ${reader.accessToken}`)
      .send({
        price: 1,
        coins: 1,
      });

    expect(second.status).toBe(200);
    expect(second.body.alreadyUnlocked).toBe(true);

    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: reader.userId },
    });

    const debit = await prisma.walletTransaction.findMany({
      where: {
        userId: reader.userId,
        type: "CHAPTER_UNLOCK",
      },
    });

    const entitlement = await prisma.chapterEntitlement.findUnique({
      where: {
        userId_chapterId: {
          userId: reader.userId,
          chapterId: chapter.id,
        },
      },
    });

    expect(wallet.balance).toBe(405);
    expect(debit).toHaveLength(1);
    expect(debit[0].amount).toBe(-120);
    expect(debit[0].coins).toBe(-120);

    expect(
      debit[0].metadata as {
        balanceBefore: number;
        balanceAfter: number;
      },
    ).toEqual({
      balanceBefore: 525,
      balanceAfter: 405,
    });

    expect(entitlement).not.toBeNull();
  });

  it("protects insufficient funds, IDOR, and concurrent duplicate unlocks", async () => {
    const readerA = await createReader();
    const readerB = await createReader();
    const chapter = await createPremiumChapter(readerA.userId);

    await prisma.wallet.upsert({
      where: { userId: readerA.userId },
      create: {
        userId: readerA.userId,
        balance: 120,
      },
      update: {
        balance: 120,
      },
    });

    await prisma.wallet.upsert({
      where: { userId: readerB.userId },
      create: {
        userId: readerB.userId,
        balance: 120,
      },
      update: {
        balance: 120,
      },
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
      where: {
        userId: readerA.userId,
        chapterId: chapter.id,
      },
    });

    const debitCount = await prisma.walletTransaction.count({
      where: {
        userId: readerA.userId,
        type: "CHAPTER_UNLOCK",
      },
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

    expect(readerBWallet.status).toBe(200);
    expect(readerBWallet.body.wallet.balance).toBe(120);

    const forbiddenEntitlement = await request(app)
      .get(`/api/v1/books/${chapter.bookId}/chapters/${chapter.id}/entitlement`)
      .set("Authorization", `Bearer ${readerB.accessToken}`);

    expect(forbiddenEntitlement.status).toBe(200);
    expect(forbiddenEntitlement.body.entitled).toBe(false);
  });
});
