# W3 Completion Report — Frontend Scan / Recipes

**Worker:** worker-3 (pt-frontend-eng)  
**Date:** 2026-07-17  
**Tasks:** #7 Recipes UI + useRecipes · #8 Multi-match picker + currency warning  

## Delivered

### New files
| File | Purpose |
|------|---------|
| `frontend/composables/useRecipes.ts` | Recipe list/create/delete + hostname helper |
| `frontend/components/pricing/RecipePicker.vue` | Apply/delete recipes; save-as-recipe entry |
| `frontend/components/pricing/CreateRecipeModal.vue` | Create recipe from current selectors |
| `frontend/components/pricing/MatchPicker.vue` | Radio multi-match picker |
| `frontend/components/pricing/CurrencyScanWarning.vue` | Amber currency conflict banner |

### Modified files
| File | Change |
|------|--------|
| `frontend/types/api.types.ts` | Recipe types; Source evolution fields; TestScrapeResult matches/currency |
| `frontend/composables/useSources.ts` | matchIndex/notes writes; Zod test-scrape; currency on test |
| `frontend/composables/useItems.ts` | createItem sources accept matchIndex |
| `frontend/components/pricing/AddSourceModal.vue` | Recipes + multi-match + currency warning + matchIndex save |
| `frontend/components/pricing/EditSourceModal.vue` | Same as Add + load source.matchIndex / detectedCurrency |
| `frontend/components/pricing/CreateItemModal.vue` | Per-row recipes, scan match picker, currency warning, matchIndex submit |
| `frontend/pages/pricing/[id].vue` | Edit-item existing sources include matchIndex |

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | List/apply recipes into selector fields | ✅ RecipePicker Apply |
| 2 | Create recipe from current form fields | ✅ CreateRecipeModal |
| 3 | Multi-match radio when matches.length > 1; saves matchIndex | ✅ MatchPicker + payloads |
| 4 | currencyWarning / detectedCurrency amber UI | ✅ CurrencyScanWarning |
| 5 | create/update source sends matchIndex | ✅ add/update/createItem |

## Boundaries respected
- No `api/` modifications
- No bulk/portfolio/best-deal layout (W2)
- Avoided SourceCard layout rewrites

## Residual / follow-ups
- Local `npm` typecheck blocked by empty `frontend/node_modules` (Docker image installs deps)
- Optional: server-side `GET /recipes?domain=` if lists grow large
- Notes textarea remains W2 ownership

## How to verify
1. Open Add Source → Scan with multi-match selectors → radio list appears → save → `matchIndex` persisted
2. Mismatch selected currency vs detected → amber currency warning
3. Save as recipe → recipe appears in picker → Apply fills selector fields on another source
