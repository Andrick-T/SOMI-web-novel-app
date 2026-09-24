import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import { createAccessToken } from "../auth/auth.crypto.js";

const app = createApp();

let adminUserId = "";
let readerUserId = "";
let adminToken = "";
let readerToken = "";

beforeAll(async () => {
  const admin = await prisma.user.upsert({
    where: { email: "phase7h-admin@example.test" },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      email: "phase7h-admin@example.test",
      username: "phase7h-admin",
      passwordHash: "placeholder-hash",
      role: "ADMIN",
      status: "ACTIVE",
      profile: {
        create: {
          displayName: "Phase 7H Admin",
        },
      },
    },
    include: { profile: true },
  });

  const reader = await prisma.user.upsert({
    where: { email: "phase7h-reader@example.test" },
    update: {
      role: "READER",
      status: "ACTIVE",
    },
    create: {
      email: "phase7h-reader@example.test",
      username: "phase7h-reader",
      passwordHash: "placeholder-hash",
      role: "READER",
      status: "ACTIVE",
      profile: {
        create: {
          displayName: "Phase 7H Reader",
        },
      },
    },
    include: { profile: true },
  });

  adminUserId = admin.id;
  readerUserId = reader.id;
  adminToken = createAccessToken(admin.id, admin.role);
  readerToken = createAccessToken(reader.id, reader.role);
});

afterAll(async () => {
  await prisma.auditEvent.deleteMany({
    where: {
      actorId: {
        in: [adminUserId, readerUserId],
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: [adminUserId, readerUserId] },
    },
  });

  await prisma.$disconnect();
});

