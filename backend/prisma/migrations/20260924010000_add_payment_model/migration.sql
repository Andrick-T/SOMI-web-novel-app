-- Phase E2: secure payment persistence.
CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `packageId` VARCHAR(191) NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL,
  `amountCfa` INTEGER NULL,
  `coins` INTEGER NOT NULL,
  `somiReference` VARCHAR(191) NOT NULL,
  `providerReference` VARCHAR(191) NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'CINETPAY',
  `paymentMethod` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `verifiedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `metadata` JSON NULL,

  UNIQUE INDEX `Payment_somiReference_key`(`somiReference`),
  UNIQUE INDEX `Payment_providerReference_key`(`providerReference`),
  INDEX `Payment_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
  INDEX `Payment_provider_status_idx`(`provider`, `status`),
  INDEX `Payment_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`),

  CONSTRAINT `Payment_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WalletTransaction`
  ADD COLUMN `paymentId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `WalletTransaction_paymentId_key`(`paymentId`);

ALTER TABLE `WalletTransaction`
  ADD CONSTRAINT `WalletTransaction_paymentId_fkey`
  FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
