/*
  Warnings:

  - You are about to drop the column `services` on the `BoardingHouse` table. All the data in the column will be lost.
  - Made the column `houseId` on table `Service` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Service` DROP FOREIGN KEY `Service_houseId_fkey`;

-- AlterTable
ALTER TABLE `BoardingHouse` DROP COLUMN `services`;

-- AlterTable
ALTER TABLE `Service` MODIFY `houseId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `RoomService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RoomService_roomId_serviceId_key`(`roomId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_houseId_fkey` FOREIGN KEY (`houseId`) REFERENCES `BoardingHouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomService` ADD CONSTRAINT `RoomService_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomService` ADD CONSTRAINT `RoomService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
