-- AlterEnum
ALTER TABLE `Payment` CHANGE `method` `method` ENUM('GATEWAY', 'QR_TRANSFER', 'CASH') NOT NULL;
