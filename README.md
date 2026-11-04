# 📊 Enquete.me

O **Enquete.me** é uma plataforma moderna para criação, votação e compartilhamento de enquetes em tempo real, potencializada por Inteligência Artificial para ajudar a formular perguntas mais claras, sugerir opções e contextualizar temas para os votantes.

---

## ✨ Principais Funcionalidades

- **🤖 Criação com auxílio e sugestões de IA:** Gere ideias de perguntas e opções de resposta automaticamente a partir de um tema ou rascunho.
- **💡 Recurso "Explicar essa enquete":** A IA resume e contextualiza o assunto da enquete para quem está votando, facilitando decisões informadas sem precisar sair da página.
- **☑️ Múltipla escolha e Escolha única:** Crie enquetes flexíveis onde o participante pode escolher apenas uma opção ou várias opções simultaneamente.
- **🔗 Compartilhamento rápido:** Links diretos para divulgar suas enquetes com amigos, equipes ou comunidades e acompanhar os resultados instantaneamente.
- **🔐 Autenticação com Google:** Login rápido e seguro via Google OAuth 2.0.
- **🚀 *Em breve:*** Novas funcionalidades de engajamento, filtros avançados, expiração customizada e análises detalhadas de votos.

---

## 🛠️ Tecnologias Utilizadas

O projeto é estruturado em um repositório unificado dividindo o **Backend (`api/`)** e o **Frontend (`web/`)**:

### Backend ([`api/`](./api))
- **[NestJS 11](https://nestjs.com/) & [TypeScript](https://www.typescriptlang.org/):** Framework Node.js modular para construção da API RESTful.
- **[Prisma ORM 7](https://www.prisma.io/):** Mapeamento objeto-relacional tipado e gerenciamento de migrações (`@prisma/client` com `@prisma/adapter-mariadb`).
- **[MySQL 8.4](https://www.mysql.com/):** Banco de dados relacional.
- **[OpenRouter SDK](https://openrouter.ai/) (`@openrouter/sdk`):** Integração com modelos de linguagem (LLMs) para sugestões de enquetes e geração de explicações por IA.
- **[Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs):** Autenticação OAuth 2.0 com conta Google.
- **[Pino](https://getpino.io/) (`nestjs-pino`) & `@nestjs/throttler`:** Logs estruturados de alta performance e proteção de rate-limiting nos endpoints.
- **[Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest):** Testes de integração e contrato da API (E2E).

### Frontend ([`web/`](./web))
- **[Angular 21](https://angular.dev/) & [TypeScript](https://www.typescriptlang.org/):** Aplicação SPA moderna utilizando *Signals* e componentes *Standalone*.
- **[Taiga UI](https://taiga-ui.dev/) (`v4`):** Biblioteca de componentes de interface rica, acessível e responsiva.
- **[LESS](https://lesscss.org/):** Pré-processador CSS para estilização modular.
- **[Vitest](https://vitest.dev/):** Execução rápida de testes unitários no frontend.

### Infraestrutura & DevOps
- **[Docker](https://www.docker.com/) & Docker Compose:** Orquestração completa do ambiente (MySQL, API e Web com Nginx).

---

## 📁 Estrutura do Repositório

```text
enqueteme/
├── api/                  # Backend NestJS 11 + Prisma ORM
│   ├── prisma/           # Schema do banco de dados e migrações
│   ├── src/              # Módulos de domínio (enquete, auth, ai, usuario, etc.)
│   └── test/             # Testes E2E com Jest e Supertest
├── web/                  # Frontend Angular 21 + Taiga UI
│   └── src/app/
│       ├── features/     # Telas e fluxos principais da aplicação
│       └── shared/       # Componentes, serviços e tipos compartilhados
└── docker-compose.yml    # Orquestração dos containers (db, api, web)
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Docker** e **Docker Compose** (para rodar tudo containerizado ou apenas o banco de dados)
- **Node.js 22+** e **npm** (para desenvolvimento local)
- Credenciais OAuth 2.0 do Google Cloud Console (`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`)
- Chave de API da OpenRouter (`OPENROUTER_API_KEY`) para os recursos de IA

---

### Opção 1: Rodando tudo com Docker Compose

1. Copie o arquivo de variáveis de ambiente na raiz do projeto:
   ```bash
   cp .env.example .env
   ```
2. Preencha as variáveis `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `OPENROUTER_API_KEY` no arquivo `.env`.
3. Suba os containers:
   ```bash
   docker compose up --build
   ```
4. Acesse a aplicação em `http://localhost:4200` (API disponível em `http://localhost:8080`).

---

### Opção 2: Ambiente de Desenvolvimento Local

1. **Inicie o banco de dados MySQL via Docker:**
   ```bash
   docker compose up -d db
   ```

2. **Configure e inicie a API (`api/`):**
   ```bash
   cd api
   npm ci
   cp .env.example .env
   # Adicione suas chaves GOOGLE_* e OPENROUTER_* no arquivo api/.env
   npx prisma migrate deploy
   npm run start:dev
   ```
   A API estará rodando em `http://localhost:8080`.

3. **Configure e inicie o Frontend (`web/`):**
   Em outro terminal:
   ```bash
   cd web
   npm ci
   npm start
   ```
   O servidor de desenvolvimento do Angular iniciará em `http://localhost:4200` (com proxy configurado para `/api`).

---

## 🧪 Executando os Testes

- **Testes da API (Jest / Supertest):**
  ```bash
  cd api && npm test
  ```

- **Testes do Frontend (Vitest):**
  ```bash
  cd web && npm test
  ```
