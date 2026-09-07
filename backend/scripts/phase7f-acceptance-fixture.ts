import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/auth/auth.crypto.js";

const prisma = new PrismaClient();
const password = "Somi-phase7f-acceptance-123";
const fixture = {
  writerA: {
    email: "phase7f-writer-a-fixture@example.test",
    name: "Phase 7F Writer A",
    slug: "phase-7f-acceptance-book-a",
  },
  writerB: {
    email: "phase7f-writer-b-fixture@example.test",
    name: "Phase 7F Writer B",
    slug: "phase-7f-acceptance-book-b",
  },
};

async function upsertWriter(input: { email: string; name: string }) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      username: `${input.email.split("@")[0]}-fixture`,
      passwordHash,
      role: "WRITER",
      status: "ACTIVE",
      profile: { create: { displayName: input.name } },
    },
    update: { passwordHash, role: "WRITER", status: "ACTIVE" },
  });
  await prisma.writerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, displayName: input.name, penName: input.name },
    update: { displayName: input.name, penName: input.name },
  });
  return user;
}

async function upsertBook(authorId: string, slug: string, title: string) {
  const book = await prisma.book.upsert({
    where: { slug },
    create: {
      authorId,
      title,
      slug,
      synopsis: "Deterministic local Phase 7F acceptance fixture.",
      status: "DRAFT",
    },
    update: {
      authorId,
      title,
      synopsis: "Deterministic local Phase 7F acceptance fixture.",
      status: "DRAFT",
      publishedAt: null,
    },
  });

  const chapter = await prisma.chapter.upsert({
    where: { bookId_number: { bookId: book.id, number: 1 } },
    create: {
      bookId: book.id,
      number: 1,
      title: "Acceptance Chapter One",
      content: "A deterministic English chapter for Phase 7F acceptance.",
      status: "DRAFT",
      accessType: "FREE",
      price: 0,
      wordCount: 9,
      readingTime: 1,
    },
    update: {
      title: "Acceptance Chapter One",
      content: "A deterministic English chapter for Phase 7F acceptance.",
      status: "DRAFT",
      publishedAt: null,
      accessType: "FREE",
      price: 0,
      wordCount: 9,
      readingTime: 1,
    },
  });

  const premiumChapter = await prisma.chapter.upsert({
    where: { bookId_number: { bookId: book.id, number: 2 } },
    create: {
      bookId: book.id,
      number: 2,
      title: "Acceptance Premium Chapter",
      content:
        "A deterministic premium chapter for controlled economy acceptance.",
      status: "DRAFT",
      accessType: "PREMIUM",
      price: 120,
      wordCount: 10,
      readingTime: 1,
    },
    update: {
      title: "Acceptance Premium Chapter",
      content:
        "A deterministic premium chapter for controlled economy acceptance.",
      status: "DRAFT",
      accessType: "PREMIUM",
      price: 120,
      publishedAt: null,
      wordCount: 10,
      readingTime: 1,
    },
  });

  await prisma.book.update({
    where: { id: book.id },
    data: { totalChapters: 2 },
  });

  for (const languageCode of ["en", "fr"] as const) {
    await prisma.bookLocalization.upsert({
      where: { bookId_languageCode: { bookId: book.id, languageCode } },
      create: {
        bookId: book.id,
        languageCode,
        title: languageCode === "en" ? title : `${title} Francais`,
        description: "Deterministic bilingual acceptance metadata.",
        status: "READY_FOR_SUBMISSION",
      },
      update: {
        title: languageCode === "en" ? title : `${title} Francais`,
        description: "Deterministic bilingual acceptance metadata.",
        status: "READY_FOR_SUBMISSION",
      },
    });
  }

  for (const currentChapter of [chapter, premiumChapter]) {
    for (const languageCode of ["en", "fr"] as const) {
      await prisma.chapterLocalization.upsert({
        where: {
          chapterId_languageCode: {
            chapterId: currentChapter.id,
            languageCode,
          },
        },
        create: {
          chapterId: currentChapter.id,
          languageCode,
          title:
            languageCode === "en"
              ? currentChapter.title
              : `${currentChapter.title} Francais`,
          content:
            languageCode === "en"
              ? currentChapter.content
              : "Contenu francais deterministe pour l'acceptation Phase 7F.",
          contentFormat: "plain-text",
          status: "READY_FOR_SUBMISSION",
          contentVersion: 1,
          sourceVersion: 0,
        },
        update: {
          status: "READY_FOR_SUBMISSION",
          contentVersion: 1,
          sourceVersion: 0,
        },
      });
    }
  }

  return { book, chapter, premiumChapter };
}

async function upsertPublishedPremiumBook(authorId: string) {
  const slug = "phase-7f-acceptance-earnings-book";
  const book = await prisma.book.upsert({
    where: { slug },
    create: {
      authorId,
      title: "Phase 7F Acceptance Earnings Book",
      slug,
      synopsis:
        "Controlled published premium book for real economy attribution.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      totalChapters: 1,
    },
    update: {
      authorId,
      status: "PUBLISHED",
      publishedAt: { set: new Date() },
      totalChapters: 1,
    },
  });
  const chapter = await prisma.chapter.upsert({
    where: { bookId_number: { bookId: book.id, number: 1 } },
    create: {
      bookId: book.id,
      number: 1,
      title: "Acceptance Earnings Chapter",
      content:
        "A published premium chapter for controlled earnings acceptance.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      accessType: "PREMIUM",
      price: 120,
      wordCount: 10,
      readingTime: 1,
    },
    update: {
      title: "Acceptance Earnings Chapter",
      content:
        "A published premium chapter for controlled earnings acceptance.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      accessType: "PREMIUM",
      price: 120,
      wordCount: 10,
      readingTime: 1,
    },
  });
  for (const languageCode of ["en", "fr"] as const) {
    await prisma.bookLocalization.upsert({
      where: { bookId_languageCode: { bookId: book.id, languageCode } },
      create: {
        bookId: book.id,
        languageCode,
        title: languageCode === "en" ? book.title : `${book.title} Francais`,
        description: "Controlled published premium acceptance metadata.",
        status: "APPROVED",
      },
      update: {
        status: "APPROVED",
      },
    });
  }
  return { book, chapter };
}

async function main() {
  const writerA = await upsertWriter(fixture.writerA);
  const writerB = await upsertWriter(fixture.writerB);
  const bookA = await upsertBook(
    writerA.id,
    fixture.writerA.slug,
    "Phase 7F Acceptance Book A",
  );
  const bookB = await upsertBook(
    writerB.id,
    fixture.writerB.slug,
    "Phase 7F Acceptance Book B",
  );
  const earningsBook = await upsertPublishedPremiumBook(writerA.id);

  console.log(
    JSON.stringify(
      {
        password,
        writerA: {
          id: writerA.id,
          email: writerA.email,
          bookId: bookA.book.id,
          chapterId: bookA.chapter.id,
          premiumChapterId: bookA.premiumChapter.id,
        },
        writerB: {
          id: writerB.id,
          email: writerB.email,
          bookId: bookB.book.id,
          chapterId: bookB.chapter.id,
          premiumChapterId: bookB.premiumChapter.id,
        },
        earnings: {
          bookId: earningsBook.book.id,
          chapterId: earningsBook.chapter.id,
          price: earningsBook.chapter.price,
        },
        note: "Only controlled Phase 7F records are upserted. Existing 7E Reader records are untouched.",
      },
      null,
      2,
    ),
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
