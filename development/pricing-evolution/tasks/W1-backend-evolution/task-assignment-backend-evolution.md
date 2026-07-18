# task-assignment-backend-evolution

## Your Role
You are **backend-eng** — APIs, services, and data processing.
Prioritize: REST consistency, Zod validation, MRSC separation, Prisma patterns, structured errors. Use ESM imports with `.js` suffixes.

## Project Context
Task slug: pricing-evolution
Working directory: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
You are Worker 1 of 3.

## Plan File
`development/pricing-evolution/orchestration-ctx/team-plan-pricing-evolution.md`
Also read: `development/pricing-evolution/pricing-evolution-plan.md`

## Task Type
IMPLEMENTATION

## Your Task
Implement backend for pricing evolution:
1. **Task #1** — Schema: Source.notes, matchIndex, scrapeSuccessCount, scrapeFailCount, lastSuccessAt, detectedCurrency; SelectorRecipe model; source repo/schemas
2. **Task #2** — Scrape: matches[], currency detection, matchIndex selection, health counters on scrape paths
3. **Task #3** — Recipes API GET/POST /recipes, DELETE /recipes/:id

Mark each task in_progress then completed via TaskUpdate as you finish.

## Implementation Location
- Source code: `api/`
- Reports: `development/pricing-evolution/tasks/W1-backend-evolution/`

## Source Files to Modify
- `api/prisma/schema.prisma`
- `api/src/schemas/source.schema.ts`
- `api/src/repositories/source.repository.ts`
- `api/src/services/source.service.ts`
- `api/src/services/test-scrape.service.ts`
- `api/src/services/puppeteer-scrape.service.ts`
- `api/src/services/scrape.service.ts`
- `api/src/controllers/source.controller.ts`
- NEW: `api/src/schemas/recipe.schema.ts`
- NEW: `api/src/repositories/recipe.repository.ts`
- NEW: `api/src/services/recipe.service.ts`
- NEW: `api/src/controllers/recipe.controller.ts`
- `api/src/index.ts` (register recipe routes)
- Any item.repository create mapping for new source fields

## FIRST ACTION
1. TaskUpdate task 1 in_progress owner worker-1
2. Read plan + existing source/scrape files
3. Implement schema first, then scrape, then recipes
4. After schema: `docker exec web-scanner-04-api-1 sh -c "cd /app && pnpm db:push"` and restart api if needed

## Acceptance Criteria
1. Prisma schema has all Source fields + SelectorRecipe; db:push succeeds
2. POST /sources/test returns matches, detectedCurrency, currencyWarning when applicable
3. Scrapes honor matchIndex; update success/fail counters
4. Recipes CRUD works
5. No TS errors in api

## Deliverables
1. `development/pricing-evolution/tasks/W1-backend-evolution/completion-report.md`
2. All source files listed above

## Interface Contracts
See team-plan. Frontend depends on these exact shapes.

## Boundaries
- Do NOT modify frontend/
- Do NOT implement UI
- Report COMPLETE when all three tasks done

## Reporting Protocol
- Progress: `development/pricing-evolution/tasks/W1-backend-evolution/progress-report.md`
- On done: TaskUpdate 1,2,3 completed; write completion-report; send `COMPLETE: Backend evolution done. Schema, scrape matches/currency/health, recipes API.`
