import { randomUUID } from "node:crypto";
import { prisma } from "../src/config/database.js";
import { hashPassword } from "../src/modules/auth/auth.crypto.js";

const WRITER = {
  email: "writer@somi.app",
  username: "somiwriter",
  password: "Writer@SOMI2026!",
  displayName: "SOMI Writer",
};

async function main() {
  console.log("Creating test writer...");

  const existingUser = await prisma.user.findUnique({
    where: {
      email: WRITER.email,
    },
  });

  if (existingUser) {
    console.log("A user with this email already exists.");

    if (existingUser.role !== "WRITER") {
      const updatedUser = await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          role: "WRITER",
          status: "ACTIVE",
        },
      });

      console.log("Existing user promoted to WRITER.");
      console.log({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status,
      });
    } else {
      console.log({
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role,
        status: existingUser.status,
      });
    }

    return;
  }

  const passwordHash = await hashPassword(WRITER.password);

  const user = await prisma.user.create({
    data: {
      email: WRITER.email,
      username: `${WRITER.username}-${randomUUID().slice(0, 8)}`,
      passwordHash,
      role: "WRITER",
      status: "ACTIVE",

      profile: {
        create: {
          displayName: WRITER.displayName,
        },
      },
    },

    include: {
      profile: true,
    },
  });

  console.log("\nTest writer created successfully.\n");

  console.log({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.profile?.displayName,
    role: user.role,
    status: user.status,
  });

  console.log("\nLogin credentials:");
  console.log(`Email:    ${WRITER.email}`);
  console.log(`Password: ${WRITER.password}`);
}

main()
  .catch((error) => {
    console.error("Failed to create test writer:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
