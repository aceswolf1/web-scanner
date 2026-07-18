# Requirements: pricing-evolution

## Functional Requirements

| ID | Requirement | Acceptance Criterion | Research? |
|----|-------------|----------------------|-----------|
| R1 | Best deal ordering | On item detail, sources sorted by converted price ascending (using rates); cheapest source with non-null price is first | No |
| R2 | Best Deal badge/outline | First ranked source shows golden outline + "Best Deal" tag; only one Best Deal per item; no-price sources sort last | No |
| R3 | Source Health Score | Each source exposes a health score 0–100 (or enum) derived from scrape outcomes + lastError + recency; shown on SourceCard | No |
| R4 | Health persistence | Scrape success/failure updates health inputs (success count / fail count / last success) on Source | No |
| R5 | Selector Recipes | Users can save named selector templates (domain optional + priceClass/cssRule/fatherClass); list/apply when adding/editing a source | No |
| R6 | Recipe CRUD API | Create/list/delete recipes; optional filter by hostname | No |
| R7 | Bulk Actions | On /pricing list, multi-select items; bulk refresh scrape, bulk favorite/unfavorite, bulk delete with confirm | No |
| R8 | Source Notes | Optional free-text note on Source; editable in Add/Edit source modals; visible on SourceCard | No |
| R9 | All-time low/high | Per main source (card sparkline/detail chart): show ATH and ATL from priceHistory; mark on chart when possible | No |
| R10 | Portfolio total | /pricing shows sum of each item's Best Deal (or main) price converted to a user-selected portfolio currency | No |
| R11 | Currency detection warning | On scrape/test, if detected currency symbols/text disagree with source.currency, return/show warning | No |
| R12 | Multi-match picker | When test scrape finds count>1, UI lists each match (price + snippet); user selects which match index to use; subsequent scrapes prefer that index | No |

## Non-Functional Requirements
- No silent mutation of existing prices when health/notes/recipes change
- All new API fields validated with Zod
- Frontend strict TypeScript; schema parse must accept both list and detail shapes
- Immutability patterns in Vue state updates
- Keep files focused; extend MRSC layers

## Out of Scope
Cookie/proxy, site adapters, collections, outlier quarantine, shared lists, Chrome extension, deal discovery, email alerts.

## Implementation Notes by Feature

### Best Deal (R1–R2)
- Pure frontend ranking using existing rates + convertPrice is enough for v1
- Tie-break: isMain, then earliest created/id

### Health Score (R3–R4)
- Add `scrapeSuccessCount`, `scrapeFailCount`, `lastSuccessAt` (or compute from lastError + lastScrapedAt + counters)
- Score formula (documented): e.g. successRate * 70 + recencyBonus * 30; clamp 0–100
- UI: colored chip (green/amber/red)

### Selector Recipes (R5–R6)
- New model `SelectorRecipe`
- Apply fills form fields; does not auto-scrape

### Bulk Actions (R7)
- ItemList selection mode
- API: prefer client loop of existing endpoints for v1 (scrape/favorite/delete); optional bulk endpoint later

### Notes (R8)
- `Source.notes String?`

### ATH/ATL (R9)
- Compute min/max from priceHistory points (list already returns last 30; detail has full history — use full on detail, available points on card)

### Portfolio (R10)
- Header/stat bar on /pricing
- Currency selector (session or localStorage)

### Currency warning (R11)
- Detect COP/USD/EUR symbols or codes in scraped text
- Return `currencyWarning` on test/scrape response

### Multi-match picker (R12)
- Extend test scrape response with `matches: { index, text, price }[]`
- Store `Source.matchIndex Int?` default 0
- Scrape engines use matchIndex when multiple elements match
