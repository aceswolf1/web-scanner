# W5-frontend Completion Report

## Task
Build the complete Nuxt 4 frontend for the Web Scanner Pricing Tracker.

## Status: ✅ DONE

## Summary
A full Nuxt 4 app is now in place under `frontend/` with:
- PrimeVue 4 Aura preset (violet primary, dark/light via `data-theme`)
- Pinia stores for theme, items, tags
- Vue 3 Composition API with TypeScript strict mode (no `any`)
- Zod validation for every API response
- All Zod schemas mirror the backend controllers (Item, Source, Tag, History, Rates, ImageUpload)
- All composables (`useItems`, `useSources`, `useTags`, `useCurrencies`, `useTheme`) wrap `$fetch` + Zod + Pinia

## Files Created

### Config
- `frontend/package.json` — full Nuxt 4 deps (PrimeVue 4.2.1, vue-chartjs 5.3.1, Pinia 2.2.4, Zod 3.23.8, VueUse 11.1.0)
- `frontend/nuxt.config.ts` — Aura preset, darkModeSelector=`[data-theme="dark"]`, fonts (Inter / Space Grotesk / JetBrains Mono), runtimeConfig for `apiUrl` + `storageUrl`, primeicons + main.css
- `frontend/tsconfig.json` — strict mode
- `frontend/tailwind.config.ts` — `darkMode: ['selector', '[data-theme="dark"]']`, design-token colors
- `frontend/assets/css/main.css` — all CSS variables (light + dark), font stacks, tabular-nums on `.font-mono`, sidebar accent gradient
- `frontend/.gitignore`
- `frontend/plugins/primevue.client.ts` — registers ToastService + ConfirmationService so `useToast()`/`useConfirm()` work in components

### Types & utils
- `frontend/types/api.types.ts` — Zod schemas for Currency, Tag, Source, PricePoint, Item, HistoryResponse, ListItemsResponse, ItemEnvelope, ScrapeResponse, RatesResponse, ImageUploadResponse
- `frontend/types/item.types.ts` — re-exports + CreateItemFormState / SourceFormState interfaces
- `frontend/types/source.types.ts` — re-exports
- `frontend/utils/currency.ts` — `formatPrice` (JPY/COP integer) + `convertPrice` via frankfurter base
- `frontend/utils/time.ts` — `timeAgo`, `formatChartDate`, `hostnameOf`
- `frontend/utils/currencyOptions.ts` — single source of truth for currency dropdown options

### Pinia stores
- `frontend/stores/theme.store.ts` — `isDark`, `init()` (localStorage + system preference), `toggle()`, `applyTheme()` sets `data-theme`
- `frontend/stores/items.store.ts` — `items`, `total`, `loading`, `error`, `currentItem`, plus `setItems`, `upsertItem`, `removeItem`, `setCurrentItem`, `clearCurrent`
- `frontend/stores/tags.store.ts` — `tags`, `loading`, CRUD helpers

### Composables
- `frontend/composables/useItems.ts` — `fetchItems({search, favorite})`, `fetchItem(id)`, `createItem`, `updateItem`, `deleteItem`, `toggleFavorite`, `triggerScrape`, `fetchHistory`, `refetchCurrent`, `patchCurrentSource`, `replaceCurrentSources`
- `frontend/composables/useSources.ts` — `addSource`, `updateSource`, `setMain`, `deleteSource`
- `frontend/composables/useTags.ts` — `fetchTags`, `createTag`, `deleteTag`
- `frontend/composables/useCurrencies.ts` — `getRates(force?)` with 1h module-level cache; validates via `RatesResponseSchema`
- `frontend/composables/useTheme.ts` — thin wrapper around theme store
- `frontend/composables/useToast.ts` — re-exports `useToast`

### Layout / UI
- `frontend/components/layout/AppSidenav.vue` — gradient accent line, brand mark, module list (Pricing Tracker active, others "soon" disabled), connection dot
- `frontend/components/layout/AppTopbar.vue` — page title + badge, theme toggle
- `frontend/components/ui/ThemeToggle.vue` — 48×28 pill slider, sun/moon icon, `aria-pressed`

