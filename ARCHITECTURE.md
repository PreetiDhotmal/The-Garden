# Architecture

This document is the source of truth for architectural rules on The Garden.
Every future milestone must comply with it. Changes to this document require
explicit approval before code that violates the previous rules is merged.

## Guiding Principles

- **Clean Architecture**: dependencies point inward. `domain` depends on
  nothing. `application` depends only on `domain`. `infrastructure` and
  `presentation` depend on `application` and `domain`, never the reverse.
- **SOLID**: every class has one reason to change; new behavior is added by
  extension (new classes/strategies), not by editing stable classes into
  branchy conditionals.
- **DDD where it earns its keep**: bounded contexts (World, Quest, Garden,
  Scripture, Player) get their own domain packages. We do not force DDD
  tactical patterns (aggregates, repositories-as-interfaces) onto trivial
  CRUD concerns where they add ceremony without value.
- **No `any` in TypeScript.** `strictTypeChecked` ESLint rules are enforced
  in CI — violations fail the build, not just warn.

## Frontend Layering

```
src/
├── domain/          Pure TS. No React, no fetch, no Three.js. Business rules
│                     and value objects only (e.g. FaithWorldProgression).
├── application/       Use-cases as hooks/services. Orchestrates domain logic
│                     and infrastructure ports. This is where TanStack Query
│                     hooks live — they are the application layer's
│                     interface to the outside world.
├── infrastructure/    Concrete adapters: HTTP client, YouVersion API client
│                     (future), Three.js scene setup, persistence.
├── presentation/       React components, routes, Zustand stores (UI state
│                     only — domain state belongs in domain/application).
└── shared/           Cross-cutting: styles, constants, generic utilities.
```

**Rule:** a file in `domain/` must never import from `presentation/` or
`infrastructure/`. A file in `presentation/` should not construct an
`ApiClient` directly — it consumes `application/` hooks.

## Backend Layering (Hexagonal)

```
src/main/java/com/thegarden/
├── domain/            Entities, value objects, domain services, domain
│                       exceptions. No Spring annotations except where a
│                       framework-free approach adds no value (kept pure
│                       Java 21 wherever practical).
├── application/         Use-case services, DTOs, mappers. Orchestrates
│                       domain + infrastructure ports (repository
│                       interfaces, etc).
├── infrastructure/      JPA repository implementations, Spring Security
│                       config, CORS/Web config, OpenAPI config, future
│                       YouVersion API client.
└── presentation/         REST controllers, `@RestControllerAdvice`
                        exception handling, request/response mapping.
```

**Rule:** controllers depend only on `application` services, never on JPA
repositories or other infrastructure classes directly.

## Cross-Boundary Contracts

`packages/shared-types` is the single source of truth for shapes that cross
the frontend/backend boundary. Every backend DTO in `application/dto` has a
matching hand-mirrored type in `packages/shared-types/src`, cross-referenced
via doc comments in both directions. This is deliberately **not** codegen —
codegen from OpenAPI is a reasonable future milestone once the API surface
stabilizes, but for now explicit mirroring keeps both sides simple to read
and diff in review.

## The Seven Worlds

`FaithWorld` (frontend: `packages/shared-types/src/faith-world.ts`, backend:
`domain/world/FaithWorld.java`) is the canonical ordering of the seven
symbolic worlds. Enum/const declaration order **is** the unlock order — do
not reorder without a deliberate migration plan, since progression logic on
both sides depends on ordinal/index comparisons.

## Testing Strategy

- **Domain layer**: pure unit tests, no framework bootstrap. Fast, exhaustive
  on business rules (see `FaithWorldProgressionTest` on both sides as the
  reference example).
- **Backend web layer**: `@WebMvcTest` slices with explicit `@Import` of the
  real security configuration, so tests exercise production security
  posture rather than a test-only default.
- **Frontend**: Vitest + Testing Library for components/hooks; domain logic
  tested directly with no rendering.

## Deployment Topology

- **Frontend** → Vercel (static build output from `frontend/dist`).
- **Backend** → Railway (container built from `backend/Dockerfile`).
- **Database** → Neon PostgreSQL (serverless Postgres; `prod` Spring profile
  expects `DATABASE_URL`/`DATABASE_USERNAME`/`DATABASE_PASSWORD`).

## Decision Log

| Date       | Decision                                                                 | Reason |
|------------|---------------------------------------------------------------------------|--------|
| 2026-07-16 | Backend built on Spring Boot 4.1 instead of specified Spring Boot 3.x     | Spring Boot 3.x reached OSS EOL on 2026-06-30. 4.1 is Java 21-compatible. |
| 2026-07-16 | TypeScript pinned to 5.9.x, not the newer 7.x native compiler            | `typescript-eslint` does not yet support TS7's peer range; 5.9 is the mature, fully-tooled line. |
| 2026-07-16 | Tailwind v4 (CSS-first `@theme`, no `tailwind.config.js`)                | Current stable major; simplifies config, verified working with the Vite plugin. |
| 2026-07-16 | Spring Security added with a permissive baseline, no JWT filter yet      | No protected resources exist yet in Milestone 1; wiring a real JWT flow before there's anything to protect would be premature/fake scaffolding. Tracked as a future milestone. |
| 2026-07-16 | `spring-boot-starter-web` → `spring-boot-starter-webmvc`; added `spring-boot-starter-webmvc-test` and `spring-boot-starter-security-test`; `@WebMvcTest` import moved to `org.springframework.boot.webmvc.test.autoconfigure` | Spring Boot 4.0 modularized the autoconfigure and test-autoconfigure jars per-technology, renaming several starters and moving `@WebMvcTest`'s package. The 3.x-era names/imports don't exist in 4.1 — this was a genuine local-build failure, fixed by aligning with the official 4.0 migration guide, not a design change. |
