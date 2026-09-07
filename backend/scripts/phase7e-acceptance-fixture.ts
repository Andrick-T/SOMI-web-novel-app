import { prisma } from "../src/config/database.js";
import { hashPassword } from "../src/modules/auth/auth.crypto.js";

const LOCAL_ACCEPTANCE_PASSWORD = "Somi-economy-password-123";
const FIXTURE_EMAILS = [
  "phase7e-reader-a-fixture@example.test",
  "phase7e-reader-b-fixture@example.test",
] as const;

async function getFixtureSnapshot(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      wallets: true,
      _count: {
        select: { transactions: true, entitlements: true },
      },
      profile: true,
    },
  });

  if (!user) {
    throw new Error(`Fixture user not found: ${email}`);
  }

  const wallet = user.wallets ?? null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    walletBalance: wallet?.balance ?? 0,
    walletTransactionCount: user._count.transactions,
    entitlementCount: user._count.entitlements,
    profileName: user.profile?.displayName ?? null,
  };
}

async function ensureFixturePassword(email: string) {
  const before = await getFixtureSnapshot(email);

  await prisma.user.update({
    where: { email },
    data: { passwordHash: await hashPassword(LOCAL_ACCEPTANCE_PASSWORD) },
  });

  const after = await getFixtureSnapshot(email);
  const preserved = {
    id: before.id,
    role: before.role,
    walletBalance: before.walletBalance,
    walletTransactionCount: before.walletTransactionCount,
    entitlementCount: before.entitlementCount,
  };

  const current = {
    id: after.id,
    role: after.role,
    walletBalance: after.walletBalance,
    walletTransactionCount: after.walletTransactionCount,
    entitlementCount: after.entitlementCount,
  };

  if (JSON.stringify(preserved) !== JSON.stringify(current)) {
    throw new Error(
      `Economy state changed while setting fixture password for ${email}: before=${JSON.stringify(preserved)} after=${JSON.stringify(current)}`,
    );
  }

  return { before, after };
}

async function main() {
  console.log("[phase7e-fixture] LOCAL PHASE 7E ACCEPTANCE ONLY");
  console.log(
    "[phase7e-fixture] Reusing existing auth password hashing implementation from backend/src/modules/auth/auth.crypto.ts",
  );

  const snapshots: Record<
    string,
    {
      before: ReturnType<typeof getFixtureSnapshot> extends Promise<infer T>
        ? T
        : never;
      after: ReturnType<typeof getFixtureSnapshot> extends Promise<infer T>
        ? T
        : never;
    }
  > = {};

  for (const email of FIXTURE_EMAILS) {
    const snapshot = await ensureFixturePassword(email);
    snapshots[email] = snapshot;
    console.log(`[phase7e-fixture] ${email}`);
    console.log(`  before: ${JSON.stringify(snapshot.before)}`);
    console.log(`  after: ${JSON.stringify(snapshot.after)}`);
  }

  console.log(
    "[phase7e-fixture] Fixture password reset complete. Existing user IDs, wallets, transactions, entitlements and reading state remain unchanged.",
  );
}

try {
  await main();
} catch (error) {
  console.error("[phase7e-fixture] ERROR");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
