# 📊 Enquete.me

**Enquete.me** is a modern platform for real-time poll creation, voting, and sharing, powered by Artificial Intelligence to help formulate clearer questions, suggest options, and contextualize topics for voters.

---

## ✨ Key Features

- ** AI-assisted creation and suggestions:** Automatically generate question ideas and answer options from a topic or draft.
- ** "Explain this poll" feature:** AI summarizes and contextualizes the poll topic for voters, facilitating informed decisions without leaving the page.
- ** Multiple choice and Single choice:** Create flexible polls where participants can choose either a single option or multiple options simultaneously.
- ** Quick sharing:** Direct links to share your polls with friends, teams, or communities and track results instantly.
- ** Google Authentication:** Fast and secure login via Google OAuth 2.0.
- ** *Coming soon:*** New engagement features, advanced filters, custom expiration, image polls, and detailed vote analytics.

---

## 🛠️ Technologies Used

The project is structured in a unified repository divided into **Backend (`api/`)** and **Frontend (`web/`)**:

### Backend ([`api/`](./api))
- **[NestJS 11](https://nestjs.com/) & [TypeScript](https://www.typescriptlang.org/):** Modular Node.js framework for building the RESTful API.
- **[Prisma ORM 7](https://www.prisma.io/):** Type-safe object-relational mapping and migration management (`@prisma/client` with `@prisma/adapter-mariadb`).
- **[MySQL 8.4](https://www.mysql.com/):** Relational database.
- **[OpenRouter SDK](https://openrouter.ai/) (`@openrouter/sdk`):** Integration with large language models (LLMs) for poll suggestions and AI-generated explanations.
- **[Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs):** OAuth 2.0 authentication with Google accounts.
- **[Pino](https://getpino.io/) (`nestjs-pino`) & `@nestjs/throttler`:** High-performance structured logging and endpoint rate-limiting protection.
- **[Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest):** API integration and contract testing (E2E).

### Frontend ([`web/`](./web))
- **[Angular 21](https://angular.dev/) & [TypeScript](https://www.typescriptlang.org/):** Modern SPA application using *Signals* and *Standalone* components.
- **[Taiga UI](https://taiga-ui.dev/) (`v4`):** Rich, accessible, and responsive UI component library.
- **[LESS](https://lesscss.org/):** CSS preprocessor for modular styling.
- **[Vitest](https://vitest.dev/):** Fast unit test runner for the frontend.

### Infrastructure & DevOps
- **[Docker](https://www.docker.com/) & Docker Compose:** Full environment orchestration (MySQL, API, and Web with Nginx).

---

## 🚀 How to Run the Project

### Prerequisites
- **Docker** and **Docker Compose** (to run everything containerized or just the database)
- **Node.js 22+** and **npm** (for local development)
- Google Cloud Console OAuth 2.0 credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`)
- OpenRouter API Key (`OPENROUTER_API_KEY`) for AI features

---

### Running everything with Docker Compose

1. Copy the environment variables file in the project root:
   ```bash
   cp .env.example .env
   ```
2. Fill in the `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `OPENROUTER_API_KEY` variables in the `.env` file.
3. Start the containers:
   ```bash
   docker compose up --build
   ```
4. Access the application at `http://localhost:4200` (API available at `http://localhost:8080`).

---

## 🧪 Running Tests

- **API Tests (Jest / Supertest):**
  ```bash
  cd api && npm test
  ```

- **Frontend Tests (Vitest):**
  ```bash
  cd web && npm test
  ```
