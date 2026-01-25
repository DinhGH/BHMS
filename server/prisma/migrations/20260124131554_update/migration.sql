/*
  Warnings:

  - You are about to alter the column `priceType` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - A unique constraint covering the columns `[name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `RoomService` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Service` DROP FOREIGN KEY `Service_houseId_fkey`;

-- AlterTable
ALTER TABLE `Report` MODIFY `status` ENUM('PENDING', 'PROCESSING', 'RESOLVED', 'REVIEWING', 'FIXING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `RoomService` ADD COLUMN `price` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `Service` MODIFY `priceType` ENUM('FIXED', 'UNIT_BASED', 'PERCENTAGE') NOT NULL DEFAULT 'FIXED';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `active` ENUM('YES', 'NO') NOT NULL DEFAULT 'YES',
    ADD COLUMN `otp` VARCHAR(6) NULL,
    ADD COLUMN `otpExpire` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ReportAdmin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` INTEGER NOT NULL,
    `target` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `images` JSON NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'RESOLVED', 'REVIEWING', 'FIXING') NOT NULL DEFAULT 'REVIEWING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReportAdmin_senderId_fkey`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LicenseKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LicenseKey_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `RoomService_roomId_idx` ON `RoomService`(`roomId`);

-- CreateIndex
CREATE UNIQUE INDEX `Service_name_key` ON `Service`(`name`);

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_houseId_fkey` FOREIGN KEY (`houseId`) REFERENCES `BoardingHouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAdmin` ADD CONSTRAINT `ReportAdmin_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Owner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LicenseKey` ADD CONSTRAINT `LicenseKey_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
