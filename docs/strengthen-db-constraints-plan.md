# Strengthen Database Constraints — Plan

## Context & findings

- Item 5 of `IMPROVEMENTS.md` asks that poll titles, option names, creator IDs,
  expiration dates, and vote counts be required (non-nullable) in the database.
- Today `api/prisma/schema.prisma` still marks them nullable, and migration
  `0_init` created the columns as `NULL`:
  - `Enquete.title` (`String?`)
  - `Enquete.usuarioId` (`BigInt?`)
  - `Enquete.expirationDate` (`DateTime?`)
  - `Opcao.name` (`String?`)
  - `Opcao.votes` (`BigInt?`)
  - also `Enquete.createdAt`/`updatedAt` and `Opcao.enqueteId` (nullable, related)
- Application code already provides non-null values on every write
  (`enquetes.service.ts` `create`/`update` set title, dates, usuarioId, option
  names and `votes: 0n`), so tightening the columns is safe; it only removes
  null-handling (`??`, `?.`) that is no longer needed.

## Changes per file

### 1. `api/prisma/schema.prisma`

Make the following fields non-nullable (drop the `?`; keep existing types/maps):

- `Enquete.title` → `String`
- `Enquete.createdAt` → `DateTime` (keep `@default(now())` semantics — add
  `@default(now())` so inserts without it still work)
- `Enquete.updatedAt` → `DateTime`
- `Enquete.expirationDate` → `DateTime`
- `Enquete.usuarioId` → `BigInt`
- `Enquete.usuario` relation → `Usuario` (remove `?`)
- `Opcao.name` → `String`
- `Opcao.votes` → `BigInt` (keep `@default(0)`)
- `Opcao.enqueteId` → `BigInt`
- `Opcao.enquete` relation → `Enquete` (remove `?`)

### 2. New migration

- Run `cd api && npx prisma migrate dev --name strengthen_constraints`.
- Dev DB is disposable (see AGENTS.md `docker compose down --volumes`). If the
  migration generates `ALTER ... MODIFY ... NOT NULL` that would fail on
  existing NULL rows, wipe and reseed locally, or prepend `UPDATE` backfills
  before the `MODIFY` statements in the generated SQL.

### 3. `api/src/enquetes/enquetes.service.ts`

- `assertOwnedPoll`: drop the `!enquete.usuarioId ||` guard (usuarioId is now
  required); keep `enquete.usuarioId !== BigInt(userId)`.
- `vote`: change `if (enquete.expirationDate && enquete.expirationDate <= new Date())`
  to `if (enquete.expirationDate <= new Date())`.
- `toResponse`: `enquete.usuario?.name` → `enquete.usuario.name`.
- `options`: `toSafeNumber(opcao.votes ?? 0n)` → `toSafeNumber(opcao.votes)`.

### 4. Regenerate Prisma client

- `cd api && npm run build` (runs `prisma generate` + `nest build`).
- Fix any TypeScript errors surfaced by the now-non-null generated types
  (e.g. `?? 0n`, `?.name`, `!title` casts that become redundant).

## Verification

1. `cd api && npm run build` — Prisma client regenerates, compiles.
2. `cd api && npm test` — mocked contract tests still green.
3. Manual smoke: `docker compose up -d db`, apply migration, then create/vote/
   close a poll to confirm inserts still succeed with required fields.

## Out of scope

- No DTO/validation changes (`create`/`update` DTOs already require title and
  options; `pollExpirationInDays` optional with `?? 7` default stays).
- No other nullable columns (e.g. `Voto.usuarioId` stays nullable for
  anonymous voting).
