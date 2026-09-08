import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genres = [
  "Fantasy",
  "Thriller",
  "Family Saga",
  "Children's Story",
  "Adventure",
  "Romance",
  "Cultural Fiction",
  "Mystery",
];

const tags = [
  "African Fiction",
  "Contemporary",
  "Drama",
  "Historical",
  "Young Adult",
  "Urban",
  "Inspirational",
  "Short Story",
];

async function main() {
  for (const name of genres) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${genres.length} genres and ${tags.length} tags.`);
}

main()
  .catch((error) => {
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
