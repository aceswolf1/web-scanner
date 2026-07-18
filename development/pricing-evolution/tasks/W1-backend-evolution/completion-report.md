# W1 Backend Evolution — Completion Report

**Worker:** worker-1 (pt-backend-eng)  
**Status:** COMPLETE  
**Date:** 2026-07-18

## Summary
Backend pricing-evolution stream delivered: Source schema extensions, scrape multi-match + currency detection + health counters, and Selector Recipes API.

## Acceptance Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Prisma schema has all Source fields + SelectorRecipe; db:push succeeds | ✅ |
| 2 | POST /sources/test returns matches, detectedCurrency, currencyWarning | ✅ |
| 3 | Scrapes honor matchIndex; update success/fail counters | ✅ |
| 4 | Recipes CRUD works | ✅ |
| 5 | No TS errors in api | ✅ `tsc --noEmit` exit 0 |

## Interface Contracts Delivered

### Source fields (API JSON)
```
notes?: string | null
matchIndex: number // default 0
scrapeSuccessCount: number
scrapeFailCount: number
lastSuccessAt?: string | null  // ISO DateTime
detectedCurrency?: string | null
```

### Test scrape / scrape response additions
```ts
{
  price: number | null
  count: number
  warning: string | null
  error: string | null
  matches?: Array<{ index: number; text: string; price: number | null }>
  detectedCurrency?: string | null
  currencyWarning?: string | null
}
```

### Recipe API
- `GET /recipes` → `{ recipes: SelectorRecipe[] }`
- `POST /recipes` body `{ name, domain?, priceClass?, cssRule?, fatherClass? }` → `{ recipe }`
- `DELETE /recipes/:id` → `{ success: true }`

### SelectorRecipe shape
```
{ id, name, domain, priceClass, cssRule, fatherClass, createdAt, updatedAt }
```

## Files Modified
- `api/prisma/schema.prisma`
- `api/src/schemas/source.schema.ts`
- `api/src/repositories/source.repository.ts`
- `api/src/services/source.service.ts`
- `api/src/services/test-scrape.service.ts`
- `api/src/services/puppeteer-scrape.service.ts`
- `api/src/services/scrape.service.ts`
- `api/src/controllers/source.controller.ts`
- `api/src/repositories/item.repository.ts`
- `api/src/services/item.service.ts`
- `api/src/index.ts`

## Files Created
- `api/src/schemas/recipe.schema.ts`
- `api/src/repositories/recipe.repository.ts`
- `api/src/services/recipe.service.ts`
- `api/src/controllers/recipe.controller.ts`

## Ops notes
- Ran `pnpm db:push` inside `web-scanner-04-api-1`
- Restarted API container; Prisma client regenerated on boot
- Currency detection heuristics: USD/COP/EUR/GBP/JPY/CAD/MXN + bare `$` as weak USD

## Out of scope (frontend)
- Best deal, health chip UI, recipes UI, multi-match picker UI — owned by W2/W3
