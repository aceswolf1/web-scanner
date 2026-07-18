# Task Assignment: W6-backend-fixes

**Worker**: worker-backend-fixes
**Role**: pt-backend-eng
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: Backend UX fixes — scrape error storage + on-demand test endpoint

---

## Objective

Fix three backend gaps in the web-scanner API:
1. Store scrape errors/success back on the Source record so the frontend can display them
2. Add a stateless `POST /sources/test` endpoint so users can test URL+selector combos before saving
3. Add `POST /sources/:id/scrape` to trigger a per-source scrape on demand

Read these files before writing any code:
- `api/prisma/schema.prisma`
- `api/src/controllers/source.controller.ts`
- `api/src/services/scrape.service.ts`
- `api/src/schemas/source.schema.ts`
- `api/src/repositories/source.repository.ts`
- `api/src/repositories/priceHistory.repository.ts`
- `api/package.json`

---

## Task IDs

- **T9** = schema + scrapeService fix → `TaskUpdate(taskId:"9", status:"in_progress", owner:"worker-backend-fixes")`
- **T10** = /sources/test endpoint → blocked by T9 (auto-unblocks when T9 completes)
- **T11** = /sources/:id/scrape endpoint → blocked by T10

---

## Deliverable 1 — T9: lastError on Source + scrapeService update

### `api/prisma/schema.prisma` change

Add two fields to the `Source` model (after `lastScrapedAt`):
```prisma
currentPrice  Float?
lastScrapedAt DateTime?
lastError     String?      ← ADD THIS
```

### Run inside the api container after schema change:
```bash
docker exec web-scanner-04-api-1 sh -c "cd /app && pnpm db:push"
```

Or the container's CMD already runs `pnpm db:push` on start — you can restart the container after the schema change and it will self-migrate.

### `api/src/services/scrape.service.ts` — update recordResult

The current implementation doesn't update `currentPrice`, `lastScrapedAt`, or store errors. Fix it:

```typescript
import { priceHistoryRepository } from '../repositories/priceHistory.repository.js'
import { sourceRepository } from '../repositories/source.repository.js'
import { notFound } from '../lib/errors.js'
import type { ScrapeResultInput } from '../schemas/item.schema.js'

export const scrapeService = {
  async recordResult(input: ScrapeResultInput): Promise<{ success: true; warning?: string }> {
    const source = await sourceRepository.findById(input.sourceId)
    if (!source) throw notFound('Source')

    if (input.price !== undefined && input.price !== null) {
      // Success path: record price history + update source
      await priceHistoryRepository.recordScrape(input.sourceId, input.price)
      await sourceRepository.update(input.sourceId, {
        currentPrice: input.price,
        lastScrapedAt: new Date(),
        lastError: null,   // clear any previous error
      })
    } else if (input.error) {
      // Error path: store error on source, touch lastScrapedAt
      await sourceRepository.update(input.sourceId, {
        lastScrapedAt: new Date(),
        lastError: input.error,
      })
    }

    return input.warning
      ? { success: true, warning: input.warning }
      : { success: true }
  },
}
```

### `api/src/schemas/item.schema.ts` — update ScrapeResultSchema

Add `error` field (it exists on the scraper but may not be in the schema):
```typescript
export const ScrapeResultSchema = z.object({
  sourceId: z.string(),
  price: z.number().optional().nullable(),
  warning: z.string().optional().nullable(),
  error: z.string().optional().nullable(),
})
export type ScrapeResultInput = z.infer<typeof ScrapeResultSchema>
```

### `api/src/repositories/source.repository.ts` — ensure update accepts new fields

The `update` method must accept `currentPrice`, `lastScrapedAt`, `lastError`. Read the current file and add them to the update input type if missing.

---

## Deliverable 2 — T10: POST /sources/test (stateless cheerio scrape)

### Add cheerio to `api/package.json`

Add to dependencies:
```json
"cheerio": "^1.0.0"
```

Also add to devDependencies:
```json
"@types/cheerio": "^0.22.35"
```

Then install inside the container:
```bash
docker exec web-scanner-04-api-1 sh -c "cd /app && pnpm add cheerio"
```

### `api/src/services/test-scrape.service.ts` — NEW FILE