describe("Phase 7H admin foundation read endpoints", () => {
  it("rejects unauthenticated access to admin read endpoints", async () => {
    const dashboard = await request(app).get("/api/v1/admin/dashboard");
    const users = await request(app).get("/api/v1/admin/users");
    const books = await request(app).get("/api/v1/admin/books");
    const writers = await request(app).get("/api/v1/admin/writers");
    const economy = await request(app).get("/api/v1/admin/economy");
    const transactions = await request(app).get("/api/v1/admin/transactions");

    expect(dashboard.status).toBe(401);
    expect(users.status).toBe(401);
    expect(books.status).toBe(401);
    expect(writers.status).toBe(401);
    expect(economy.status).toBe(401);
    expect(transactions.status).toBe(401);
  });

  it("rejects non-admin access to admin read endpoints", async () => {
    const dashboard = await request(app)
      .get("/api/v1/admin/dashboard")
      .set("Authorization", `Bearer ${readerToken}`);

    const users = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${readerToken}`);

    const writers = await request(app)
      .get("/api/v1/admin/writers")
      .set("Authorization", `Bearer ${readerToken}`);

    const economy = await request(app)
      .get("/api/v1/admin/economy")
      .set("Authorization", `Bearer ${readerToken}`);

    const transactions = await request(app)
      .get("/api/v1/admin/transactions")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(dashboard.status).toBe(403);
    expect(users.status).toBe(403);
    expect(writers.status).toBe(403);
    expect(economy.status).toBe(403);
    expect(transactions.status).toBe(403);
  });

  it("returns dashboard and user/book lists to an admin user without sensitive fields", async () => {
    const dashboard = await request(app)
      .get("/api/v1/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body).toHaveProperty("totalUsers");
    expect(dashboard.body).toHaveProperty("needsAttention");
    expect(dashboard.body).toHaveProperty("contentHealth");
    expect(dashboard.body).toHaveProperty("economyHealth");

    const users = await request(app)
      .get("/api/v1/admin/users")
      .query({ page: 1, limit: 20 })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(users.status).toBe(200);
    expect(users.body).toHaveProperty("items");
    expect(users.body).toHaveProperty("pagination");
    expect(users.body.items[0]).not.toHaveProperty("passwordHash");
    expect(users.body.items[0]).not.toHaveProperty("refreshTokenHash");

    const books = await request(app)
      .get("/api/v1/admin/books")
      .query({ page: 1, limit: 10 })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(books.status).toBe(200);
    expect(books.body).toHaveProperty("items");
    expect(books.body).toHaveProperty("pagination");
    expect(books.body.items[0]).not.toHaveProperty("reports");
  });

  it("returns real writer, economy, and transaction data for admins", async () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const writerEmail = `phase7h-admin-writer-${testId}@example.test`;
    const writerUsername = `phase7h-admin-writer-${testId}`;

    const writer = await prisma.user.create({
      data: {
        email: writerEmail,
        username: writerUsername,
        passwordHash: "placeholder-hash",
        role: "WRITER",
        status: "ACTIVE",
        profile: {
          create: {
            displayName: "Phase 7H Writer",
          },
        },
      },
      include: { profile: true },
    });

    const book = await prisma.book.create({
      data: {
        authorId: writer.id,
        title: "Phase 7H Writer Book",
        slug: `phase7h-writer-book-${testId}`,
        synopsis: "Creates a real writer summary record.",
        status: "PUBLISHED",
      },
    });

    const chapter = await prisma.chapter.create({
      data: {
        bookId: book.id,
        number: 1,
        title: "Chapter one",
        content: "Test content",
        wordCount: 2,
        readingTime: 1,
        accessType: "PREMIUM",
        price: 120,
        status: "PUBLISHED",
      },
    });

    await prisma.writerEarning.create({
      data: {
        writerId: writer.id,
        bookId: book.id,
        chapterId: chapter.id,
        sourceTransactionId: `writer-earning-${testId}`,
        coins: 120,
        status: "PENDING",
      },
    });

    await prisma.wallet.upsert({
      where: { userId: readerUserId },
      create: {
        userId: readerUserId,
        balance: 0,
        currency: "SOMI",
      },
      update: {},
    });

    await prisma.walletTransaction.createMany({
      data: [
        {
          userId: readerUserId,
          type: "COIN_PURCHASE",
          amount: 500,
          coins: 500,
          status: "COMPLETED",
          reference: `purchase-${testId}`,
        },
        {
          userId: readerUserId,
          type: "CHAPTER_UNLOCK",
          amount: -120,
          coins: -120,
          status: "COMPLETED",
          reference: `chapter:${book.id}:${chapter.id}`,
        },
      ],
    });

    const writers = await request(app)
      .get("/api/v1/admin/writers")
      .query({ page: 1, limit: 20 })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(writers.status).toBe(200);
    expect(writers.body).toHaveProperty("items");
    expect(writers.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
    });

    expect(
      writers.body.items.some((item: { id: string }) => item.id === writer.id),
    ).toBe(true);

    const writerItem = writers.body.items.find(
      (item: { id: string }) => item.id === writer.id,
    );

    expect(writerItem).toMatchObject({
      email: writerEmail,
      status: "ACTIVE",
      totalBooks: 1,
      publishedBooks: 1,
    });

    expect(writerItem.totalEarnings).toBeGreaterThanOrEqual(120);

    const economy = await request(app)
      .get("/api/v1/admin/economy")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(economy.status).toBe(200);
    expect(economy.body.totalCoinPurchases).toBeGreaterThanOrEqual(500);
    expect(economy.body.totalCoinsSpent).toBeGreaterThanOrEqual(120);
    expect(economy.body.refunds).toBe(0);
    expect(economy.body.failedPayments).toBeGreaterThanOrEqual(0);

    const transactions = await request(app)
      .get("/api/v1/admin/transactions")
      .query({
        page: 1,
        limit: 20,
        type: "CHAPTER_UNLOCK",
      })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(transactions.status).toBe(200);

    expect(
      transactions.body.items.some(
        (item: { type: string }) => item.type === "CHAPTER_UNLOCK",
      ),
    ).toBe(true);

    expect(transactions.body.items[0]).not.toHaveProperty("passwordHash");
    expect(transactions.body.items[0].currency).toBe("SOMI");

    // Clean up dependent records before deleting the writer.
    await prisma.writerEarning.deleteMany({
      where: { writerId: writer.id },
    });

    await prisma.chapter.delete({
      where: { id: chapter.id },
    });

    await prisma.book.delete({
      where: { id: book.id },
    });

    await prisma.user.delete({
      where: { id: writer.id },
    });
  });

  it("allows admins to publish and unpublish books through the existing lifecycle contract", async () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const writerEmail = `phase7h-admin-publish-${testId}@example.test`;
    const writerUsername = `phase7h-admin-publish-${testId}`;

    const writer = await prisma.user.create({
      data: {
        email: writerEmail,
        username: writerUsername,
        passwordHash: "placeholder-hash",
        role: "WRITER",
        status: "ACTIVE",
        profile: {
          create: {
            displayName: "Phase 7H Publish Writer",
          },
        },
      },
      include: { profile: true },
    });

    const book = await prisma.book.create({
      data: {
        authorId: writer.id,
        title: "Admin Moderation Lifecycle Book",
        slug: `admin-moderation-${testId}`,
        synopsis: "Protects the actual moderation contract.",
        status: "DRAFT",
      },
    });

    const publish = await request(app)
      .patch(`/api/v1/admin/books/${book.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" });

    expect(publish.status).toBe(200);
    expect(publish.body.book.status).toBe("PUBLISHED");

    const unpublish = await request(app)
      .patch(`/api/v1/admin/books/${book.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "UNPUBLISHED" });

    expect(unpublish.status).toBe(200);
    expect(unpublish.body.book.status).toBe("UNPUBLISHED");

    // The book references the writer through authorId, so delete it first.
    await prisma.book.delete({
      where: { id: book.id },
    });

    await prisma.user.delete({
      where: { id: writer.id },
    });
  });
});

describe("Phase 7H admin platform settings", () => {
  it("allows an admin to read platform settings", async () => {
    const response = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("settings");

    expect(response.body.settings).toEqual(
      expect.objectContaining({
        platformName: expect.any(String),
        supportEmail: expect.any(String),
        maintenanceMode: expect.any(Boolean),
        moderationEnabled: expect.any(Boolean),
        writerRegistrationEnabled: expect.any(Boolean),
        autoPublishEnabled: expect.any(Boolean),
        coinConversionRate: expect.any(Number),
        minimumPurchase: expect.any(Number),
        chapterPricingRules: expect.any(String),
        emailNotifications: expect.any(Boolean),
        moderationNotifications: expect.any(Boolean),
        paymentNotifications: expect.any(Boolean),
        sessionPolicy: expect.any(String),
        adminSessionTimeoutMinutes: expect.any(Number),
        suspiciousActivityMonitoring: expect.any(Boolean),
      }),
    );

    expect(response.body.settings).not.toHaveProperty("password");
    expect(response.body.settings).not.toHaveProperty("passwordHash");
    expect(response.body.settings).not.toHaveProperty("refreshTokenHash");
  });

  it("rejects unauthenticated access to platform settings", async () => {
    const response = await request(app).get("/api/v1/admin/settings");

    expect(response.status).toBe(401);
  });

  it("rejects non-admin access to platform settings", async () => {
    const response = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(response.status).toBe(403);
  });

  it("allows an admin to update platform settings", async () => {
    const response = await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        platformName: "SOMI Test",
        maintenanceMode: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("settings");

    expect(response.body.settings).toEqual(
      expect.objectContaining({
        platformName: "SOMI Test",
        maintenanceMode: true,
      }),
    );
  });

  it("persists platform settings after update", async () => {
    await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        platformName: "SOMI Persistence Test",
        maintenanceMode: true,
      })
      .expect(200);

    const response = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.settings).toEqual(
      expect.objectContaining({
        platformName: "SOMI Persistence Test",
        maintenanceMode: true,
      }),
    );
  });

  it("preserves unrelated settings during a partial update", async () => {
    const initialResponse = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const initialSettings = initialResponse.body.settings;

    const response = await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        platformName: "SOMI Partial Update Test",
      })
      .expect(200);

    expect(response.body.settings).toEqual(
      expect.objectContaining({
        platformName: "SOMI Partial Update Test",
        maintenanceMode: initialSettings.maintenanceMode,
        moderationEnabled: initialSettings.moderationEnabled,
        writerRegistrationEnabled: initialSettings.writerRegistrationEnabled,
        autoPublishEnabled: initialSettings.autoPublishEnabled,
        coinConversionRate: initialSettings.coinConversionRate,
        minimumPurchase: initialSettings.minimumPurchase,
        chapterPricingRules: initialSettings.chapterPricingRules,
        emailNotifications: initialSettings.emailNotifications,
        moderationNotifications: initialSettings.moderationNotifications,
        paymentNotifications: initialSettings.paymentNotifications,
        sessionPolicy: initialSettings.sessionPolicy,
        adminSessionTimeoutMinutes: initialSettings.adminSessionTimeoutMinutes,
        suspiciousActivityMonitoring:
          initialSettings.suspiciousActivityMonitoring,
      }),
    );
  });

  it("rejects an empty settings update", async () => {
    const response = await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("rejects invalid settings values", async () => {
    const response = await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        platformName: "",
        supportEmail: "not-an-email",
        coinConversionRate: 0,
        minimumPurchase: -100,
        adminSessionTimeoutMinutes: 0,
      });

    expect(response.status).toBe(400);
  });

  it("creates a SETTING_CHANGED audit event when settings change", async () => {
    const before = await prisma.auditEvent.count({
      where: {
        action: "SETTING_CHANGED",
        actorId: adminUserId,
      },
    });

    const response = await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        platformName: "SOMI Audit Test",
        maintenanceMode: true,
      })
      .expect(200);

    expect(response.body.settings).toEqual(
      expect.objectContaining({
        platformName: "SOMI Audit Test",
        maintenanceMode: true,
      }),
    );

    const after = await prisma.auditEvent.count({
      where: {
        action: "SETTING_CHANGED",
        actorId: adminUserId,
      },
    });

    expect(after).toBe(before + 1);

    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        action: "SETTING_CHANGED",
        actorId: adminUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(auditEvent).not.toBeNull();

    expect(auditEvent).toEqual(
      expect.objectContaining({
        actorId: adminUserId,
        actorName: "phase7h-admin@example.test",
        action: "SETTING_CHANGED",
        targetType: "PLATFORM_SETTINGS",
      }),
    );

    expect(auditEvent?.metadata).toEqual(
      expect.objectContaining({
        changedFields: expect.arrayContaining([
          "platformName",
          "maintenanceMode",
        ]),
      }),
    );
  });

  it("does not create an audit event when settings are unchanged", async () => {
    const currentResponse = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const currentSettings = currentResponse.body.settings;

    const before = await prisma.auditEvent.count({
      where: {
        action: "SETTING_CHANGED",
        actorId: adminUserId,
      },
    });

    await request(app)
      .patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        platformName: currentSettings.platformName,
      })
      .expect(200);

    const after = await prisma.auditEvent.count({
      where: {
        action: "SETTING_CHANGED",
        actorId: adminUserId,
      },
    });

    expect(after).toBe(before);
  });
});

describe("Phase 7H admin audit endpoints", () => {
  it("allows an admin to read audit events", async () => {
    const response = await request(app)
      .get("/api/v1/admin/audit")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(response.body).toHaveProperty("pagination");

    expect(Array.isArray(response.body.items)).toBe(true);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      }),
    );
  });

  it("rejects unauthenticated audit access", async () => {
    const response = await request(app).get("/api/v1/admin/audit");

    expect(response.status).toBe(401);
  });

  it("rejects non-admin audit access", async () => {
    const response = await request(app)
      .get("/api/v1/admin/audit")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(response.status).toBe(403);
  });

  it("supports audit filtering", async () => {
    await prisma.auditEvent.create({
      data: {
        actorId: adminUserId,
        actorName: "phase7h-admin@example.test",
        action: "C4_TEST_ACTION",
        targetType: "TEST",
        targetId: "c4-test-target",
        metadata: {
          source: "admin.test",
        },
      },
    });

    const response = await request(app)
      .get(
        "/api/v1/admin/audit?action=C4_TEST_ACTION&targetType=TEST&search=c4-test-target",
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.items.length).toBeGreaterThanOrEqual(1);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "C4_TEST_ACTION",
          targetType: "TEST",
          targetId: "c4-test-target",
        }),
      ]),
    );
  });
});
