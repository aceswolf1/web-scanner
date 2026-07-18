# Task Assignment: W7-frontend-fixes

**Worker**: worker-frontend-fixes
**Role**: pt-frontend-eng
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: Frontend UX fixes — source management, scan button, icons, error display

---

## Objective

Fix 6 frontend issues in the Pricing Tracker UI:
1. Fix `makeBlankSource()` always setting `isMain: true` + fix edit modal not showing/saving sources
2. Create `AddSourceModal.vue` + wire `onAddSource` in `[id].vue`
3. Fix SourceCard — change pencil icon to refresh, show `lastError`, add `scrapeOne` composable method
4. Add scan button + selector format hints to source form rows (in both modals)

Read these files before writing any code:
- `frontend/components/pricing/SourceCard.vue`
- `frontend/components/pricing/CreateItemModal.vue`
- `frontend/pages/pricing/[id].vue`
- `frontend/composables/useSources.ts`
- `frontend/composables/useItems.ts`
- `frontend/composables/useTags.ts`
- `frontend/types/index.ts` (or wherever Source/Item types are defined)
- `frontend/nuxt.config.ts`

---

## Task IDs

- **T12** = isMain bug + edit modal fix → `TaskUpdate(taskId:"12", status:"in_progress", owner:"worker-frontend-fixes")`
- **T13** = AddSourceModal.vue + onAddSource wiring → blocked by T12
- **T14** = SourceCard refresh icon + lastError + scrapeOne → blocked by T12
- **T15** = Scan button + selector format hints → blocked by T13 and T14

---

## Interface Contracts from Backend (W6)

```
POST /sources/test
  Body: { url: string, priceClass?: string|null, cssRule?: string|null, fatherClass?: string|null }
  Response: { price: number|null, count: number, warning: string|null, error: string|null }

POST /sources/:id/scrape
  Response: { queued: boolean, error?: string }

Source object gains: lastError: string | null
```

---

## Deliverable 1 — T12: Fix isMain bug + edit modal source handling

### `frontend/components/pricing/CreateItemModal.vue`

**Bug 1 — makeBlankSource always isMain: true**

Find the `makeBlankSource()` function. Change so only the very first source is `isMain: true`, and subsequent additions are `false`:

```typescript
function makeBlankSource(): SourceDraft {
  return {
    url: '',
    currency: 'USD',
    priceClass: '',
    cssRule: '',
    fatherClass: '',
    isMain: sources.value.length === 0,   // ← only first is main
  }
}
```

**Bug 2 — resetForm doesn't load existing sources in edit mode**

The `resetForm` function must populate `sources.value` from `props.item.sources` when editing:

```typescript
function resetForm() {
  if (props.item) {
    // Edit mode: populate from existing item
    name.value = props.item.name
    imageUrl.value = props.item.imageUrl ?? ''
    selectedTagIds.value = props.item.tags?.map(t => t.id) ?? []
    sources.value = props.item.sources?.map(s => ({ ...s })) ?? []   // deep copy
  } else {
    // Create mode: blank slate
    name.value = ''
    imageUrl.value = ''
    selectedTagIds.value = []
    sources.value = [makeBlankSource()]
  }
}
```

**Bug 3 — Sources section visibility in edit mode**

The sources section should be visible in both create AND edit mode so users can modify sources. If there's an `v-if` hiding the sources section in edit mode, remove it.

**Bug 4 — onSaveEdit ignores sources**

In `frontend/pages/pricing/[id].vue`, the `onSaveEdit` handler only updates name/imageUrl/tagIds and ignores `payload.sources`. Fix it to also call the sources API for additions/deletions:

Read the existing `onSaveEdit` function carefully. The fix should:
1. Keep the existing `PATCH /items/:id` call for name/imageUrl/tagIds
2. After that succeeds, diff `payload.sources` against the item's current sources:
   - New sources (no `id`): call `POST /items/:id/sources` for each
   - Existing sources (has `id`): call `PATCH /sources/:id` for each
   - Deleted sources: call `DELETE /sources/:id` for each source in original list not present in payload
3. After all API calls complete, refresh the item data

Use the `useSources` composable for source CRUD — check what methods it exposes: `addSource`, `updateSource`, `deleteSource`, `setMainSource`.

---

## Deliverable 2 — T13: AddSourceModal.vue + onAddSource wiring

### `frontend/components/pricing/AddSourceModal.vue` — NEW FILE

Create a focused modal for adding a single new source to an existing item. Base the form layout on the existing source row form inside `CreateItemModal.vue`.

