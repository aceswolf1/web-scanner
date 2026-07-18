# Team Plan: pricing-evolution

## Context
- `pricing-evolution-plan.md` — nine features, schema + UI split
- `00-intake-pricing-evolution.md` — nine only; discussion features out
- `01-requirements-pricing-evolution.md` — R1–R12

## Objective
Implement Best Deal, Source Health, Selector Recipes, Bulk Actions, Source Notes, ATH/ATL, Portfolio, Currency detection warning, Multi-match picker.

## Implementation Location
- Source code: `/Users/cace/Desktop/cloud-copy/projects/web-scanner-04/api/` and `frontend/`
- Reports: `development/pricing-evolution/tasks/`

## Work Streams
| ID | Stream | Worker | Role | Points | Dependencies |
|----|--------|--------|------|--------|--------------|
| W1 | Backend schema + scrape + recipes API | worker-1 | pt-backend-eng | 13 | — |
| W2 | Frontend deal/health/notes/ATH/portfolio/bulk | worker-2 | pt-frontend-eng | 13 | W1 contracts (can start UI against contracts; blocked on schema fields for full wire) |
| W3 | Frontend recipes UI + multi-match + currency warning | worker-3 | pt-frontend-eng | 10 | W1 contracts for recipes/matches |

W2 and W3 start after W1 completes schema+API contracts (task chain: W1 T1–T4 first, then W2/W3 fan-out). Practically: W1 runs first stream; W2/W3 blocked until backend recipe API + source field extensions land.

## Dependency Graph
```
W1-T1 schema+source fields → W1-T2 scrape matches/currency/health → W1-T3 recipes API → W1-T4 db push notes
W2-T1 best deal + notes UI → W2-T2 health + ATH/ATL → W2-T3 portfolio + bulk
W3-T1 recipes UI → W3-T2 multi-match picker → W3-T3 currency warning UI
W2 and W3 blocked by W1-T2 (source fields + test scrape response shape)
```

## Interface Contracts

### Source fields (API + Zod)
```ts
notes?: string | null
matchIndex: number // default 0
scrapeSuccessCount: number
scrapeFailCount: number
lastSuccessAt?: string | null
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

### SelectorRecipe
```ts
{
  id: string
  name: string
  domain: string | null
  priceClass: string | null
  cssRule: string | null
  fatherClass: string | null
  createdAt: string
  updatedAt: string
}
```

### Recipe API
- `GET /recipes` → `{ recipes: SelectorRecipe[] }`
- `POST /recipes` body `{ name, domain?, priceClass?, cssRule?, fatherClass? }` → `{ recipe }`
- `DELETE /recipes/:id` → `{ success: true }`

### Health score (client util)
`healthScore(source) => 0..100` using success/fail counts + lastSuccessAt/lastScrapedAt

### Best deal (client util)
`rankSourcesByDeal(sources, rates, base, displayCurrency) => Source[]`

## Communication Plan
- W1 completes contracts first; orchestrator unblocks W2/W3
- No direct worker-to-worker messaging
- If response shape drifts, W2/W3 send COMM-REQUEST via main

## File Ownership
| Worker | Owns |
|--------|------|
| W1 | `api/prisma/**`, `api/src/**` (except pure frontend) |
| W2 | `frontend/components/pricing/ItemDetail.vue`, `SourceCard.vue`, `ItemCard.vue`, `ItemList.vue`, `PriceHistoryChart.vue`, `pages/pricing/index.vue`, `utils/bestDeal.ts`, `utils/healthScore.ts`, `utils/athAtl.ts`, related composables/types as needed |
| W3 | `AddSourceModal.vue`, `EditSourceModal.vue`, `CreateItemModal.vue` scan UI, recipe components, types for recipes/matches, `useRecipes` composable |

Shared carefully: `frontend/types/api.types.ts` — W1 documents server shape; W2/W3 update Zod. If conflict, W3 owns recipe types; W2 owns health/portfolio types; both may edit SourceSchema fields once (prefer W2 after W1 done).
