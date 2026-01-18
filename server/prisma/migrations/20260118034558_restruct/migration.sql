/*
  Warnings:

  - You are about to drop the column `services` on the `BoardingHouse` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `proofImage` on the `Payment` table. All the data in the column will be lost.
  - The values [QR_TRANSFER] on the enum `Payment_method` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isLocked` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - The values [TENANT] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invoiceId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `target` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Report` DROP FOREIGN KEY `Report_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Tenant` DROP FOREIGN KEY `Tenant_userId_fkey`;

-- AlterTable
ALTER TABLE `BoardingHouse` DROP COLUMN `services`;

-- AlterTable
ALTER TABLE `Notification` DROP COLUMN `createdAt`,
    DROP COLUMN `isRead`,
    DROP COLUMN `userId`,
    ADD COLUMN `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `target` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `proofImage`,
    MODIFY `method` ENUM('GATEWAY') NOT NULL;

-- AlterTable
ALTER TABLE `Room` DROP COLUMN `isLocked`,
    ADD COLUMN `status` ENUM('EMPTY', 'OCCUPIED', 'LOCKED') NOT NULL DEFAULT 'EMPTY';

-- AlterTable
ALTER TABLE `Tenant` DROP COLUMN `userId`,
    ADD COLUMN `age` INTEGER NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `endDate` DATETIME(3) NULL,
    ADD COLUMN `fullName` VARCHAR(191) NOT NULL,
    ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `roomId` INTEGER NOT NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `fullName`,
    DROP COLUMN `provider`,
    DROP COLUMN `status`,
    ADD COLUMN `active` ENUM('YES', 'NO') NOT NULL DEFAULT 'YES',
    ADD COLUMN `otp` VARCHAR(6) NULL,
    ADD COLUMN `otpExpire` DATETIME(3) NULL,
    MODIFY `passwordHash` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('ADMIN', 'OWNER') NOT NULL;

-- DropTable
DROP TABLE `Report`;

-- CreateTable
CREATE TABLE `LicenseKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `startAt` DATETIME(3) NULL,
    `expireAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usedAt` DATETIME(3) NULL,

    UNIQUE INDEX `LicenseKey_key_key`(`key`),
    UNIQUE INDEX `LicenseKey_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `unit` ENUM('PER_MONTH', 'PER_PERSON', 'PER_USAGE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RoomService_roomId_idx`(`roomId`),
    UNIQUE INDEX `RoomService_roomId_serviceId_key`(`roomId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Payment_invoiceId_key` ON `Payment`(`invoiceId`);

-- CreateIndex
CREATE INDEX `Tenant_roomId_idx` ON `Tenant`(`roomId`);

-- AddForeignKey
ALTER TABLE `LicenseKey` ADD CONSTRAINT `LicenseKey_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomService` ADD CONSTRAINT `RoomService_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomService` ADD CONSTRAINT `RoomService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tenant` ADD CONSTRAINT `Tenant_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `BoardingHouse` RENAME INDEX `BoardingHouse_ownerId_fkey` TO `BoardingHouse_ownerId_idx`;

-- RenameIndex
ALTER TABLE `Invoice` RENAME INDEX `Invoice_tenantId_fkey` TO `Invoice_tenantId_idx`;

-- RenameIndex
ALTER TABLE `Room` RENAME INDEX `Room_houseId_fkey` TO `Room_houseId_idx`;
