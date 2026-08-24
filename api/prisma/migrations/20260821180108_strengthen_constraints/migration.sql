/*
  Warnings:

  - Made the column `title` on table `enquetes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `enquetes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `enquetes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiration_date` on table `enquetes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usuario_id` on table `enquetes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `opcoes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `qtde_votos` on table `opcoes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enquete_id` on table `opcoes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `enquetes` DROP FOREIGN KEY `enquetes_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `opcoes` DROP FOREIGN KEY `opcoes_enquete_id_fkey`;

-- AlterTable
ALTER TABLE `enquetes` MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    MODIFY `updated_at` DATETIME(6) NOT NULL,
    MODIFY `expiration_date` DATETIME(6) NOT NULL,
    MODIFY `usuario_id` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `opcoes` MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `qtde_votos` BIGINT NOT NULL DEFAULT 0,
    MODIFY `enquete_id` BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE `enquetes` ADD CONSTRAINT `enquetes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opcoes` ADD CONSTRAINT `opcoes_enquete_id_fkey` FOREIGN KEY (`enquete_id`) REFERENCES `enquetes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
