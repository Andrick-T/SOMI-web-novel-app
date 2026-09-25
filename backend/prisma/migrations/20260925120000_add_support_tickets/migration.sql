CREATE TABLE `SupportTicket` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
  `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
  `relatedWithdrawalId` VARCHAR(191) NULL,
  `relatedKycId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `SupportTicket_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
  INDEX `SupportTicket_status_priority_createdAt_idx`(`status`, `priority`, `createdAt`),
  INDEX `SupportTicket_relatedWithdrawalId_idx`(`relatedWithdrawalId`),
  INDEX `SupportTicket_relatedKycId_idx`(`relatedKycId`),
  CONSTRAINT `SupportTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SupportMessage` (
  `id` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NOT NULL,
  `senderId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `SupportMessage_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
  INDEX `SupportMessage_senderId_createdAt_idx`(`senderId`, `createdAt`),
  CONSTRAINT `SupportMessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SupportMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
