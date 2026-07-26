-- Repair products created by the former seed, which classified them as packs
-- while leaving the pack sales option disabled. Existing "both" products are preserved.
UPDATE `products`
SET `hasJersey` = false, `hasPack` = true
WHERE `categoryId` = 'pack' AND `hasPack` = false;