```vue
<script setup lang="ts">
import type { SourceDraft } from '~/types'

const props = defineProps<{
  visible: boolean
  itemId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved'): void
}>()

const { addSource } = useSources()
const toast = useToast()

const draft = ref<SourceDraft>({
  url: '',
  currency: 'USD',
  priceClass: '',
  cssRule: '',
  fatherClass: '',
  isMain: false,
})

async function save() {
  if (!draft.value.url) {
    toast.add({ severity: 'warn', summary: 'URL required', life: 3000 })
    return
  }
  try {
    await addSource(props.itemId, draft.value)
    emit('saved')
    emit('update:visible', false)
    draft.value = { url: '', currency: 'USD', priceClass: '', cssRule: '', fatherClass: '', isMain: false }
    toast.add({ severity: 'success', summary: 'Source added', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Failed to add source', life: 4000 })
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Add Source"
    :style="{ width: '540px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <!-- Source form fields — URL, priceClass, cssRule, fatherClass, currency, isMain -->
    <!-- Copy the form row pattern from CreateItemModal source rows -->
    <!-- Include scan button and selector hints (T15 will layer these in) -->
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">URL *</label>
        <InputText v-model="draft.url" placeholder="https://store.com/product" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">CSS Rule</label>
          <small class="text-xs text-surface-400">Full CSS selector, e.g. <code>.product .price</code></small>
          <InputText v-model="draft.cssRule" placeholder=".product-card .price-value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Price Class</label>
          <small class="text-xs text-surface-400">Class name without dot, e.g. <code>price-value</code></small>
          <InputText v-model="draft.priceClass" placeholder="price-value" />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Father Class</label>
        <small class="text-xs text-surface-400">Narrows search — class name without dot, e.g. <code>product-card</code></small>
        <InputText v-model="draft.fatherClass" placeholder="product-card" />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">Currency</label>
        <Select
          v-model="draft.currency"
          :options="['USD', 'COP', 'EUR', 'GBP']"
          class="w-28"
        />
        <Checkbox v-model="draft.isMain" binary input-id="isMain" />
        <label for="isMain" class="text-sm">Set as main source</label>
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" severity="secondary" @click="emit('update:visible', false)" />
      <Button label="Add Source" icon="pi pi-plus" @click="save" />
    </template>
  </Dialog>
</template>
```

### `frontend/pages/pricing/[id].vue` — wire onAddSource

Replace the toast placeholder:
```typescript
// BEFORE (broken):
function onAddSource(itemId: string): void {
  toast.add({ severity: 'info', summary: 'Add source', detail: 'Use the edit modal...' })
}

// AFTER:
const addSourceModalVisible = ref(false)
const addSourceItemId = ref('')

function onAddSource(itemId: string): void {
  addSourceItemId.value = itemId
  addSourceModalVisible.value = true
}

function onSourceSaved() {
  // Refresh the item to show the new source
  refresh()  // or whatever the page uses to reload item data
}
```

Add `<AddSourceModal>` to the template:
```vue
<AddSourceModal
  v-model:visible="addSourceModalVisible"
  :item-id="addSourceItemId"
  @saved="onSourceSaved"
/>
```

---

## Deliverable 3 — T14: SourceCard refresh icon + lastError + scrapeOne

### `frontend/types/index.ts` (or wherever Source type lives)

Add `lastError` field:
```typescript
export interface Source {
  id: string
  url: string
  priceClass: string | null
  cssRule: string | null
  fatherClass: string | null
  currency: string
  isMain: boolean
  currentPrice: number | null
  lastScrapedAt: string | null
  lastError: string | null   // ← ADD THIS
}
```

### `frontend/composables/useSources.ts` — add scrapeOne

Add a method that calls `POST /sources/:id/scrape`:
```typescript
async function scrapeOne(sourceId: string): Promise<{ queued: boolean; error?: string }> {
  const config = useRuntimeConfig()
  const result = await $fetch<{ queued: boolean; error?: string }>(
    `${config.public.apiUrl}/sources/${sourceId}/scrape`,
    { method: 'POST' }
  )
  return result
}

// Don't forget to return scrapeOne in the return statement
```

### `frontend/components/pricing/SourceCard.vue` — three changes

**Change 1: Pencil icon → refresh icon**

Find the button that uses `pi-pencil` for the refresh/re-scrape action. Change icon to `pi-refresh`:
```vue
<!-- BEFORE -->
<Button icon="pi pi-pencil" ... />
<!-- AFTER -->
<Button icon="pi pi-refresh" ... />
```

**Change 2: Wire the refresh button to scrapeOne**

```vue
<script setup>
const { scrapeOne } = useSources()
const toast = useToast()
const refreshing = ref(false)

async function handleRefresh() {
  refreshing.value = true
  try {
    const result = await scrapeOne(props.source.id)
    if (result.queued) {
      toast.add({ severity: 'info', summary: 'Refresh queued', detail: 'Price will update shortly', life: 3000 })
    } else {
      toast.add({ severity: 'warn', summary: 'Could not queue refresh', detail: result.error, life: 4000 })
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Refresh failed', life: 3000 })
  } finally {
    refreshing.value = false
  }
}
</script>
```

