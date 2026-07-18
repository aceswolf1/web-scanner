# W7 Frontend Fixes — Progress Report

## T19 — isMain bug + edit modal source handling [DONE]

### `frontend/types/api.types.ts`
- Added `lastError: z.string().nullable()` to `SourceSchema` (also flowed through `source.types.ts` re-exports).

### `frontend/components/pricing/CreateItemModal.vue`
- `SourceDraft` interface now includes optional `id` so we can round-trip sources from edit mode.
- `existing` prop extended to include `sources?: Array<{...}>`.
- `makeBlankSource()` now returns `isMain: form.sources.length === 0` so only the first blank source is main.
- `resetForm()` populates `form.sources` from `props.existing.sources` in edit mode (deep-copies each into the local draft).
- `removeSource` and `onSetMain` rewritten to use immutable spread (`form.sources = form.sources.map(...)`) instead of mutating in place.
- Scan-state slots (`scanStates[idx]`) reset on every `resetForm`.

### `frontend/pages/pricing/[id].vue`
- `existingPayload` now forwards `sources` to the modal.
- `onSaveEdit` now diffs payload sources against current item sources and calls `sourcesApi.addSource` for new ones, `sourcesApi.updateSource` for changed existing ones, and `sourcesApi.deleteSource` for removed ones — sequentially, after the `PATCH /items/:id` call.
- New `VALID_CURRENCIES` list and `toCurrency()` helper used to safely narrow the `string` from the payload into the typed `Currency` enum (replaces the earlier `as never` workaround).
- Added `onSourceRefreshed()` handler that reloads item + history 4s after a per-source refresh is queued.

## T20 — AddSourceModal.vue + onAddSource wiring [DONE]

### `frontend/composables/useSources.ts`
- Added `scrapeOne(sourceId)` (POST `/sources/:id/scrape`) and `testScrape(params)` (POST `/sources/test`).
- Exported `TestScrapeResult` type.

### `frontend/components/pricing/AddSourceModal.vue` (NEW FILE)
- Compact focused modal that adds a single source to an existing item.
- URL + currency + isMain + selectors fields with format hints (CSS Rule, Price Class, Father Class).
- Per-modal Scan button calling `testScrape`, displays green check with price or red error message.
- Wires `addSource` from `useSources`; emits `saved` and `update:visible: false` on success.

### `frontend/pages/pricing/[id].vue`
- Added `addSourceModalVisible` / `addSourceItemId` refs.
- Replaced the toast placeholder in `onAddSource` with the modal opener.
- `onSourceSaved()` refreshes the item so the new source appears.
- Added `<AddSourceModal v-model:visible="..." :item-id="..." @saved="..." />` to template (auto-imported).

## T21 — SourceCard refresh icon + lastError + scrapeOne [DONE]

### `frontend/components/pricing/SourceCard.vue`
- Added `lastError` red callout above the footer (icon + text, soft red bg, rounded).
- Replaced the `pi-pencil` icon on the second-to-last action button with `pi pi-refresh` (spins via `pi-spin pi-spinner` while in-flight).
- Added `handleRefresh()` calling `scrapeOne(source.id)` with toast feedback for queued / warn / error outcomes.
- Added new `refreshed` emit; parent (`ItemDetail`) re-emits it to `[id].vue`.

### `frontend/components/pricing/ItemDetail.vue`
- Re-emits `refreshed` from `<SourceCard @refreshed>` to the page.

### `frontend/pages/pricing/[id].vue`
- Wires `@refreshed="onSourceRefreshed"` on `<ItemDetail>`, which reloads item + history 4s later.

## T22 — Scan button + selector format hints [DONE]

### `frontend/components/pricing/CreateItemModal.vue`
- Each source row now displays `<small>` hints above `priceClass`, `fatherClass`, and `cssRule` fields explaining the dot-vs-no-dot convention.
- Added a Scan button per row calling `testScrape`. Per-row state stored in `scanStates: Ref<Record<number, ScanState>>`; result renders inline (green price or red error).
- `useSources().testScrape` is destructured.

### `frontend/components/pricing/AddSourceModal.vue`
- Same selector format hints under each field.
- Scan button + result block above the footer.

---

## Files Touched

- `frontend/types/api.types.ts`
- `frontend/composables/useSources.ts`
- `frontend/components/pricing/CreateItemModal.vue`
- `frontend/components/pricing/AddSourceModal.vue` (NEW)
- `frontend/components/pricing/SourceCard.vue`
- `frontend/components/pricing/ItemDetail.vue`
- `frontend/pages/pricing/[id].vue`

## Notes / Deviations

- Used `toCurrency()` helper (Currency enum narrowing) instead of `as never` casts in `[id].vue` to keep TypeScript strict mode happy.
- AddSourceModal explicit imports Dialog/InputText/Select/Checkbox/Button from primevue for consistency with CreateItemModal style.
- SourceCard refresh button keeps the same visual slot as the old pencil button (between external-link and trash) — only the icon and handler changed; ARIA label updated to "Refresh source".