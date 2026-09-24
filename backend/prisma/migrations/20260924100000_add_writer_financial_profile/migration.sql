ALTER TABLE `WriterProfile`
  ADD COLUMN `preferredCurrency` VARCHAR(191) NOT NULL DEFAULT 'XAF',
  ADD COLUMN `payoutMethod` VARCHAR(191) NULL,
  ADD COLUMN `payoutAccount` VARCHAR(191) NULL,
  ADD COLUMN `payoutAccountName` VARCHAR(191) NULL;

CREATE TABLE `WriterKyc` (
  `id` VARCHAR(191) NOT NULL,
  `writerId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
  `submittedAt` DATETIME(3) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `rejectionReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `WriterKyc_writerId_key`(`writerId`),
  INDEX `WriterKyc_status_idx`(`status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WriterKyc_writerId_fkey` FOREIGN KEY (`writerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WriterKycDocument` (
  `id` VARCHAR(191) NOT NULL,
  `writerId` VARCHAR(191) NOT NULL,
  `kycId` VARCHAR(191) NOT NULL,
  `documentType` VARCHAR(191) NOT NULL,
  `storageKey` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `sizeBytes` INT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `WriterKycDocument_storageKey_key`(`storageKey`),
  INDEX `WriterKycDocument_writerId_status_idx`(`writerId`, `status`),
  INDEX `WriterKycDocument_kycId_documentType_idx`(`kycId`, `documentType`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WriterKycDocument_writerId_fkey` FOREIGN KEY (`writerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WriterKycDocument_kycId_fkey` FOREIGN KEY (`kycId`) REFERENCES `WriterKyc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WithdrawalRequest` (
  `id` VARCHAR(191) NOT NULL,
  `writerId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `coins` INT NOT NULL,
  `amountCfa` DECIMAL(18,6) NOT NULL,
  `currency` VARCHAR(3) NOT NULL,
  `exchangeRateCfa` DECIMAL(18,6) NOT NULL,
  `amount` DECIMAL(18,6) NOT NULL,
  `payoutMethod` VARCHAR(191) NOT NULL,
  `payoutAccount` VARCHAR(191) NOT NULL,
  `payoutAccountName` VARCHAR(191) NULL,
  `failureCount` INT NOT NULL DEFAULT 0,
  `failureMessage` TEXT NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `WithdrawalRequest_writerId_status_createdAt_idx`(`writerId`, `status`, `createdAt`),
  INDEX `WithdrawalRequest_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WithdrawalRequest_writerId_fkey` FOREIGN KEY (`writerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
