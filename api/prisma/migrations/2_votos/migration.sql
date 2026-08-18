CREATE TABLE `votos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `enquete_id` BIGINT NOT NULL,
    `opcao_id` BIGINT NOT NULL,
    `usuario_id` BIGINT NULL,

    INDEX `votos_enquete_id_idx`(`enquete_id`),
    INDEX `votos_opcao_id_idx`(`opcao_id`),
    INDEX `votos_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `votos_enquete_id_usuario_id_key`(`enquete_id`, `usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `votos`
ADD CONSTRAINT `votos_enquete_id_fkey`
FOREIGN KEY (`enquete_id`) REFERENCES `enquetes`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `votos`
ADD CONSTRAINT `votos_opcao_id_fkey`
FOREIGN KEY (`opcao_id`) REFERENCES `opcoes`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `votos`
ADD CONSTRAINT `votos_usuario_id_fkey`
FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
