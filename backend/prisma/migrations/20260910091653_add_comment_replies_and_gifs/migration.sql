-- AlterTable
ALTER TABLE `comment` ADD COLUMN `gifId` VARCHAR(100) NULL,
    ADD COLUMN `gifUrl` VARCHAR(1000) NULL,
    ADD COLUMN `parentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Comment_parentId_createdAt_idx` ON `Comment`(`parentId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
