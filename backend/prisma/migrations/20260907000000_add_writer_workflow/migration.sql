ALTER TABLE `Chapter` ADD COLUMN `contentVersion` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `BookLocalization` (
    `id` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `languageCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `sourceVersion` INTEGER NOT NULL DEFAULT 0,
    `contentVersion` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `BookLocalization_bookId_languageCode_key`(`bookId`, `languageCode`),
    INDEX `BookLocalization_bookId_status_idx`(`bookId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ChapterLocalization` (
    `id` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NOT NULL,
    `languageCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `contentFormat` VARCHAR(191) NOT NULL DEFAULT 'plain-text',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `sourceVersion` INTEGER NOT NULL DEFAULT 0,
    `contentVersion` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ChapterLocalization_chapterId_languageCode_key`(`chapterId`, `languageCode`),
    INDEX `ChapterLocalization_chapterId_status_idx`(`chapterId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WriterSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `writerId` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NULL,
    `languageCode` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
    `rejectionReason` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `WriterSubmission_writerId_status_idx`(`writerId`, `status`),
    INDEX `WriterSubmission_bookId_status_idx`(`bookId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WriterAsset` (
    `id` VARCHAR(191) NOT NULL,
    `writerId` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `altText` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(500) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `WriterAsset_storageKey_key`(`storageKey`),
    INDEX `WriterAsset_writerId_bookId_idx`(`writerId`, `bookId`),
    INDEX `WriterAsset_chapterId_idx`(`chapterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WriterEarning` (
    `id` VARCHAR(191) NOT NULL,
    `writerId` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NOT NULL,
    `sourceTransactionId` VARCHAR(191) NOT NULL,
    `coins` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `WriterEarning_sourceTransactionId_key`(`sourceTransactionId`),
    INDEX `WriterEarning_writerId_status_idx`(`writerId`, `status`),
    INDEX `WriterEarning_bookId_chapterId_idx`(`bookId`, `chapterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BookLocalization` ADD CONSTRAINT `BookLocalization_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChapterLocalization` ADD CONSTRAINT `ChapterLocalization_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterSubmission` ADD CONSTRAINT `WriterSubmission_writerId_fkey` FOREIGN KEY (`writerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterSubmission` ADD CONSTRAINT `WriterSubmission_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterSubmission` ADD CONSTRAINT `WriterSubmission_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterAsset` ADD CONSTRAINT `WriterAsset_writerId_fkey` FOREIGN KEY (`writerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterAsset` ADD CONSTRAINT `WriterAsset_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterAsset` ADD CONSTRAINT `WriterAsset_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterEarning` ADD CONSTRAINT `WriterEarning_writerId_fkey` FOREIGN KEY (`writerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterEarning` ADD CONSTRAINT `WriterEarning_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WriterEarning` ADD CONSTRAINT `WriterEarning_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;