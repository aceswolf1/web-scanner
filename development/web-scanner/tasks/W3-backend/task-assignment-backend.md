# Task Assignment: W3-backend

**Worker**: worker-backend
**Role**: pt-backend-eng
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: 3 — Fastify API

---

## Objective

Build the complete Fastify REST API for the web-scanner Pricing Tracker. The API lives in `api/`. The Prisma schema is already at `api/prisma/schema.prisma` and `api/package.json` already has all dependencies listed — read both before writing any code.

---

## Task IDs

- **T6** = your task. Call `TaskUpdate(taskId: "6", status: "in_progress", owner: "worker-backend")` immediately.

---

## Architecture: Model-Repository-Service-Controller (MRSC)

```
api/
├── src/
│   ├── index.ts               ← Fastify entry point
│   ├── lib/
│   │   ├── prisma.ts          ← already exists — DO NOT overwrite
│   │   └── minio.ts           ← MinIO client singleton
│   ├── schemas/               ← Zod schemas (shared between controller + service)
│   │   ├── item.schema.ts
│   │   ├── source.schema.ts
│   │   ├── tag.schema.ts
│   │   └── currency.schema.ts
│   ├── repositories/          ← DB access only, no business logic
│   │   ├── item.repository.ts
│   │   ├── source.repository.ts
│   │   ├── tag.repository.ts
│   │   └── priceHistory.repository.ts
│   ├── services/              ← Business logic, calls repositories
│   │   ├── item.service.ts
│   │   ├── source.service.ts
│   │   ├── tag.service.ts
│   │   ├── scrape.service.ts
│   │   └── currency.service.ts
│   └── controllers/           ← Route handlers, calls services, validates with Zod
│       ├── item.controller.ts
│       ├── source.controller.ts
│       ├── tag.controller.ts
│       ├── scrape.controller.ts
│       ├── currency.controller.ts
│       └── image.controller.ts
├── prisma/                    ← already exists
└── package.json               ← already exists
```

---

## API Endpoints

### Health
```
GET /health → { status: "ok", timestamp: string }
```

### Items
```
GET    /items                     → { items: Item[], total: number }
         ?search=string           (filter by name, source URL, or tag name)
         ?favorite=true|false     (filter favorites)
POST   /items                     → { item: Item }
GET    /items/:id                 → { item: ItemWithSourcesAndHistory }
PATCH  /items/:id                 → { item: Item }
DELETE /items/:id                 → { success: true }
POST   /items/:id/favorite        → { item: Item }   (toggle)
GET    /items/:id/history         → { history: { sourceId, sourceName, sourceUrl, currency, points: { price, scrapedAt }[] }[] }
POST   /items/:id/scrape          → { queued: true, sourceIds: string[] }
```

### Sources
```
POST   /sources                   → { source: Source }
PATCH  /sources/:id               → { source: Source }
DELETE /sources/:id               → { success: true }
POST   /sources/:id/main          → { source: Source }   (set as main, clears others)
```

### Tags
```
GET    /tags                      → { tags: Tag[] }
POST   /tags                      → { tag: Tag }
DELETE /tags/:id                  → { success: true }
```

### Currency
```
GET    /currencies/rates          → { base: "EUR", date: string, rates: Record<string, number> }
```
Proxy for frankfurter.dev. Cache in memory for 1 hour.

### Images
```
POST   /images/upload             → { url: string }
```
Accepts `multipart/form-data` with a `file` field. Streams to MinIO. Returns the public URL.

### Internal (scraper → api)
```
POST   /internal/scrape-result    → { success: true }
Body: { sourceId: string, price: number, warning?: string }
```

---

## Key Implementation Details

### `src/index.ts` — entry point

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { prisma } from './lib/prisma.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
})
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

// Run DB migration on startup
await prisma.$executeRaw`SELECT 1`  // verify connection
// (migrations are run via `prisma migrate deploy` in Dockerfile CMD or entrypoint)

// Register routes
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// ... register all controllers

const port = Number(process.env.PORT ?? 4000)
await app.listen({ port, host: '0.0.0.0' })
```

Update `api/Dockerfile` CMD to run migrations then start:
```dockerfile
CMD ["sh", "-c", "pnpm db:generate && pnpm db:migrate && pnpm dev"]
```

### `src/lib/minio.ts`

```typescript
import { Client } from 'minio'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'storage',
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin123',
})

export const BUCKET = process.env.MINIO_BUCKET ?? 'web-scanner-images'
export const STORAGE_URL = `http://${process.env.MINIO_ENDPOINT ?? 'localhost'}:${process.env.MINIO_PORT ?? 9000}`
```

### Currency service — cache pattern

```typescript
let ratesCache: { data: Record<string, number>; base: string; date: string; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function getRates(): Promise<...> {
  if (ratesCache && Date.now() - ratesCache.fetchedAt < CACHE_TTL) return ratesCache
  const res = await fetch('https://api.frankfurter.dev/v1/latest')
  const json = await res.json()
  ratesCache = { data: json.rates, base: json.base, date: json.date, fetchedAt: Date.now() }
  return ratesCache
}
```

### Scrape service — trigger scraper

When `POST /items/:id/scrape` or `POST /internal/scrape-result` is called, the API communicates with the Python scraper via HTTP to `http://scraper:8000` (or writes to a scrape_jobs table if the scraper polls). Use HTTP POST to `http://scraper:${SCRAPER_PORT}/scrape` with `{ sourceIds: string[] }`. Add `SCRAPER_INTERNAL_URL=http://scraper:8000` to env.

If the scraper is unavailable, return `{ queued: true }` gracefully without error.

### Zod schemas — example for item

```typescript
import { z } from 'zod'

export const CreateItemSchema = z.object({
  name: z.string().min(1).max(200),
  imageUrl: z.string().url().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  sources: z.array(CreateSourceSchema).min(1),
})

export const UpdateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().optional().nullable(),
  isFavorite: z.boolean().optional(),
})
```

---

## Acceptance Criteria

- [ ] `GET /health` returns 200
- [ ] All item CRUD endpoints work with Zod validation
- [ ] `GET /items?search=` filters by name, URL, tag
- [ ] `POST /items/:id/favorite` toggles isFavorite
- [ ] `GET /items/:id/history` returns per-source time-series
- [ ] Source CRUD endpoints including set-main (clears others atomically)
- [ ] Tag CRUD endpoints
- [ ] `GET /currencies/rates` proxies frankfurter.dev with 1h cache
- [ ] `POST /images/upload` streams file to MinIO, returns public URL
- [ ] `POST /internal/scrape-result` saves price + creates PriceHistory row
- [ ] CORS headers on all responses for `CORS_ORIGIN`
- [ ] No `any` in TypeScript — strict mode
- [ ] Errors return `{ error: string, statusCode: number }` — no raw stack traces

---

## Reporting

1. Write progress-report.md after each major section (routes, services, etc.)
2. Write completion-report.md listing all files created
3. `TaskUpdate(taskId: "6", status: "completed")`
4. Send: `COMPLETE: Backend API done. All endpoints implemented.`
