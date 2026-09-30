import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SMOKE_EMAIL = `aiven-smoke-${Date.now()}@example.invalid`;

async function main() {
  console.log("=== SOMI Aiven / Prisma smoke test ===");

  // 1. Connexion Prisma
  await prisma.$queryRaw`SELECT 1`;
  console.log("✓ Prisma connection");

  // 2. Lecture des principaux modèles
  const [
    userCount,
    bookCount,
    paymentCount,
    walletCount,
    walletTransactionCount,
    writerProfileCount,
    writerKycCount,
    withdrawalCount,
    supportTicketCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.payment.count(),
    prisma.wallet.count(),
    prisma.walletTransaction.count(),
    prisma.writerProfile.count(),
    prisma.writerKyc.count(),
    prisma.withdrawalRequest.count(),
    prisma.supportTicket.count(),
  ]);

  console.log("✓ User count:", userCount);
  console.log("✓ Book count:", bookCount);
  console.log("✓ Payment count:", paymentCount);
  console.log("✓ Wallet count:", walletCount);
  console.log("✓ WalletTransaction count:", walletTransactionCount);
  console.log("✓ WriterProfile count:", writerProfileCount);
  console.log("✓ WriterKyc count:", writerKycCount);
  console.log("✓ WithdrawalRequest count:", withdrawalCount);
  console.log("✓ SupportTicket count:", supportTicketCount);

  // 3. Lecture des paramètres économiques
  const platformSettings = await prisma.platformSettings.findFirst();

  if (platformSettings) {
    console.log("✓ PlatformSettings:", {
      coinConversionRate: platformSettings.coinConversionRate,
      minimumPurchase: platformSettings.minimumPurchase,
    });
  } else {
    console.log("✓ PlatformSettings: no row currently exists");
  }

  // 4. Transaction complète + rollback volontaire
  const rollbackMarker = "SMOKE_TEST_ROLLBACK";

  try {
    await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: SMOKE_EMAIL,
            username: `aiven-smoke-${Date.now()}`,
            passwordHash: "smoke-test-password-hash",
            role: "USER",
          },
        });

        console.log("✓ Temporary User created:", user.id);

        const wallet = await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
          },
        });

        console.log("✓ Temporary Wallet created:", wallet.id);

        const payment = await tx.payment.create({
          data: {
            userId: user.id,
            amount: "100.00",
            currency: "XAF",
            amountCfa: 100,
            coins: 420,
            somiReference: `SMOKE-${Date.now()}`,
            provider: "CINETPAY",
            paymentMethod: "MOBILE_MONEY",
            status: "PENDING",
          },
        });

        console.log("✓ Temporary Payment created:", payment.id);

        const walletTransaction = await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: "COIN_PURCHASE",
            amount: 100,
            coins: 420,
            status: "PENDING",
            reference: `SMOKE-TX-${Date.now()}`,
            paymentId: payment.id,
          },
        });

        console.log(
          "✓ Temporary WalletTransaction created:",
          walletTransaction.id,
        );

        // Vérification des relations Payment -> User / WalletTransaction
        const paymentWithRelations = await tx.payment.findUnique({
          where: {
            id: payment.id,
          },
          include: {
            user: true,
            walletTransaction: true,
          },
        });

        if (!paymentWithRelations) {
          throw new Error("Payment relation read failed");
        }

        if (paymentWithRelations.user.id !== user.id) {
          throw new Error("Payment -> User relation failed");
        }

        if (
          paymentWithRelations.walletTransaction?.id !== walletTransaction.id
        ) {
          throw new Error("Payment -> WalletTransaction relation failed");
        }

        console.log("✓ Payment relations verified");

        // Test d'UPDATE
        const updatedPayment = await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            providerPaymentToken: "SMOKE_PROVIDER_TOKEN",
            providerPaymentUrl: "https://example.invalid/smoke",
          },
        });

        if (
          updatedPayment.providerPaymentToken !== "SMOKE_PROVIDER_TOKEN" ||
          updatedPayment.providerPaymentUrl !== "https://example.invalid/smoke"
        ) {
          throw new Error("Payment update failed");
        }

        console.log("✓ Payment update verified");

        // Suppression temporaire à l'intérieur de la transaction
        await tx.walletTransaction.delete({
          where: {
            id: walletTransaction.id,
          },
        });

        console.log("✓ Temporary WalletTransaction delete executed");

        // Rollback volontaire
        throw new Error(rollbackMarker);
      },
      {
        timeout: 15000,
      },
    );
  } catch (error) {
    if (!(error instanceof Error) || error.message !== rollbackMarker) {
      throw error;
    }

    console.log("✓ Transaction rollback verified");
  }

  // 5. Vérification que le User temporaire n'a PAS persisté
  const persistedSmokeUser = await prisma.user.findUnique({
    where: {
      email: SMOKE_EMAIL,
    },
  });

  if (persistedSmokeUser) {
    throw new Error("Rollback failed: temporary smoke-test User still exists");
  }

  console.log("✓ Rollback persistence check passed");

  console.log("\n=== ALL AIVEN / PRISMA SMOKE TESTS PASSED ===");
}

main()
  .catch((error) => {
    console.error("\n✗ AIVEN / PRISMA SMOKE TEST FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
