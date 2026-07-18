# Feature Plan: web-scanner

## Objective

Build a Dockerized, modular web price-scraper with a **Pricing Tracker** module. The Pricing Tracker lets users track product prices across multiple sources, stores price history, and visualizes it with interactive charts.

**Two-phase delivery (enforced gate)**:
1. **Design Phase** — Superdesign generates UI drafts; user approves before any implementation code is written
2. **Implementation Phase** — Multi-worker build across Frontend, Backend, Database, Scraper, and Infrastructure layers

## Assumptions & Constraints

- Greenfield project — no existing codebase patterns to extend
- All services run in Docker containers orchestrated by Docker Compose
- Nuxt 4 frontend calls a **separate** backend API (not Nuxt server routes)
- Backend API runtime: **Node.js + Fastify** (fast, TypeScript-native, lightweight — preferred over Python/FastAPI for JSON API with Prisma)
- PostgreSQL + Prisma for all persistence
- Python container handles scraping only (no HTTP server needed; communicates via queue or direct DB writes)
- MinIO for S3-compatible image storage
- Currency conversion uses frankfurter.dev (no API key, free)
- No authentication in scope

## Existing Patterns Used

N/A — greenfield. All patterns will be established by this implementation.

**Conventions to establish**:
- Frontend: `composables/use{Feature}.ts`, `stores/{feature}.ts`, `components/{Feature}/{Component}.vue`, `pages/{feature}/index.vue`
- Backend: `src/controllers/{feature}.controller.ts`, `src/services/{feature}.service.ts`, `src/repositories/{feature}.repository.ts`, `src/models/{feature}.model.ts`
- Zod schemas co-located with their domain: `src/schemas/{feature}.schema.ts`

## Requirements

See `01-requirements-web-scanner.md` for full list (A1–A4, PT1–PT17, SC1–SC4, BE1–BE5, IN1–IN4, NF1–NF5).

## Technical Approach

### Frontend (Nuxt 4 + Vue 3 + PrimeVue)

- **PrimeVue Material theme** with violet primary + surface-mist via `nuxt.config.ts` theme config
- **Tailwind** for layout utilities alongside PrimeVue components
- **Pinia** for state management (favorites, items cache, theme preference)
- **PrimeVue Chart** component (Chart.js wrapper) for price history graphs
- **Zod** for validating API responses before storing in state
- Dark/light toggle reads `window.matchMedia('(prefers-color-scheme: dark)')` on mount; stored in `localStorage`
- Image upload: `<input type="file">` → POST multipart to backend → backend streams to MinIO → returns URL
- Currency conversion: computed property applying exchange rate fetched from `/api/currencies`

### Backend API (Node.js + Fastify)

- **Fastify** with `@fastify/cors`, `@fastify/multipart` (image upload), `@fastify/formbody`
- **Prisma** client for all DB operations
- **Zod** schemas for request validation
- CORS origin set to `NUXT_ORIGIN` env var
- Scrape trigger: HTTP POST to Python scraper container's internal endpoint, or writes a `scrape_jobs` table row that the Python worker polls
- Exchange rates: cached in memory for 1 h max

### Database (PostgreSQL + Prisma)

**Core models**:
```
Item        { id, name, imageUrl, isFavorite, createdAt }
Tag         { id, name }
ItemTag     { itemId, tagId }
Source      { id, itemId, url, currency, priceClass, cssRule, fatherClass, isMain, lastScrapedAt }
PriceHistory{ id, sourceId, price, scrapedAt }
```

### Python Scraper

- `requests` + `beautifulsoup4` for HTML fetching/parsing
- Selector strategy: if only `priceClass` set → `soup.find(class_=priceClass)`; if `fatherClass` also set → find father then child; if `cssRule` set → `soup.select(cssRule)`
- Warns backend if multiple elements found (returns warning flag in response)
- `apscheduler` for 8-hour cron + startup trigger
- Communicates results to backend via internal HTTP (POST `/internal/scrape-result`)

### Infrastructure (Docker Compose)

```
services:
  frontend   → Nuxt 4 (port 3000)
  api        → Fastify (port 4000)
  scraper    → Python (no external port)
  db         → PostgreSQL 16 (port 5432 internal)
  storage    → MinIO (port 9000/9001)
```

All secrets via `.env` file; `docker-compose.yml` references `${VAR}`.

## Risk & Unknowns

| Risk | Mitigation |
|------|-----------|
| PrimeVue Material theme config for Nuxt 4 may differ from docs | Use `primevue.dev/nuxt` exact setup; test early in design phase |
| Python scraper may fail on JS-rendered pages | Flag as known limitation; document that JS-heavy pages may need Playwright fallback in v2 |
| MinIO presigned URL CORS config can be tricky | Configure MinIO CORS policy via `mc` in Docker entrypoint |
| Frankfurter.dev rate limits (if any) | Cache rates for 1 h in API memory |

## Implementation Scope

### Phase 1 — Design (GATE: user approves before Phase 2)

**W1-design**: Run superdesign skill to create UI drafts for all Pricing Tracker screens:
1. App shell (sidenav + theme toggle)
2. Item list / search
3. Create item modal (with source repeater)
4. Item detail screen (sources + charts)
5. Favorites section

User reviews canvas drafts → approves → Phase 2 begins.

### Phase 2 — Infrastructure & Data Layer (parallel)

**W1-infra**: Docker Compose + MinIO + PostgreSQL setup, env files, CORS config
**W2-schema**: Prisma schema + migrations + seed script

### Phase 3 — Backend API (depends on Phase 2)

**W3-backend**: Fastify API — all CRUD endpoints, scrape trigger, history endpoint, currency proxy

### Phase 4 — Python Scraper (depends on Phase 2 schema)

**W4-scraper**: Python scraper container — selector logic, scheduler, result POST to API

### Phase 5 — Frontend (depends on Phase 3 API contract)

**W5-frontend**: Nuxt 4 app — all pages, components, stores, PrimeVue theme, dark/light toggle, charts, currency conversion

### Phase 6 — Integration & Testing (depends on all above)

**W6-qa**: E2E smoke test — `docker compose up`, verify happy paths work end-to-end

## New Artifacts Proposed

| Artifact | Why Needed |
|----------|-----------|
| `docker-compose.yml` | Orchestrates all 5 containers |
| `frontend/` (Nuxt 4 app) | Complete frontend application |
| `api/` (Fastify backend) | Decoupled REST API |
| `scraper/` (Python) | Price scraping service |
| `db/prisma/` | Schema + migrations |
| `.superdesign/` | Design system + canvas drafts |
| `.env.example` | Environment variable template |

**7 new top-level artifacts** — all require user approval.

## Open Items

- Backend runtime confirmed as Node.js/Fastify (assumption; user can override)
- MinIO confirmed as image storage (assumption; user can override)
- No auth in scope (confirmed out of scope)

## References

- `00-intake-web-scanner.md`
- `01-requirements-web-scanner.md`
- `initial-requirements/web-scrapper-requirements.md`
- PrimeVue Nuxt: https://primevue.dev/nuxt
- Frankfurter API: https://frankfurter.dev/
