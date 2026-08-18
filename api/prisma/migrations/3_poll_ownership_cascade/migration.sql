-- DropForeignKey
ALTER TABLE `opcoes` DROP FOREIGN KEY `opcoes_enquete_id_fkey`;

-- AddForeignKey
ALTER TABLE `opcoes` ADD CONSTRAINT `opcoes_enquete_id_fkey` FOREIGN KEY (`enquete_id`) REFERENCES `enquetes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
