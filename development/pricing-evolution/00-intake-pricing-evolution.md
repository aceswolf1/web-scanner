# Intake: pricing-evolution

## Objective
Implement nine approved Pricing Tracker enhancements (no discussion-set features).

## Approved Features (in scope)
1. Best deal view — sort sources by converted price; cheapest gets golden outline + "Best Deal" badge
2. Source Health Score
3. Selector Recipes
4. Bulk Actions
5. Notes on Sources
6. All-time low / high
7. Currency-normalized portfolio
8. Currency detection warning
9. Multi-match picker

## Explicitly Out of Scope
Cookie/proxy per source, site adapters, collections, outlier rejection, shared lists, Chrome extension, deal discovery.

## Assumptions
- Stack: Nuxt 3 + Fastify + Prisma + Cheerio/Puppeteer
- Rates API + convertPrice already exist
- Source flags: isMain, isDiscounted, isUsed, lastError, currentPrice, priceHistory
- Multi-worker execution after plan approval (max 3 workers)

## Known Constraints
- Bot-walled sites (eBay, MercadoLibre) remain limited
- SSR uses internal API URL (`http://api:4000`)
- Extend existing MRSC + composable patterns

## Status
Discussion closed 2026-07-17 — user chose must-plan nine only. Requirements + feature plan written; awaiting plan approval before Phase 1 spawn.
