-- AlterTable
ALTER TABLE `PlatformSettings` MODIFY `coinConversionRate` DOUBLE NOT NULL DEFAULT 4.2,
    MODIFY `minimumPurchase` INTEGER NOT NULL DEFAULT 125;