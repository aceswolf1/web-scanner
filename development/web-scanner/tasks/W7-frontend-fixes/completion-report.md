# W7 Frontend Fixes — Completion Report

All four frontend tasks (T19, T20, T21, T22) are implemented. The Pricing Tracker UI now correctly manages sources in edit mode, exposes a dedicated Add Source modal, shows last-error state, supports per-source refresh and a stateless preview scan.

## Summary of Changes

### `frontend/types/api.types.ts`
- Added `lastError: z.string().nullable()` to `SourceSchema` (matching the backend W6 contract).

### `frontend/composables/useSources.ts`
- Added `scrapeOne(sourceId)` → `POST /sources/:id/scrape` returning `{ queued, error? }`.
- Added `testScrape({ url, priceClass?, cssRule?, fatherClass? })` → `POST /sources/test` returning `TestScrapeResult`.
- Exported `TestScrapeResult` interface for consumers.
- All existing methods preserved.

### `frontend/components/pricing/CreateItemModal.vue`
- `SourceDraft` now carries an optional `id` so existing sources round-trip cleanly.
- `existing` prop typed to include `sources?: Array<{...}>` so edit mode can populate them.
- `makeBlankSource()` → `isMain: form.sources.length === 0` (only the first blank source is main).
- `resetForm()` populates `form.sources` from `props.existing.sources` in edit mode (deep copy); resets in create mode to `[makeBlankSource()]`.
- `removeSource()` and `onSetMain()` rewritten with immutable spreads.
- Each source row now has:
  - Selector format hints (`<small>`) under `priceClass`, `fatherClass`, and `cssRule`.
  - A per-row Scan button + inline scan-result feedback (green price or red error).
- `scanStates: Ref<Record<number, ScanState>>` is reset whenever `resetForm` runs.

### `frontend/components/pricing/AddSourceModal.vue` (NEW)
- Compact 540-px modal for adding a single source to an existing item.
- URL + currency + isMain + selectors, each with the same dot-vs-no-dot format hints.
- Per-modal Scan button calling `testScrape`.
- Calls `addSource(itemId, draft)` via `useSources`; emits `saved` and closes on success.

### `frontend/components/pricing/SourceCard.vue`
- Added a red error callout above the footer that renders `source.lastError` when present.
- Replaced `pi-pencil` icon with `pi-refresh` (spins while in flight) and wired to `scrapeOne(source.id)`.
- New `refreshed` emit fires after a successful queue so the parent can refetch.

### `frontend/components/pricing/ItemDetail.vue`
- Re-emits `refreshed` from each `<SourceCard>` to the page.

### `frontend/pages/pricing/[id].vue`
- `existingPayload` now forwards `sources` to the edit modal.
- `onSaveEdit` now:
  1. PATCHes the item with name/imageUrl/tagIds.
  2. Diffs `payload.sources` against current item sources and runs `addSource` / `updateSource` / `deleteSource` for each respective group.
  3. Reloads the item.
- Replaced toast stub in `onAddSource` with state that opens `AddSourceModal`.
- New `onSourceSaved()` and `onSourceRefreshed()` reload the item/history.
- Added `toCurrency()` helper that safely narrows the payload's `string` currency into the typed `Currency` enum.

## Acceptance Criteria Check

- [x] `makeBlankSource()` returns `isMain: false` for all except the first source.
- [x] Edit modal shows existing sources from `props.item.sources`.
- [x] Saving via edit modal creates/updates/deletes sources via API (not just item name/image).
- [x] "Add Source" button opens `AddSourceModal`, not a toast.
- [x] `AddSourceModal.vue` exists and lets users add a source to an existing item.
- [x] SourceCard shows `pi-refresh` icon (not `pi-pencil`) on the scrape trigger button.
- [x] SourceCard shows `lastError` message in a red box when present.
- [x] `scrapeOne(sourceId)` is in `useSources` and called by the refresh button.
- [x] Scan button in source forms calls `POST /sources/test` and shows price or error.
- [x] Selector fields show format hints (dot vs no-dot clearly explained).
- [x] No TypeScript `as never` shortcuts; currency narrowed via enum-safe `toCurrency`.
- [x] No `console.log` statements introduced.

## Deviations

- Currency narrowing helper (`toCurrency`) added to `[id].vue` instead of inline `as never` casts — this keeps strict mode happy while still defaulting invalid currencies to `USD` safely.
- AddSourceModal uses explicit `import` of PrimeVue subcomponents (Dialog, InputText, Select, Checkbox, Button) for parity with CreateItemModal style. Auto-import would also work; the explicit form is safer and matches the existing pattern.
- SourceCard's refresh button replaced the pencil button slot entirely (not added alongside). The pencil button never had a meaningful "edit source" handler wired to a real editor — replacing it with a working refresh action is a net UX improvement.

## Files Touched

- `frontend/types/api.types.ts`
- `frontend/composables/useSources.ts`
- `frontend/components/pricing/CreateItemModal.vue`
- `frontend/components/pricing/AddSourceModal.vue` (NEW)
- `frontend/components/pricing/SourceCard.vue`
- `frontend/components/pricing/ItemDetail.vue`
- `frontend/pages/pricing/[id].vue`