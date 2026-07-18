# W1 Backend Evolution — Progress Report

## Task #1 — Schema: Source fields + SelectorRecipe
**Status:** completed

### Changes
- `api/prisma/schema.prisma`
  - Source additions: `notes`, `matchIndex` (default 0), `scrapeSuccessCount`, `scrapeFailCount`, `lastSuccessAt`, `detectedCurrency`
  - New model `SelectorRecipe` mapped to `selector_recipes`
- `api/src/schemas/source.schema.ts` — create/update/test schemas include notes/matchIndex; test accepts optional currency + matchIndex
- `api/src/repositories/source.repository.ts` — create/update map new fields; supports `incrementSuccess` / `incrementFail`
- `api/src/services/source.service.ts` — pass notes/matchIndex through
- `api/src/repositories/item.repository.ts` + `item.service.ts` — create mapping for notes/matchIndex; ItemWithRelations typed with new fields
- `pnpm db:push` succeeded inside `web-scanner-04-api-1`
- Prisma client regenerated; API restarted

### Verification
- Existing sources return new fields (`notes: null`, `matchIndex: 0`, counters 0)

---

## Task #2 — Scrape: matches[], currency detect, matchIndex, health counters
**Status:** completed

### Changes
- `test-scrape.service.ts`
  - `TestScrapeResult` gains `matches`, `detectedCurrency`, `currencyWarning`
  - `detectCurrency`, `buildCurrencyWarning`, `selectMatchIndex`, `withCurrencyFields`, `MAX_MATCHES=10`
  - Cheerio path collects up to 10 matches; selects price via `matchIndex`
- `puppeteer-scrape.service.ts`
  - Same matches + currency fields; honors matchIndex; DOM callbacks typed without needing `lib: dom`
- `scrape.service.ts` — success increments success counter + `lastSuccessAt`; failure increments fail counter
- `source.controller.ts` — `/sources/:id/scrape` passes currency + matchIndex; updates health + `detectedCurrency`

### Verification
- `POST /sources/test` returns structured shape including `matches`, `detectedCurrency`, `currencyWarning`
- `tsc --noEmit` exit 0

---

## Task #3 — Recipes API CRUD
**Status:** completed

### New files
- `api/src/schemas/recipe.schema.ts`
- `api/src/repositories/recipe.repository.ts`
- `api/src/services/recipe.service.ts`
- `api/src/controllers/recipe.controller.ts`
- Registered in `api/src/index.ts`

### Endpoints
- `GET /recipes` → `{ recipes }`
- `POST /recipes` → `{ recipe }` (requires at least one selector field)
- `DELETE /recipes/:id` → `{ success: true }`

### Verification
- Create / list / delete smoke-tested against running API
- Missing-selector POST returns 400 structured error
