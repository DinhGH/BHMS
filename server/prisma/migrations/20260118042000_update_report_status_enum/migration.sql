-- Expand enum to include new values for Report
ALTER TABLE `Report`
  MODIFY `status` ENUM('unread', 'processed', 'FIXED', 'REVIEWING', 'FIXING') NOT NULL DEFAULT 'REVIEWING';

-- Migrate existing values
UPDATE `Report` SET `status` = 'REVIEWING' WHERE `status` = 'unread';
UPDATE `Report` SET `status` = 'FIXED' WHERE `status` = 'processed';

-- Finalize enum for Report
ALTER TABLE `Report`
  MODIFY `status` ENUM('FIXED', 'REVIEWING', 'FIXING') NOT NULL DEFAULT 'REVIEWING';

-- Expand enum to include new values for ReportAdmin
ALTER TABLE `ReportAdmin`
  MODIFY `status` ENUM('unread', 'processed', 'FIXED', 'REVIEWING', 'FIXING') NOT NULL DEFAULT 'REVIEWING';

-- Migrate existing values
UPDATE `ReportAdmin` SET `status` = 'REVIEWING' WHERE `status` = 'unread';
UPDATE `ReportAdmin` SET `status` = 'FIXED' WHERE `status` = 'processed';

-- Finalize enum for ReportAdmin
ALTER TABLE `ReportAdmin`
  MODIFY `status` ENUM('FIXED', 'REVIEWING', 'FIXING') NOT NULL DEFAULT 'REVIEWING';
