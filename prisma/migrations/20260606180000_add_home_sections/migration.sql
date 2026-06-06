CREATE TABLE `home_sections` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `subtitle` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `home_section_products` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sectionId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  UNIQUE INDEX `home_section_products_sectionId_productId_key`(`sectionId`, `productId`),
  INDEX `home_section_products_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `home_section_products`
  ADD CONSTRAINT `home_section_products_sectionId_fkey`
  FOREIGN KEY (`sectionId`) REFERENCES `home_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `home_section_products`
  ADD CONSTRAINT `home_section_products_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
