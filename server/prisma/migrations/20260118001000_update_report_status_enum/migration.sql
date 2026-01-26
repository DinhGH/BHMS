-- Allow new enum values temporarily
ALTER TABLE `Report`
  MODIFY `status` ENUM('PENDING', 'PROCESSING', 'RESOLVED', 'unread', 'processed') NOT NULL DEFAULT 'PENDING';

-- Migrate existing status values
UPDATE `Report` SET `status` = 'unread' WHERE `status` = 'PENDING';
UPDATE `Report` SET `status` = 'processed' WHERE `status` IN ('PROCESSING', 'RESOLVED');

-- Update enum definition and default
ALTER TABLE `Report`
  MODIFY `status` ENUM('unread', 'processed') NOT NULL DEFAULT 'unread';
