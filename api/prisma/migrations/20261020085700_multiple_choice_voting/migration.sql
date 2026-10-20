-- AlterTable
ALTER TABLE `enquetes` ADD COLUMN `allow_multiple` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `max_choices` INTEGER NULL,
    ADD COLUMN `total_voters` BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `votos` ADD COLUMN `ballot_id` CHAR(36) NULL;

-- Backfill ballot_id with random UUIDs for existing votes
UPDATE `votos` SET `ballot_id` = (UUID()) WHERE `ballot_id` IS NULL;

-- AlterTable
ALTER TABLE `votos` MODIFY COLUMN `ballot_id` CHAR(36) NOT NULL;

-- DropForeignKey
ALTER TABLE `votos` DROP FOREIGN KEY `votos_enquete_id_fkey`;

-- DropIndex
DROP INDEX `votos_enquete_id_usuario_id_key` ON `votos`;

-- CreateIndex
CREATE INDEX `votos_ballot_id_idx` ON `votos`(`ballot_id`);

-- CreateIndex
CREATE UNIQUE INDEX `votos_enquete_id_usuario_id_opcao_id_key` ON `votos`(`enquete_id`, `usuario_id`, `opcao_id`);

-- AddForeignKey
ALTER TABLE `votos` ADD CONSTRAINT `votos_enquete_id_fkey` FOREIGN KEY (`enquete_id`) REFERENCES `enquetes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill total_voters for existing polls
UPDATE `enquetes` e SET `total_voters` = (SELECT COUNT(*) FROM `votos` v WHERE v.`enquete_id` = e.`id`);
