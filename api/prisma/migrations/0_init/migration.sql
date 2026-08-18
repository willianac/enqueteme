CREATE TABLE `usuarios` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,

    UNIQUE INDEX `usuarios_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enquetes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    `vote_require_login` BOOLEAN NOT NULL,
    `expiration_date` DATETIME(6) NULL,
    `usuario_id` BIGINT NULL,

    INDEX `enquetes_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `opcoes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `qtde_votos` BIGINT NULL DEFAULT 0,
    `enquete_id` BIGINT NULL,

    INDEX `opcoes_enquete_id_idx`(`enquete_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `enquetes`
ADD CONSTRAINT `enquetes_usuario_id_fkey`
FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `opcoes`
ADD CONSTRAINT `opcoes_enquete_id_fkey`
FOREIGN KEY (`enquete_id`) REFERENCES `enquetes`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
