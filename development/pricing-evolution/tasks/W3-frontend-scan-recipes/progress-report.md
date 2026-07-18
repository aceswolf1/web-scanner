# W3 Frontend Scan/Recipes — Progress Report

## Status
- Started: 2026-07-17
- Tasks: #8 multi-match + currency warning, #7 recipes UI
- Backend contracts (W1 #2/#3) landed and UI is wired against live API shapes.

## Subtasks
1. [done] Extend types + useSources (matches, currencyWarning, matchIndex, currency on test scrape)
2. [done] Multi-match picker + currency warning UI in Add/Edit/Create modals
3. [done] useRecipes + RecipePicker + CreateRecipeModal
4. [done] Wire recipes into Add/Edit/Create source flows
5. [done] Pass matchIndex through createItem + detail edit payload
6. [done] Acceptance review + completion report

## Implementation summary

### Types (`frontend/types/api.types.ts`)
- Source: `notes`, `matchIndex`, health counters, `detectedCurrency` (optional defaults)
- `SelectorRecipe` + list/envelope schemas
- `ScrapeMatch` + `TestScrapeResult` with `matches`, `detectedCurrency`, `currencyWarning`

### Composables
- `useRecipes.ts` — list/create/delete `/recipes`; client-side domain sort
- `useSources.ts` — `matchIndex`/`notes` on write; test scrape parses Zod + sends `currency`/`matchIndex`
- `useItems.ts` — createItem sources accept `matchIndex`

### Components
- `MatchPicker.vue` — radio list when matches.length > 1
- `CurrencyScanWarning.vue` — amber banner for currencyWarning / detected vs selected
- `RecipePicker.vue` — list/apply/delete + save-as-recipe entry
- `CreateRecipeModal.vue` — name/domain + current selectors
- `AddSourceModal.vue` / `EditSourceModal.vue` / `CreateItemModal.vue` — all three wired

### Pages
- `pages/pricing/[id].vue` — existing edit payload includes `matchIndex`

## Acceptance criteria map
1. List/apply recipes into selector fields — RecipePicker apply fills cssRule/priceClass/fatherClass
2. Create recipe from current form fields — CreateRecipeModal + Save as recipe
3. Multi-match radio when matches.length > 1; saves matchIndex — MatchPicker + save payloads
4. currencyWarning / detectedCurrency amber UI — CurrencyScanWarning
5. create/update source sends matchIndex — addSource/updateSource/createItem/CreateItemModal submit

## Notes / non-blocking
- Frontend `node_modules` is empty in this workspace (Docker-only install); typecheck not run locally
- Recipe list API has no domain query param; frontend sorts same-domain first
- Notes field UI owned by W2; W3 only supports matchIndex on source write paths
