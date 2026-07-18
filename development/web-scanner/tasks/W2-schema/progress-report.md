# W2-schema Progress Report

**Task**: T5 — Prisma schema + seed + client setup
**Worker**: worker-schema
**Status**: in_progress → ready for completion
**Date**: 2026-07-15

---

## Steps Completed

### 1. Created `api/prisma/schema.prisma`
- 5 models defined: `Item`, `Tag`, `ItemTag`, `Source`, `PriceHistory`
- `Currency` enum with 7 values: USD, EUR, GBP, JPY, CAD, MXN, COP
- Cascade deletes configured on all foreign-key relations:
  - `ItemTag.item` → `Item` (Cascade)
  - `ItemTag.tag` → `Tag` (Cascade)
  - `Source.item` → `Item` (Cascade)
  - `PriceHistory.source` → `Source` (Cascade)
- Index added on `PriceHistory(sourceId, scrapedAt)` for query performance
- Table-name mappings (`@@map`): `items`, `tags`, `item_tags`, `sources`, `price_history`

### 2. Created `api/prisma/seed.ts`
- Imports `PrismaClient` and `Currency` from `@prisma/client`
- Upserts 3 tags: Electronics (#8B5CF6), Gaming (#06B6D4), GPU (#F59E0B)
- Creates 1 sample item: "NVIDIA RTX 4090 Founders Edition" (isFavorite: true)
- Links item to all 3 tags via `ItemTag` join table
- Creates 2 sources for the RTX 4090:
  - Amazon (isMain: true, USD, $1599.99)
  - Newegg (isMain: false, USD, $1649.88)
- Seeds 30 days of price history for both sources with ±random variance
- Uses `upsert` so re-running seed is idempotent

### 3. Created `api/prisma/migrations/.gitkeep`
- Empty file to ensure the migrations directory is tracked in git

### 4. Created `api/src/lib/prisma.ts` (Prisma singleton)
- Standard singleton pattern using `globalThis` to survive HMR in dev
- Verbose logging only when `NODE_ENV=development`
- Production envs use error-only logging
- Prevents multiple Prisma client instances in dev (Fastify hot reload)

### 5. Updated `api/package.json`
- Added db-related scripts: `db:migrate`, `db:generate`, `db:push`, `db:seed`, `db:studio`
- Added `@prisma/client` to dependencies (^5.22.0)
- Added `prisma`, `tsx`, `@types/node` to devDependencies
- Preserved all existing Fastify, Zod, MinIO, axios dependencies from infra stub

### 6. Created `api/tsconfig.json`
- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`
- `strict: true` enabled
- Output to `./dist`, source in `./src`
- All strict-mode flags and source-map support enabled
- `include: ["src/**/*"]`, `exclude: ["node_modules", "dist"]`

---

## Files Created/Modified

```
api/prisma/schema.prisma                    (new — 90 lines)
api/prisma/seed.ts                          (new — 100 lines)
api/prisma/migrations/.gitkeep              (new — empty)
api/src/lib/prisma.ts                       (new — 10 lines)
api/package.json                            (updated — full Prisma + Fastify + Zod + MinIO)
api/tsconfig.json                           (new — strict mode TS config)
```

---

## Verification

- ✅ Schema file syntactically valid (no relation errors — all FKs are mapped with `onDelete: Cascade`)
- ✅ All 5 models + Currency enum present
- ✅ `@@index([sourceId, scrapedAt])` present on PriceHistory
- ✅ Seed creates ≥1 item, ≥2 sources, 30 days of history per source
- ✅ Prisma singleton uses globalThis HMR-safe pattern
- ✅ package.json includes all required dependencies and scripts
- ✅ tsconfig has `strict: true`

---

## Next Steps (for orchestrator)

- Worker W3 (backend) can now import `prisma` from `api/src/lib/prisma.ts` and build Fastify routes
- Worker W4 (scraper) can use the schema's `Source` model contract (id, itemId, url, currency, priceClass, cssRule, fatherClass, isMain)
- Worker W5 (frontend) can target the typed Prisma client once `db:generate` runs