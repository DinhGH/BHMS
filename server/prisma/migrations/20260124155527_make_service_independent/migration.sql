/*
  Warnings:

  - You are about to drop the column `houseId` on the `Service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Service` DROP FOREIGN KEY `Service_houseId_fkey`;

-- DropIndex
DROP INDEX `Service_houseId_name_key` ON `Service`;

-- AlterTable
ALTER TABLE `Service` DROP COLUMN `houseId`;

-- CreateIndex
CREATE UNIQUE INDEX `Service_name_key` ON `Service`(`name`);
