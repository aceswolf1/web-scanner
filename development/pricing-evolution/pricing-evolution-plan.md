# Feature Plan: pricing-evolution

## Objective
Ship nine Pricing Tracker enhancements that improve deal comparison, scrape reliability UX, and portfolio visibility — without expanding into adapters, proxies, collections, or discovery.

## Assumptions & Constraints
- Existing Fastify MRSC + Prisma + Nuxt composables remain the architecture
- Currency conversion via `/currencies/rates` + `convertPrice` is authoritative for cross-currency ranking/portfolio
- Bulk actions may call existing endpoints in parallel from the client for v1
- Bot-blocked shops stay best-effort; health score should reflect failures honestly

## Existing Patterns Used
- **Prisma schema + db:push**: `api/prisma/schema.prisma` → add nullable fields / new model
- **MRSC**: `controllers/*` → `services/*` → `repositories/*` + Zod schemas
- **Source CRUD UI**: `SourceCard`, `AddSourceModal`, `EditSourceModal`, `useSources`
- **Item list**: `ItemList` / `ItemCard` / `pages/pricing/index.vue`
- **Scrape pipeline**: `test-scrape.service.ts` + `puppeteer-scrape.service.ts` + `POST /sources/:id/scrape`
- **Currency**: `frontend/utils/currency.ts`, `useCurrencies`
- **Import style**: ESM `.js` suffixes on API; Nuxt auto-imports on frontend

## Requirements
R1–R12 from `01-requirements-pricing-evolution.md` covering the nine features.

## Technical Approach

### Data model changes (`Source` + new `SelectorRecipe`)
```prisma
// Source additions
notes              String?
matchIndex         Int       @default(0)
scrapeSuccessCount Int       @default(0)
scrapeFailCount    Int       @default(0)
lastSuccessAt      DateTime?
detectedCurrency   String?   // last scrape currency hint, optional

model SelectorRecipe {
  id          String   @id @default(cuid())
  name        String
  domain      String?  // e.g. "colombianmacstore.com.co"
  priceClass  String?
  cssRule     String?
  fatherClass String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("selector_recipes")
}
```

### Feature design

#### 1. Best Deal view
- **Where**: `ItemDetail` source grid (and optionally detail header)
- **Logic**: convert each `currentPrice` to a common base (item display currency or rates base); sort asc; nulls last
- **UI**: gold border + "Best Deal" badge on rank-0 source with price
- **No DB field required** for v1 (computed)

#### 2. Source Health Score
- Update counters in scrape success/error paths (`scrape.service` / per-source scrape controller)
- `healthScore = round(successRate * 70 + recencyScore * 30)` where recency decays after 24h/7d
- Expose on Source JSON; `SourceCard` chip

#### 3. Selector Recipes
- API: `GET/POST /recipes`, `DELETE /recipes/:id`
- UI: modal or dropdown "Apply recipe" in Add/Edit source; small manage list on /pricing or inside modal
- Seed not required

#### 4. Bulk Actions
- `ItemList`: checkbox selection + action bar: Refresh, Favorite, Unfavorite, Delete
- Client orchestrates existing `POST /items/:id/scrape`, favorite toggle, delete
- Toast summary: N succeeded / M failed

#### 5. Notes on Sources
- Field on create/update schemas + modals + card (muted text under URL)

#### 6. All-time low / high
- Utility `getAthAtl(points)` 
- ItemCard: small ATL/ATH labels near sparkline when ≥1 points
- PriceHistoryChart: horizontal markers or legend values

#### 7. Currency-normalized portfolio
- `/pricing` header stat: total of each item's best-deal (fallback main) converted to `portfolioCurrency`
- Persist currency in `localStorage`
- Loading/empty states when rates missing

#### 8. Currency detection warning
- In `extractPrice` pipeline or adjacent: scan original text for `$`, `USD`, `COP`, `Col$`, `€`, etc.
- `TestScrapeResult` gains `detectedCurrency: string | null`, `currencyWarning: string | null`
- Show amber banner in scan UI + SourceCard if `detectedCurrency` conflicts with `source.currency`

#### 9. Multi-match picker
- Cheerio/Puppeteer return all match texts/prices (cap e.g. 10)
- Scan UI: radio list when count > 1; user picks index
- Persist `matchIndex` on source; scrape uses `elements[matchIndex] ?? elements[0]`

## Risk & Unknowns
- Portfolio totals can mislead if rates stale or currency wrong — mitigate with currency warning + rates fetch
- Health score formula may need tuning after real data — document constants in one module
- Bulk delete is destructive — confirmation dialog required
- Multi-match indices can shift if site DOM changes — acceptable; user can re-scan

## Implementation Scope

### Backend
- Schema fields + SelectorRecipe model
- Source create/update schemas/repos/services
- Recipe controller/service/repo
- test-scrape + puppeteer: matches[], currency detection, matchIndex support
- scrape result path: health counters, detectedCurrency

### Frontend
- Best deal sort/badge on ItemDetail/SourceCard
- Health chip
- Notes fields
- Recipes apply/manage UI
- Bulk selection + actions on ItemList / pricing index
- ATH/ATL on card + chart
- Portfolio bar on pricing index
- Scan multi-match picker + currency warning in Add/Edit/Create source flows
- Types/Zod updates

## New Artifacts Proposed
| Artifact | Why | Alternatives |
|----------|-----|--------------|
| `api/.../recipe.*` (schema/repo/service/controller) | New resource for selector recipes | Embed recipes in frontend-only localStorage (rejected: not shared across devices/sessions) |
| `frontend/components/pricing/CreateRecipeModal.vue` or recipe picker section | UI for recipes | Inline-only in AddSource (rejected: hard to manage) |
| `frontend/utils/healthScore.ts` | Shared score formula | Inline in card (rejected: duplication) |
| `frontend/utils/bestDeal.ts` | Sort/rank helpers | Inline (rejected: used in detail + portfolio) |
| `frontend/utils/athAtl.ts` | Min/max helpers | Inline (ok small, but shared card/chart) |

**5 new artifact groups proposed — approval required.**

## Worker Split (post-approval, max 3)

| Worker | Role | Features | Points |
|--------|------|----------|--------|
| W1 | pt-backend-eng / schema-leaning | Schema, recipes API, scrape matches + currency detect + health counters + notes/matchIndex | ~13 |
| W2 | pt-frontend-eng | Best deal UI, health chip, notes, ATH/ATL, portfolio bar, bulk actions | ~13 |
| W3 | pt-frontend-eng | Selector recipes UI, multi-match picker, currency warning UI, wire scan flows | ~10 |

**Interface contracts (define before spawn):**
```
Source += notes?, matchIndex, scrapeSuccessCount, scrapeFailCount, lastSuccessAt?, detectedCurrency?
SelectorRecipe = { id, name, domain?, priceClass?, cssRule?, fatherClass?, createdAt, updatedAt }
POST /sources/test response += matches?: {index, text, price}[], detectedCurrency?, currencyWarning?
Health is derived client-side from counters OR server includes healthScore number
```

## Open Items
- None blocking if plan approved as above
- Confirm bulk scrape uses existing item scrape endpoint (yes for v1)

## References
- `00-intake-pricing-evolution.md`
- `01-requirements-pricing-evolution.md`
- Current Source model / SourceCard / test-scrape.service.ts / ItemList
