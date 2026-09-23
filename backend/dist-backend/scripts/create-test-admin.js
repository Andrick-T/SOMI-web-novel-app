import { prisma } from "../src/config/database.js";
import { hashPassword } from "../src/modules/auth/auth.crypto.js";
const ADMIN_EMAIL = "admin@somi.app";
const ADMIN_USERNAME = "somiadmin";
const ADMIN_PASSWORD = "Admin@SOMI2026!";
const ADMIN_NAME = "SOMI Admin";
async function main() {
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }],
        },
    });
    if (existingUser) {
        console.log("An account with this email or username already exists:");
        console.log({
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            role: existingUser.role,
            status: existingUser.status,
        });
        return;
    }
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const admin = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            username: ADMIN_USERNAME,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
            profile: {
                create: {
                    displayName: ADMIN_NAME,
                },
            },
        },
        include: {
            profile: true,
        },
    });
    console.log("\n========================================");
    console.log("SOMI TEST ADMIN CREATED");
    console.log("========================================");
    console.log(`ID:       ${admin.id}`);
    console.log(`Email:    ${admin.email}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Name:     ${admin.profile?.displayName}`);
    console.log(`Role:     ${admin.role}`);
    console.log(`Status:   ${admin.status}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log("========================================\n");
}
main()
    .catch((error) => {
    console.error("Failed to create test admin:", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
