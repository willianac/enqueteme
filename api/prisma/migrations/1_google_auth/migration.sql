DROP INDEX `usuarios_name_key` ON `usuarios`;

ALTER TABLE `usuarios`
    ADD COLUMN `google_subject` VARCHAR(255) NOT NULL,
    ADD COLUMN `email` VARCHAR(320) NOT NULL,
    MODIFY `name` VARCHAR(255) NOT NULL;

CREATE UNIQUE INDEX `usuarios_google_subject_key` ON `usuarios`(`google_subject`);
CREATE UNIQUE INDEX `usuarios_email_key` ON `usuarios`(`email`);

CREATE TABLE `sessoes` (
    `token_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `expires_at` DATETIME(6) NOT NULL,
    `usuario_id` BIGINT NOT NULL,

    INDEX `sessoes_usuario_id_idx`(`usuario_id`),
    INDEX `sessoes_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sessoes`
ADD CONSTRAINT `sessoes_usuario_id_fkey`
FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
