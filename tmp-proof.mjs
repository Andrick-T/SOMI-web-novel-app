import { PrismaClient } from '@prisma/client';
const base = 'http://localhost:4000/api/v1';
const ts = Date.now();
const email = `writer-${ts}@example.test`;
const password = 'Somi-content-password-123';
const prisma = new PrismaClient();

try {
  const registerResp = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: `Writer ${ts}` }),
  });
  const register = await registerResp.json();
  if (!registerResp.ok || !register.user) throw new Error(JSON.stringify(register));

  const user = await prisma.user.findUnique({ where: { id: register.user.id }, select: { id: true, email: true, role: true } });
  if (!user) throw new Error('User missing in DB after register');
  await prisma.user.update({ where: { id: user.id }, data: { role: 'WRITER' } });

  const loginResp = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginResp.json();
  if (!loginResp.ok || !login.accessToken) throw new Error(JSON.stringify(login));

  const bookTitle = `SOMI E2E Acceptance Book ${ts}`;
  const slug = `somi-e2e-acceptance-book-${ts}`;
  const bookResp = await fetch(`${base}/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${login.accessToken}`,
    },
    body: JSON.stringify({
      title: bookTitle,
      slug,
      synopsis: 'Real acceptance book created through the live API path.',
      cover: 'https://images.example.com/cover.jpg',
      heroImage: 'https://images.example.com/hero.jpg',
      genres: [],
      tags: [],
    }),
  });
  const bookPayload = await bookResp.json();
  if (!bookResp.ok || !bookPayload.book) throw new Error(JSON.stringify(bookPayload));

  const chapterTitle = `SOMI E2E CONTENT VERIFICATION ${ts}`;
  const chapterContent = `This chapter proves the real content path from browser to HTTP to Express to Prisma to MySQL and back again. Unique verification token: ${ts}`;
  const chapterResp = await fetch(`${base}/books/${bookPayload.book.id}/chapters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${login.accessToken}`,
    },
    body: JSON.stringify({
      title: chapterTitle,
      number: 1,
      content: chapterContent,
      status: 'DRAFT',
      accessType: 'FREE',
      price: 0,
    }),
  });
  const chapterPayload = await chapterResp.json();
  if (!chapterResp.ok || !chapterPayload.chapter) throw new Error(JSON.stringify(chapterPayload));

  const savedUser = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, status: true } });
  const savedBook = await prisma.book.findUnique({ where: { id: bookPayload.book.id }, include: { author: true, chapters: true } });
  const savedChapter = await prisma.chapter.findFirst({ where: { bookId: bookPayload.book.id, title: chapterTitle }, include: { book: true } });

  console.log(JSON.stringify({
    user: savedUser,
    book: savedBook ? {
      id: savedBook.id,
      title: savedBook.title,
      slug: savedBook.slug,
      status: savedBook.status,
      authorId: savedBook.authorId,
      chapterCount: savedBook.chapters.length,
    } : null,
    chapter: savedChapter ? {
      id: savedChapter.id,
      title: savedChapter.title,
      status: savedChapter.status,
      content: savedChapter.content,
      bookId: savedChapter.bookId,
    } : null,
    apiChain: {
      registerStatus: registerResp.status,
      loginStatus: loginResp.status,
      bookStatus: bookResp.status,
      chapterStatus: chapterResp.status,
    },
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
