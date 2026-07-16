# The Garden

A peaceful third-person Christian adventure game. The player explores beautiful
environments, completes scripture-based quests, helps NPCs, grows gardens,
solves puzzles, and progresses through seven symbolic worlds representing
different stages of faith. Integrates with the YouVersion Bible API for
verses, reading plans, and scripture-based gameplay.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architectural
breakdown and design decisions.

## Stack

| Layer      | Technology                                                                 |
|------------|-----------------------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, React Three Fiber, Three.js, Drei, Rapier, TailwindCSS v4, React Router, TanStack Query, Zustand, Framer Motion |
| Backend    | Spring Boot 4.1, Java 21, Spring Security, Spring Data JPA, Gradle, PostgreSQL, Swagger/OpenAPI |
| Deployment | Frontend → Vercel · Backend → Railway · Database → Neon PostgreSQL         |

> **Note:** The stack originally specified Spring Boot 3. Spring Boot 3.x reached
> open-source end-of-life on June 30, 2026, so the backend was scaffolded on
> Spring Boot 4.1 (Spring Framework 7) instead — still fully Java 21 compatible.
> See Milestone 1 notes for details.

## Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io/) 9+
- Java 21 (Temurin recommended)
- Docker (for local Postgres, or full containerized dev)

## Getting Started

### Option A — Docker Compose (full stack)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- Postgres: localhost:5432

### Option B — Run locally

```bash
# 1. Install frontend/workspace dependencies
pnpm install

# 2. Start Postgres only
docker compose up -d postgres

# 3. Run the backend (separate terminal)
cd backend
cp .env.example .env   # adjust if needed
./gradlew bootRun --args='--spring.profiles.active=dev'

# 4. Run the frontend (separate terminal)
cd frontend
cp .env.example .env
pnpm dev
```

## Common Commands

```bash
# Root (Turborepo — runs across all workspace packages)
pnpm build
pnpm lint
pnpm test
pnpm typecheck

# Frontend only
pnpm --filter @the-garden/frontend dev
pnpm --filter @the-garden/frontend test

# Backend only
cd backend
./gradlew bootRun
./gradlew test
./gradlew build
```

## Repository Structure

```
the-garden/
├── frontend/                # React 19 + Vite + R3F client
├── backend/                 # Spring Boot 4.1 API
├── packages/
│   └── shared-types/         # TypeScript contracts mirroring backend DTOs
├── docs/                    # Architecture and process documentation
├── docker-compose.yml         # Local full-stack dev environment
└── .github/workflows/ci.yml   # CI: lint, typecheck, test, build
```

## License

Proprietary — all rights reserved.
