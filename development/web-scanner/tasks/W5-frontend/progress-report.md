# W5-frontend Progress Report

## Status: in_progress

## Plan
1. Bootstrap Nuxt 4 config: package.json, nuxt.config.ts, tsconfig.json, tailwind.config.ts
2. Global CSS with design tokens
3. Types + API schemas (Zod validation)
4. Pinia stores (theme, items, tags)
5. Composables (useItems, useSources, useTags, useCurrencies, useTheme)
6. Layout components (AppSidenav, AppTopbar)
7. UI primitives (ThemeToggle, TagBadge)
8. Pricing components (ItemCard, ItemList, SourceCard, PriceHistoryChart, ItemDetail, CreateItemModal)
9. Pages (index redirect, pricing/index, pricing/favorites, pricing/[id])
10. app.vue wiring + utility helpers (currency, time)
11. Verify & write completion report

## Log

### Setup phase — DONE
- Read full task assignment, ProductCard spec, design system, requirements, and API contracts.
- API shape confirmed:
  - GET /items → `{ items: ItemWithRelations[], total: number }`
  - GET /items/:id → `{ item: ItemWithRelations }` (includes sources with priceHistory sorted asc, tags)
  - GET /items/:id/history → `{ history: Array<{ sourceId, sourceName, sourceUrl, currency, points }> }`
  - POST /items, PATCH /items/:id, DELETE /items/:id
  - POST /items/:id/favorite → `{ item }`
  - POST /items/:id/scrape → `{ queued, sourceIds }`
  - POST /items/:id/sources, PATCH /sources/:id, DELETE /sources/:id, POST /sources/:id/main
  - GET /tags, POST /tags, DELETE /tags/:id
  - GET /currencies/rates → `{ base, date, rates }` (frankfurter)
  - POST /images/upload (multipart) → `{ url }`
- ItemWithRelations.tags shape is `[{ tag: { id, name, color } }]` (NOT flat tagIds).
- ItemWithRelations.sources includes priceHistory array (sorted ASC) only on findById (not on list).

### Implementation phase — DONE
- Bootstrap files (package.json, nuxt.config.ts, tsconfig.json, tailwind.config.ts, main.css, .gitignore)
- Types + Zod schemas in `types/api.types.ts`
- Stores (theme, items, tags) with setup-style Pinia
- Composables (useItems, useSources, useTags, useCurrencies, useTheme, useToast) — all Zod-validated
- Layout components (AppSidenav, AppTopbar, ThemeToggle, TagBadge)
- Pricing components (Sparkline, ItemCard, ItemList, ItemDetail, SourceCard, PriceHistoryChart, CreateItemModal)
- Pages (index redirect, pricing/index, pricing/favorites, pricing/[id])
- App shell wiring + primevue.client plugin for Toast/Confirmation services
- Verified acceptance criteria coverage

### Final pass — DONE
- Replaced `CurrencyEnum.options` with shared `CURRENCY_OPTIONS` constant (Zod's enum.options is not portable)
- Removed unused `confirm` reference in pricing/index.vue
- Verified no `any` in any TypeScript file (all types flow from Zod schemas)
- Wrote completion report

## Status: ✅ DONE