ALTER TABLE `products`
  ADD COLUMN `hasJersey` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `hasPack` BOOLEAN NOT NULL DEFAULT true;

UPDATE `products`
SET `hasPack` = false
WHERE `categoryId` = 'accessory';
