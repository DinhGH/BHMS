/*
  Warnings:

  - A unique constraint covering the columns `[houseId,name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Service_name_key` ON `Service`;

-- CreateIndex
CREATE UNIQUE INDEX `Service_houseId_name_key` ON `Service`(`houseId`, `name`);
