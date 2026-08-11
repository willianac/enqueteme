# Repository Guidelines

## Project Structure & Module Organization

This repository has a Spring Boot API and Angular frontend:

- `api/` contains the Java 25 API. Keep application code under `src/main/java/com/will/enqueteme/`, organized into `controllers/`, `dto/`, `models/`, and `repositories/`. Backend tests mirror this package in `src/test/java/`.
- `web/` contains the Angular 21 application. Put feature code in `src/app/features/<feature>/` and shared components or types in `src/app/shared/`. Keep a component's `.ts`, `.html`, `.less`, and `.spec.ts` files together. Use `src/assets/` for application media and `public/` for static files.
- Root `docker-compose.yml` starts the local MySQL database; `api/compose.yaml` supports Spring Boot's Docker Compose integration.

## Build, Test, and Development Commands

```bash
cd api && ./mvnw spring-boot:run  # run the API
cd api && ./mvnw test             # run JUnit tests
cd api && ./mvnw package          # compile, test, and package the API
docker compose up -d db           # start local MySQL

cd web && npm ci                  # install locked frontend dependencies
cd web && npm start               # serve Angular at localhost:4200
cd web && npm run build           # production frontend build
cd web && npm test                # run Vitest unit tests
```

## Coding Style & Naming Conventions

Follow the nearest existing file. Java uses four-space indentation, `PascalCase` classes/DTOs, and `camelCase` members; keep routes in controllers and persistence work in repositories. The frontend uses two spaces, single quotes, strict TypeScript, and LESS. Preserve the Prettier settings in `web/package.json` (100-character width). Name Angular tests `*.spec.ts`; use existing Portuguese domain names such as `Enquete`, `Usuario`, and `Opcao` consistently.

## Testing Guidelines

Backend tests use JUnit 5 with Spring Boot; name them `*Tests.java`. Frontend tests use Angular's Vitest setup and live beside the file they cover. Add a focused regression test for changed behavior, then run the relevant command above. No coverage threshold is configured.

## Commit and Pull Request Guidelines

Use the established lowercase prefixes: `feat:`, `fix:`, `chore:`, or `refactor:` (for example, `feat: add poll expiration`). Keep commits small and imperative. Pull requests should explain the behavior change, list tests run, link an issue when applicable, and include screenshots for UI changes.

## Configuration and Secrets

Treat the Compose MySQL credentials as local-development values only. Do not commit production secrets; `api/src/main/resources/application.properties` is intentionally ignored.