**Change 3: Show lastError when present**

Below the current price display in the card template, add:
```vue
<div v-if="source.lastError" class="flex items-start gap-1.5 mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-xs text-red-600 dark:text-red-400">
  <i class="pi pi-exclamation-triangle text-xs mt-0.5 shrink-0" />
  <span>{{ source.lastError }}</span>
</div>
```

---

## Deliverable 4 — T15: Scan button + selector format hints

This layered on top of T13 (AddSourceModal) and T14 (SourceCard fixes).

### Add `testScrape` to `frontend/composables/useSources.ts`

```typescript
export interface TestScrapeResult {
  price: number | null
  count: number
  warning: string | null
  error: string | null
}

async function testScrape(params: {
  url: string
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
}): Promise<TestScrapeResult> {
  const config = useRuntimeConfig()
  return await $fetch<TestScrapeResult>(
    `${config.public.apiUrl}/sources/test`,
    { method: 'POST', body: params }
  )
}
```

### Scan button component pattern

Both `CreateItemModal.vue` source rows AND `AddSourceModal.vue` need this UI next to each source row. Create a small reusable composable or inline the state.

For each source row, add a "Scan" button and result display:

```vue
<script setup>
// Per-source scan state (use an index or source ref as key)
const scanState = ref<{ loading: boolean; result: TestScrapeResult | null; error: string | null }>({
  loading: false,
  result: null,
  error: null,
})

const { testScrape } = useSources()

async function runScan(source: SourceDraft) {
  if (!source.url) {
    toast.add({ severity: 'warn', summary: 'Enter a URL first', life: 3000 })
    return
  }
  scanState.value = { loading: true, result: null, error: null }
  try {
    const result = await testScrape({
      url: source.url,
      priceClass: source.priceClass || null,
      cssRule: source.cssRule || null,
      fatherClass: source.fatherClass || null,
    })
    scanState.value = { loading: false, result, error: null }
  } catch (err) {
    scanState.value = { loading: false, result: null, error: 'Request failed' }
  }
}
</script>

<template>
  <!-- Next to the source row: -->
  <Button
    label="Scan"
    icon="pi pi-search"
    size="small"
    severity="secondary"
    :loading="scanState.loading"
    @click="runScan(source)"
  />

  <!-- Scan result feedback: -->
  <div v-if="scanState.result" class="mt-1 text-xs">
    <span v-if="scanState.result.price !== null" class="text-green-600">
      Found: {{ scanState.result.price }}{{ scanState.result.warning ? ' ⚠ ' + scanState.result.warning : '' }}
    </span>
    <span v-else class="text-red-500">{{ scanState.result.error ?? 'No value found' }}</span>
  </div>
</template>
```

### Selector format hints

In both `CreateItemModal.vue` source rows and `AddSourceModal.vue`, add hint text under each selector field:

- **CSS Rule**: `Full CSS selector. Use dots for classes: .product .price-tag`
- **Price Class**: `Class name only — no dot. Example: price-tag`
- **Father Class**: `Class name only — no dot. Example: product-card`

Use `<small>` or a muted `<span>` under each field label.

---

## Acceptance Criteria

- [ ] `makeBlankSource()` returns `isMain: false` for all except the first source
- [ ] Edit modal shows existing sources from `props.item.sources`
- [ ] Saving via edit modal creates/updates/deletes sources via API (not just item name/image)
- [ ] "Add Source" button opens `AddSourceModal`, not a toast
- [ ] `AddSourceModal.vue` exists and lets users add a source to an existing item
- [ ] SourceCard shows `pi-refresh` icon (not `pi-pencil`) on the scrape trigger button
- [ ] SourceCard shows `lastError` message in a red box when present
- [ ] `scrapeOne(sourceId)` is in `useSources` and called by the refresh button
- [ ] Scan button in source forms calls `POST /sources/test` and shows price or error
- [ ] Selector fields show format hints (dot vs no-dot clearly explained)
- [ ] No TypeScript errors — strict mode
- [ ] No console errors in browser

---

## Reporting

1. Write `development/web-scanner/tasks/W7-frontend-fixes/progress-report.md` after each deliverable
2. Write `development/web-scanner/tasks/W7-frontend-fixes/completion-report.md`
3. `TaskUpdate(taskId:"12", status:"completed")` → `TaskUpdate(taskId:"13", status:"completed")` → `TaskUpdate(taskId:"14", status:"completed")` → `TaskUpdate(taskId:"15", status:"completed")` in sequence as each finishes
4. Send: `COMPLETE: Frontend fixes done. isMain bug, AddSourceModal, refresh icon, lastError display, scan button all implemented.`
