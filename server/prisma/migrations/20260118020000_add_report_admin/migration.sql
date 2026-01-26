CREATE TABLE `ReportAdmin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `senderId` INT NOT NULL,
  `target` VARCHAR(191) NOT NULL,
  `content` VARCHAR(191) NOT NULL,
  `images` JSON NULL,
  `status` ENUM('unread', 'processed') NOT NULL DEFAULT 'unread',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ReportAdmin_senderId_fkey` (`senderId`),
  CONSTRAINT `ReportAdmin_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Owner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
