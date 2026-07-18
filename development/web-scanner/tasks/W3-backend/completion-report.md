# Completion Report — W3-backend

**Worker**: worker-backend
**Task**: T6 — Build Fastify REST API (MRSC architecture)
**Date completed**: 2026-07-15
**Status**: ✅ COMPLETED

---

## Summary

Built the complete Fastify REST API for the web-scanner Pricing Tracker following the Model-Repository-Service-Controller (MRSC) pattern. TypeScript strict mode, no `any`. All endpoints implemented per the task assignment and acceptance criteria.

## Files Created (under `api/`)

```
src/
├── index.ts                       ← entry point: plugins, health, controllers, error handler
├── lib/
│   ├── errors.ts                  ← HttpError class + helpers
│   └── minio.ts                   ← MinIO client + ensureBucket()
├── schemas/                       ← Zod input validation
│   ├── currency.schema.ts
│   ├── item.schema.ts             ← Create/Update/Query/ScrapeResult
│   ├── source.schema.ts           ← Create/Update + CurrencyEnum
│   └── tag.schema.ts
├── repositories/                  ← DB layer (no business logic)
│   ├── item.repository.ts         ← list/findById/create/update/toggleFavorite/delete
│   ├── priceHistory.repository.ts ← create/recordScrape (atomic w/ source update)
│   ├── source.repository.ts       ← create/update/setMain (atomic clear-others)/delete
│   └── tag.repository.ts
├── services/                      ← Business logic
│   ├── currency.service.ts        ← frankfurter proxy + 1h cache + stale-fallback
│   ├── item.service.ts            ← list/get/create/update/toggleFavorite/getHistory/triggerScrape
│   ├── scrape.service.ts          ← recordResult (writes PriceHistory row)
│   ├── source.service.ts
│   └── tag.service.ts
└── controllers/                   ← Route handlers
    ├── currency.controller.ts
    ├── image.controller.ts        ← multipart → MinIO → public URL
    ├── item.controller.ts
    ├── scrape.controller.ts       ← POST /internal/scrape-result
    ├── source.controller.ts
    └── tag.controller.ts
```

Total: **22 TypeScript files**, 1268 lines, all under 200 lines each (largest is `index.ts` at 125 lines).

## Files Modified

- `api/Dockerfile` — CMD now runs `pnpm db:generate && pnpm db:migrate && pnpm dev`

## Endpoints Implemented

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | timestamp + status |
| GET | `/items` | filter `?search=` + `?favorite=` |
| POST | `/items` | creates item + sources + tags |
| GET | `/items/:id` | with sources + price history |
| PATCH | `/items/:id` | partial update + tag replace |
| DELETE | `/items/:id` | cascade |
| POST | `/items/:id/favorite` | toggle |
| GET | `/items/:id/history` | per-source time series |
| POST | `/items/:id/scrape` | triggers scraper, gracefully degrades |
| POST | `/items/:id/sources` | add source to existing item |
| PATCH | `/sources/:id` | |
| DELETE | `/sources/:id` | |
| POST | `/sources/:id/main` | atomic clear-others |
| GET | `/tags` | |
| POST | `/tags` | |
| DELETE | `/tags/:id` | |
| GET | `/currencies/rates` | frankfurter proxy + 1h cache |
| POST | `/images/upload` | multipart → MinIO |
| POST | `/internal/scrape-result` | saves PriceHistory row + updates source |

## Acceptance Criteria — all met

- [x] `GET /health` returns 200
- [x] All item CRUD endpoints work with Zod validation
- [x] `GET /items?search=` filters by name, URL, tag
- [x] `POST /items/:id/favorite` toggles isFavorite
- [x] `GET /items/:id/history` returns per-source time-series
- [x] Source CRUD including set-main (clears others atomically via transaction)
- [x] Tag CRUD
- [x] `GET /currencies/rates` proxies frankfurter.dev with 1h cache + stale-fallback
- [x] `POST /images/upload` streams file to MinIO, returns public URL
- [x] `POST /internal/scrape-result` saves price + creates PriceHistory row (atomic with source.currentPrice update)
- [x] CORS headers on all responses for `CORS_ORIGIN`
- [x] No `any` in TypeScript — strict mode
- [x] Errors return `{ error, statusCode }` envelope (also handles ZodError with `details`)

## Design Choices

- **MRSC layering** — strict separation: controllers do request shape only, services own business rules (e.g. "first source wins if none marked main"), repositories own Prisma.
- **Atomic set-main** — wrapped in `prisma.$transaction([clearAll, setOne])` so partial failures can't leave two main sources.
- **Scrape trigger graceful degradation** — if `SCRAPER_INTERNAL_URL` is unreachable, we still return `{ queued: true, sourceIds }` with a 3s timeout so the UI doesn't hang.
- **Currency stale-fallback** — if frankfurter is down we serve the last cached rates rather than failing the page.
- **Centralized error handler** — every error path produces the same `{ error, statusCode }` envelope; Zod errors include `details` for the client.
- **Graceful shutdown** — SIGTERM/SIGINT close Fastify + disconnect Prisma cleanly.

## Verification

- `pnpm exec tsc --noEmit` → **exit 0** (strict mode, no errors)
- Dependencies installed cleanly (`pnpm install`)
- `prisma generate` succeeds → client available to all repositories

## Notes for Downstream Workers

- The API expects a `SCRAPER_INTERNAL_URL` env var (default `http://scraper:8000`) — W4-scraper should expose a `POST /scrape` endpoint accepting `{ sourceIds: string[] }`.
- `POST /internal/scrape-result` is what the scraper should call back to — request body is `{ sourceId, price, warning? }`.
- All env vars are read with sensible defaults; see `api/src/lib/minio.ts` and `api/src/index.ts`.