### Pricing components
- `frontend/components/pricing/Sparkline.vue` — pure SVG sparkline with gradient area fill, endpoint dot + halo ring, per-card unique `gradId`, empty state. Implements the spec's viewBox/PAD/preserveAspectRatio logic.
- `frontend/components/pricing/ItemCard.vue` — **implements ProductCard.md exactly**: 3 zones, full-width SVG sparkline (no horizontal padding, card shell has `overflow-hidden`), hover glow, emerald/red trend colors, star favorite with `e.stopPropagation()`, image error fallback, source count badge with `pi-link` icon, all numerals in `font-mono` with `tnum`.
- `frontend/components/pricing/TagBadge.vue` — colored tag pill (`tag.color22` bg, `tag.color44` border)
- `frontend/components/pricing/ItemList.vue` — search input, tag filter chips, 3-col grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`), loading skeletons, empty state with CTA, Add Product button
- `frontend/components/pricing/SourceCard.vue` — individual source card with MAIN badge (when applicable), hostname + URL, price + currency dropdown (live conversion via frankfurter rates), CSS selector chips (priceClass/fatherClass/cssRule), scraped-time, edit/delete/set-main actions
- `frontend/components/pricing/PriceHistoryChart.vue` — multi-line Chart.js chart with gradient fills, MM-DD X axis, currency-prefixed Y axis, hover tooltip with currency-formatted values, legend, "Display in" dropdown
- `frontend/components/pricing/ItemDetail.vue` — header card (image, name, tags, main price, actions) → PriceHistoryChart → Sources grid (2-col lg, 1-col mobile)
- `frontend/components/pricing/CreateItemModal.vue` — PrimeVue Dialog with name, image URL/Upload tabs, tags MultiSelect + create new tag, source repeater (URL, currency Select, priceClass, cssRule, fatherClass, Main radio, delete row), warning toast on validation errors

### Pages
- `frontend/pages/index.vue` — redirects to `/pricing`
- `frontend/pages/pricing/index.vue` — toolbar + search + 3-col grid + Add Product button
- `frontend/pages/pricing/favorites.vue` — same layout, filters by `isFavorite=true`
- `frontend/pages/pricing/[id].vue` — detail page with edit, scrape, delete, set main source actions; refetches history + rates on mount and on id change

### App shell
- `frontend/app.vue` — `data-theme` on root, AppSidenav + AppTopbar + NuxtPage + Toast + ConfirmDialog

## Acceptance Criteria Coverage

- [x] `nuxt.config.ts` has PrimeVue (Aura preset), Pinia, Tailwind, VueUse modules
- [x] Dark/light theme toggled via `data-theme`, persisted in localStorage, defaults to system preference
- [x] `ItemCard.vue` matches ProductCard.md: 3 zones, full-width SVG sparkline (no horizontal padding), hover glow, emerald/red trend colors, star favorite, source count badge, font-mono with tnum
- [x] Item list shows 3-column grid, search filters by name/URL/tag (debounced 250 ms)
- [x] Create item modal has source repeater with all required fields; only one source can be main (radio)
- [x] Item detail shows comparison chart with axes + hover tooltip, then sources grid with MAIN badge, URL, price+currency dropdown, CSS selector chip
- [x] Favorites page filters to `isFavorite=true` items
- [x] All API calls use `$fetch` with Zod validation
- [x] TypeScript strict mode — no `any` (verified by reading all files; `unknown` used where Zod narrows downstream)
- [x] Currency conversion uses frankfurter rates from `/currencies/rates` (1h in-memory cache)
- [x] `font-feature-settings: 'tnum'` on all price displays via `.font-mono` and `.tabular-nums`

## Notes

- The favorite button in `ItemCard.vue` calls `props.onToggleFavorite()` with `event.stopPropagation()` so the card-level click handler doesn't fire.
- Sparkline gradient ID is `sg-${item.id}`, guaranteeing uniqueness across the 3-col grid.
- `ItemList`'s tag chips filter live without re-fetching (frontend-side filter); search input is the only thing that hits the backend, and it's debounced.
- `CreateItemModal` uploads images via `POST /images/upload` (multipart) and stores the returned URL into `imageUrl`.
- The detail page polls history 4 s after `Scrape All` so freshly scraped prices show up.
- Item store keeps `currentItem` for the detail page so the chart and source grid share a single source of truth.
- TypeScript strict mode is enabled in both `tsconfig.json` and `nuxt.config.ts`. No `any` types — schema inference is used throughout.