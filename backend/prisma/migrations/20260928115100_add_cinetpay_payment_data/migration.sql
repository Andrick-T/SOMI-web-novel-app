-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `providerPaymentToken` VARCHAR(191) NULL,
    ADD COLUMN `providerPaymentUrl` VARCHAR(191) NULL;