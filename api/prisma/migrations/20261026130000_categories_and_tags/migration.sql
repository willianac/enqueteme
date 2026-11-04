-- AlterTable
ALTER TABLE `enquetes`
  ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'Geral',
  ADD COLUMN `tags` JSON NULL;

-- CreateIndex
CREATE INDEX `enquetes_category_idx` ON `enquetes`(`category`);
