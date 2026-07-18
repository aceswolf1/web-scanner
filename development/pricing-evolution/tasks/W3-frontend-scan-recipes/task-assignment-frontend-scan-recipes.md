# task-assignment-frontend-scan-recipes

## Your Role
You are **frontend-eng** — forms, scan UX, recipes.
Match existing AddSourceModal/EditSourceModal patterns; useApiUrl; strict TS.

## Project Context
Task slug: pricing-evolution
Working directory: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
You are Worker 3 of 3.

## Plan File
`development/pricing-evolution/orchestration-ctx/team-plan-pricing-evolution.md`

## Task Type
IMPLEMENTATION

## Your Task
1. **#7** Recipes UI + useRecipes (blocked by W1 task #3)
2. **#8** Multi-match picker + currency warning (blocked by W1 task #2)

You may start scaffolding types/composables while blocked, but wire only after APIs exist.

## Implementation Location
- Source: `frontend/`
- Reports: `development/pricing-evolution/tasks/W3-frontend-scan-recipes/`

## Source Files to Modify
- NEW: `frontend/composables/useRecipes.ts`
- NEW: `frontend/components/pricing/RecipePicker.vue` (or equivalent)
- Optional: `CreateRecipeModal.vue`
- `frontend/components/pricing/AddSourceModal.vue`
- `frontend/components/pricing/EditSourceModal.vue`
- `frontend/components/pricing/CreateItemModal.vue` (scan rows)
- `frontend/types/api.types.ts` (recipes + TestScrapeResult matches)
- `frontend/composables/useSources.ts` (pass matchIndex, notes if needed)

## FIRST ACTION
1. When task 8 unblocked: TaskUpdate 8 in_progress (multi-match can start before recipes)
2. When task 7 unblocked: recipes UI
3. Prefer completing multi-match (#8) first if only #2 is done, then recipes when #3 done

## Acceptance Criteria
1. List/apply recipes into selector fields
2. Create recipe from current form fields
3. Multi-match radio when matches.length > 1; saves matchIndex
4. currencyWarning / detectedCurrency shown as amber UI
5. create/update source sends matchIndex (+ notes if edited in those modals)

## Deliverables
1. `development/pricing-evolution/tasks/W3-frontend-scan-recipes/completion-report.md`
2. Composables + modal components

## Boundaries
- Do NOT modify api/
- Do NOT implement bulk actions / portfolio (W2)
- Avoid large rewrites of SourceCard layout owned by W2

## Reporting Protocol
- progress-report.md
- COMPLETE: `COMPLETE: Scan/recipes frontend done. Recipes UI, multi-match picker, currency warnings.`
