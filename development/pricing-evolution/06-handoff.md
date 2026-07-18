# Handoff: pricing-evolution

**Date:** 2026-07-17  
**Status:** All 3 workers complete  

## What shipped

| # | Feature | Owner | Status |
|---|---------|-------|--------|
| 1 | Best Deal sort + gold badge | W2 | ✅ |
| 2 | Source Health Score | W1 counters + W2 chip | ✅ |
| 3 | Selector Recipes | W1 API + W3 UI | ✅ |
| 4 | Bulk Actions | W2 | ✅ |
| 5 | Notes on Sources | W1 field + W2 display | ✅ (edit UI may need notes textarea if not in modals) |
| 6 | All-time low / high | W2 | ✅ |
| 7 | Currency-normalized portfolio | W2 | ✅ |
| 8 | Currency detection warning | W1 detect + W3 banner | ✅ |
| 9 | Multi-match picker | W1 matches + W3 picker | ✅ |

## Worker deliverables

### W1 Backend (`tasks/W1-backend-evolution/completion-report.md`)
- Prisma: Source notes/matchIndex/health counters/detectedCurrency; SelectorRecipe model
- Scrape: matches[], currency detection, matchIndex, success/fail counters
- API: GET/POST `/recipes`, DELETE `/recipes/:id`

### W2 Frontend core (`tasks/W2-frontend-core/completion-report.md`)
- Utils: `bestDeal.ts`, `healthScore.ts`, `athAtl.ts`
- SourceCard: Best Deal gold outline/badge, notes, health chip
- ItemDetail: rank by deal
- ItemCard/PriceHistoryChart: ATH/ATL
- `/pricing`: portfolio bar + bulk select actions

### W3 Frontend scan/recipes (`tasks/W3-frontend-scan-recipes/completion-report.md`)
- `useRecipes`, RecipePicker, CreateRecipeModal
- MatchPicker, CurrencyScanWarning
- Wired into AddSource / EditSource / CreateItem scan flows

## How to run / verify
1. `docker compose up -d` (api + frontend healthy)
2. After schema changes: api container `pnpm db:push` (W1 should have run this)
3. `/pricing` — portfolio total, bulk checkboxes, ATH/ATL on cards
4. Item detail — sources sorted; Best Deal gold card; health chip
5. Add/Edit source — Scan multi-match picker; currency warning; apply/save recipe
6. `GET http://localhost:4000/recipes` → 200

## Integration notes
- Interface contracts from team-plan were honored
- Shared `api.types.ts` updated across W2/W3 for Source + recipes + scrape matches
- SSR continues to use `useApiUrl()` → internal `http://api:4000`

## Deferred / residual
- Discussion-set features (adapters, cookie/proxy, collections, outlier quarantine, shared lists, extension, deal discovery) remain out of scope
- Notes **textarea** in Add/Edit modals: confirm present; if only display exists, add short follow-up
- Health score constants may need tuning with real scrape data
- Optional: `GET /recipes?domain=` server filter for large recipe lists

## Restart tip
After API schema/code changes on Docker Desktop macOS, prefer `docker compose restart api` (tsx watch may miss host FS events).
