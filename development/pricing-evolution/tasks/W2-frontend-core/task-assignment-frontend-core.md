# task-assignment-frontend-core

## Your Role
You are **frontend-eng** — UI components, state, UX.
Match PrimeVue/Nuxt patterns, immutability, strict TS, useApiUrl for API calls.

## Project Context
Task slug: pricing-evolution
Working directory: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
You are Worker 2 of 3.

## Plan File
`development/pricing-evolution/orchestration-ctx/team-plan-pricing-evolution.md`

## Task Type
IMPLEMENTATION

## Your Task
Tasks #4 → #5 → #6 (blocked until W1 task #2 completes for field shapes; you may scaffold utils immediately):
1. **#4** Best deal sort + gold badge; notes display on SourceCard
2. **#5** Health chip + ATH/ATL on ItemCard + PriceHistoryChart
3. **#6** Portfolio bar + bulk actions on ItemList /pricing

## Implementation Location
- Source: `frontend/`
- Reports: `development/pricing-evolution/tasks/W2-frontend-core/`

## Source Files to Modify
- NEW: `frontend/utils/bestDeal.ts`
- NEW: `frontend/utils/healthScore.ts`
- NEW: `frontend/utils/athAtl.ts`
- `frontend/types/api.types.ts` (Source fields for notes, health counters, etc. — coordinate: add fields W1 exposes)
- `frontend/components/pricing/SourceCard.vue`
- `frontend/components/pricing/ItemDetail.vue`
- `frontend/components/pricing/ItemCard.vue`
- `frontend/components/pricing/ItemList.vue`
- `frontend/components/pricing/PriceHistoryChart.vue`
- `frontend/pages/pricing/index.vue`
- Composables if needed for bulk ops

## FIRST ACTION
1. Wait until task 4 is unblocked (task 2 completed) OR poll TaskList
2. TaskUpdate 4 in_progress owner worker-2
3. Read team-plan contracts + current components

## Acceptance Criteria
1. Sources sorted by best converted price; Best Deal gold outline + badge
2. Notes visible when set
3. Health chip from counters
4. ATH/ATL shown when history exists
5. Portfolio total + currency selector on /pricing
6. Bulk select: scrape, favorite, unfavorite, delete with confirm
7. No crash if items undefined

## Deliverables
1. `development/pricing-evolution/tasks/W2-frontend-core/completion-report.md`
2. Utils + component/page changes

## Boundaries
- Do NOT modify api/ except read
- Do NOT own recipe UI or multi-match picker (W3)
- May touch api.types SourceSchema for shared fields

## Reporting Protocol
- progress-report.md after each task
- COMPLETE: `COMPLETE: Frontend core done. Best deal, health, ATH/ATL, portfolio, bulk actions.`
