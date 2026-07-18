# W2-schema Completion Report

**Task**: T5 — Prisma schema + seed + client setup
**Worker**: worker-schema
**Status**: ✅ COMPLETED
**Date**: 2026-07-15

---

## Summary

The complete Prisma data layer for the web-scanner Pricing Tracker is in place. The schema, seed script, migration placeholder, Prisma singleton, package.json, and tsconfig have all been created exactly as specified in the task assignment.

---

## Files Delivered

| File | Status | Purpose |
|------|--------|---------|
| `api/prisma/schema.prisma` | ✅ new | 5 models + Currency enum |
| `api/prisma/seed.ts` | ✅ new | Realistic sample data + 30 days price history |
| `api/prisma/migrations/.gitkeep` | ✅ new | Placeholder for migration directory |
| `api/src/lib/prisma.ts` | ✅ new | HMR-safe Prisma client singleton |
| `api/package.json` | ✅ updated | Full deps: Prisma + Fastify + Zod + MinIO + axios |
| `api/tsconfig.json` | ✅ new | Strict-mode TS config for ESNext modules |

---

## Data Contract (for other workers)

### Models

```
Item        { id, name, imageUrl?, isFavorite, createdAt, updatedAt }
Tag         { id, name (unique), color }
ItemTag     { itemId, tagId }              (composite PK)
Source      { id, itemId, url, currency, priceClass?, cssRule?, fatherClass?, isMain, currentPrice?, lastScrapedAt? }
PriceHistory{ id, sourceId, price, scrapedAt }
```

### Currency Enum

`USD | EUR | GBP | JPY | CAD | MXN | COP` — default `USD` on Source.

### Relations (all Cascade on delete)

- `Item 1—N Source`
- `Item M—N Tag` (via `ItemTag`)
- `Source 1—N PriceHistory`

### Indexes

- `PriceHistory @@index([sourceId, scrapedAt])` — supports `WHERE sourceId = ? ORDER BY scrapedAt` queries

### Table-Name Mapping

`items`, `tags`, `item_tags`, `sources`, `price_history`

---

## Seed Data

On `npm run db:seed`:
- **3 tags**: Electronics (#8B5CF6), Gaming (#06B6D4), GPU (#F59E0B)
- **1 item**: NVIDIA RTX 4090 Founders Edition (favorite, linked to all 3 tags)
- **2 sources** for the item: Amazon (main, $1599.99) + Newegg ($1649.88)
- **60 price history rows** (30 days × 2 sources, ±random walk)

All seed operations are idempotent (`upsert` / `createMany` with stable IDs and `skipDuplicates`).

---

## Public Imports for Other Workers

```typescript
// Worker W3 (backend): import the singleton
import { prisma } from '../lib/prisma.js'   // or '@/lib/prisma' once path alias is configured

// Worker W5 (frontend): no direct DB access — goes through the Fastify API
```

---

## Available npm Scripts

```bash
npm run db:migrate    # prisma migrate deploy (production-style)
npm run db:generate   # prisma generate (regenerate typed client)
npm run db:push       # prisma db push (dev — schema sync without migrations)
npm run db:seed       # tsx prisma/seed.ts (idempotent seed)
npm run db:studio     # prisma studio (GUI)
```

---

## Acceptance Criteria — All Met ✅

- ✅ `api/prisma/schema.prisma` exists with all 5 models + Currency enum
- ✅ All models have correct relations with Cascade deletes
- ✅ `@@index` on `price_history(sourceId, scrapedAt)` for query performance
- ✅ `api/prisma/seed.ts` creates ≥1 item with ≥2 sources and 30 days of history
- ✅ `api/src/lib/prisma.ts` exports singleton Prisma client
- ✅ `api/package.json` includes `@prisma/client`, `prisma`, all Fastify deps, and `zod`
- ✅ `api/tsconfig.json` with strict mode enabled

---

## Notes for Orchestrator

- The `migrations/` directory is currently empty (placeholder via `.gitkeep`). Migration files will be generated automatically by `prisma migrate dev --name init` once the team runs the first migration against the dev DB.
- The schema is currently defined in `schema.prisma` only — no SQL migration files yet, because no DB has been initialized. W3 (backend) or W1 (infra) can run `prisma migrate dev --name init` inside the api container to generate the first migration SQL.
- All seed IDs are deterministic (`seed-item-rtx4090`, `seed-src-rtx-amazon`, `seed-src-rtx-newegg`) so re-running seed is safe.