```typescript
import axios from 'axios'
import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export interface TestScrapeInput {
  url: string
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
}

export interface TestScrapeResult {
  price: number | null
  count: number
  warning: string | null
  error: string | null
}

function extractPrice(text: string): number | null {
  // Strip everything except digits, dots, commas
  const cleaned = text.replace(/[^\d.,]/g, '').replace(/,/g, '.')
  const parts = cleaned.split('.')
  const normalized = parts.length > 2
    ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
    : cleaned
  const val = parseFloat(normalized)
  return isNaN(val) ? null : val
}

export async function testScrape(input: TestScrapeInput): Promise<TestScrapeResult> {
  // Normalize class names: strip leading dot if user added one
  const priceClass = input.priceClass?.replace(/^\./, '') || null
  const fatherClass = input.fatherClass?.replace(/^\./, '') || null
  const cssRule = input.cssRule || null

  try {
    const response = await axios.get(input.url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
      maxRedirects: 5,
    })

    const $ = cheerio.load(response.data as string)
    let elements: cheerio.Cheerio<cheerio.Element>

    if (cssRule) {
      elements = $(cssRule)
    } else if (fatherClass && priceClass) {
      const fathers = $(`.${fatherClass}`)
      const matches: cheerio.Element[] = []
      fathers.each((_, el) => {
        $(el).find(`.${priceClass}`).each((_, child) => matches.push(child))
      })
      elements = $(matches)
    } else if (priceClass) {
      elements = $(`.${priceClass}`)
    } else {
      return { price: null, count: 0, warning: null, error: 'No selector configured (priceClass, cssRule, or fatherClass required)' }
    }

    const count = elements.length
    if (count === 0) {
      return { price: null, count: 0, warning: null, error: 'No elements matched the selector' }
    }

    const firstText = $(elements.get(0)).text().trim()
    const price = extractPrice(firstText)
    const warning = count > 1
      ? `Multiple matches (${count}) — using first. Consider a more specific selector.`
      : null

    if (price === null) {
      return { price: null, count, warning, error: `Could not extract a number from: "${firstText.slice(0, 60)}"` }
    }

    return { price, count, warning, error: null }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') return { price: null, count: 0, warning: null, error: 'Request timed out' }
      if (err.response) return { price: null, count: 0, warning: null, error: `HTTP ${err.response.status} from URL` }
      return { price: null, count: 0, warning: null, error: `Network error: ${err.message}` }
    }
    return { price: null, count: 0, warning: null, error: `Unexpected error: ${String(err)}` }
  }
}
```

### `api/src/schemas/source.schema.ts` — add TestScrapeSchema

```typescript
export const TestScrapeSchema = z.object({
  url: z.string().url().max(2000),
  priceClass: z.string().max(200).optional().nullable(),
  cssRule: z.string().max(500).optional().nullable(),
  fatherClass: z.string().max(200).optional().nullable(),
})
```

### `api/src/controllers/source.controller.ts` — add the route

```typescript
import { testScrape } from '../services/test-scrape.service.js'
import { TestScrapeSchema } from '../schemas/source.schema.js'

// Inside registerSourceController, add:
app.post('/sources/test', async (req, reply) => {
  const body = TestScrapeSchema.parse(req.body)
  const result = await testScrape(body)
  return reply.send(result)
})
```

---

## Deliverable 3 — T11: POST /sources/:id/scrape (per-source trigger)

### `api/src/controllers/source.controller.ts` — add the route

```typescript
// Add near the top:
import axios from 'axios'

// Inside registerSourceController:
app.post<{ Params: { id: string } }>(
  '/sources/:id/scrape',
  async (req, reply) => {
    const scraperUrl = process.env.SCRAPER_INTERNAL_URL ?? 'http://scraper:8000'
    try {
      await axios.post(`${scraperUrl}/scrape`, { sourceIds: [req.params.id] }, { timeout: 5000 })
      return reply.send({ queued: true })
    } catch {
      // Scraper is unavailable — return gracefully
      return reply.send({ queued: false, error: 'Scraper service unreachable' })
    }
  }
)
```

---

## Interface Contracts (for frontend worker)

```
POST /sources/test
  Body: { url: string, priceClass?: string|null, cssRule?: string|null, fatherClass?: string|null }
  Response: { price: number|null, count: number, warning: string|null, error: string|null }

POST /sources/:id/scrape
  Response: { queued: boolean, error?: string }

Source object gains: lastError: string | null
```

---

## Acceptance Criteria

- [ ] `api/prisma/schema.prisma` has `lastError String?` on Source
- [ ] `scrapeService.recordResult` clears `lastError` on success, sets it on error
- [ ] `POST /sources/test` returns `{ price, count, warning, error }` without writing to DB
- [ ] `POST /sources/test` handles cssRule, fatherClass+priceClass, priceClass-only strategies
- [ ] `POST /sources/:id/scrape` returns `{ queued: true }` or `{ queued: false, error }` gracefully
- [ ] cheerio is in api/package.json dependencies
- [ ] No TypeScript errors — strict mode

---

## Reporting

1. Write `development/web-scanner/tasks/W6-backend-fixes/progress-report.md` after each deliverable
2. Write `development/web-scanner/tasks/W6-backend-fixes/completion-report.md`
3. `TaskUpdate(taskId:"9", status:"completed")` then `TaskUpdate(taskId:"10", status:"completed")` then `TaskUpdate(taskId:"11", status:"completed")` in sequence as each finishes
4. Send: `COMPLETE: Backend fixes done. lastError schema + /sources/test + /sources/:id/scrape all implemented.`
