# Repository Guidelines

## Project Structure & Module Organization

This repository has a NestJS API and Angular frontend:

- `api/` contains the NestJS 11 API. Keep domain code under `src/<feature>/`, Prisma integration under `src/prisma/`, the database schema and migrations under `prisma/`, and API contract tests under `test/`.
- `web/` contains the Angular 21 application. Put feature code in `src/app/features/<feature>/` and shared components or types in `src/app/shared/`. Keep a component's `.ts`, `.html`, `.less`, and `.spec.ts` files together. Use `src/assets/` for application media and `public/` for static files.
- Root `docker-compose.yml` runs MySQL, the API, and the web application.

## Build, Test, and Development Commands

```bash
docker compose up -d db           # start local MySQL
cd api && npm ci                  # install locked API dependencies
cd api && npm run start:dev       # run NestJS with reload on port 8080
cd api && npm test                # run Jest/Supertest API tests
cd api && npm run build           # generate Prisma Client and compile NestJS
docker compose up --build         # run the complete application

cd web && npm ci                  # install locked frontend dependencies
cd web && npm start               # serve Angular at localhost:4200
cd web && npm run build           # production frontend build
cd web && npm test                # run Vitest unit tests
```

## Coding Style & Naming Conventions

Follow the nearest existing file. Both projects use two spaces, single quotes, and strict TypeScript; the frontend uses LESS. Keep API routes in controllers, behavior in services, and database access through the shared `PrismaService`. Preserve the Prettier settings in `web/package.json` (100-character width). Name Angular tests `*.spec.ts` and API contract tests `*.e2e-spec.ts`; use existing Portuguese domain names such as `Enquete`, `Usuario`, and `Opcao` consistently.

## Testing Guidelines

Backend tests use Jest and Supertest under `api/test/`. Frontend tests use Angular's Vitest setup and live beside the file they cover. Add a focused regression test for changed behavior, then run the relevant command above. No coverage threshold is configured.

## Commit and Pull Request Guidelines

Use the established lowercase prefixes: `feat:`, `fix:`, `test:`, `chore:`, or `refactor:` (for example, `feat: add poll expiration`). Keep commits small and imperative. Pull requests should explain the behavior change, list tests run, link an issue when applicable, and include screenshots for UI changes.

## Configuration and Secrets

Treat the Compose MySQL credentials as local-development values only. Do not commit production secrets or `api/.env`; document required variables in `api/.env.example`.
