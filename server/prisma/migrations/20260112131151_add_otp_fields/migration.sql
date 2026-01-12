/*
  Warnings:

  - You are about to alter the column `status` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(1))`.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `active` ENUM('YES', 'NO') NOT NULL DEFAULT 'YES',
    ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NOT NULL,
    ADD COLUMN `hometown` VARCHAR(191) NULL,
    ADD COLUMN `otp` VARCHAR(6) NULL,
    ADD COLUMN `otpExpire` DATETIME(3) NULL,
    ADD COLUMN `phone` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('RENTING', 'NO_RENTING') NOT NULL DEFAULT 'NO_RENTING';

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);
