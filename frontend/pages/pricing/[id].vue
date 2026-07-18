<template>
  <div>
    <NuxtLink
      to="/pricing"
      class="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider mb-4"
      style="color: var(--muted-foreground)"
    >
      <i class="pi pi-arrow-left text-[10px]" />
      Back to list
    </NuxtLink>

    <ItemDetail
      :item="item"
      :history="history"
      :history-loading="historyLoading"
      :rates="rates"
      :rates-base="ratesBase"
      :scraping="scraping"
      @toggle-favorite="onToggleFavorite"
      @edit="onEdit"
      @scrape="onScrape"
      @delete="onDelete"
      @add-source="onAddSource"
      @edit-source="onEditSource"
      @delete-source="onDeleteSource"
      @set-main="onSetMain"
      @refreshed="onSourceRefreshed"
    />

    <CreateItemModal
      v-model:visible="editVisible"
      :tags="tags"
      :existing="existingPayload"
      @submit="onSaveEdit"
    />

    <AddSourceModal
      v-model:visible="addSourceModalVisible"
      :item-id="addSourceItemId"
      @saved="onSourceSaved"
    />

    <EditSourceModal
      v-model:visible="editSourceModalVisible"
      :source="editingSource"
      @saved="onSourceSaved"
    />
  </div>
</template>

<script setup lang="ts">
import type { Currency } from '~/types/api.types'

const route = useRoute()
const router = useRouter()
const itemsApi = useItems()
const sourcesApi = useSources()
const tagStore = useTagsStore()
const tagsApi = useTags()
const currencies = useCurrencies()
const toast = useToast()
const confirm = useConfirm()

const VALID_CURRENCIES: ReadonlyArray<Currency> = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'MXN',
  'COP',
]

function toCurrency(value: string): Currency {
  return (VALID_CURRENCIES as ReadonlyArray<string>).includes(value)
    ? (value as Currency)
    : 'USD'
}

const id = computed(() => String(route.params.id))

const item = computed(() => useItemsStore().currentItem)
const history = ref<Awaited<ReturnType<typeof itemsApi.fetchHistory>> | null>(null)
const historyLoading = ref(true)
const scraping = ref(false)
const rates = ref<Record<string, number> | null>(null)
const ratesBase = ref('EUR')
const editVisible = ref(false)
const addSourceModalVisible = ref(false)
const addSourceItemId = ref('')
const editSourceModalVisible = ref(false)
const editingSourceId = ref<string | null>(null)

const editingSource = computed(
  () => item.value?.sources.find((s) => s.id === editingSourceId.value) ?? null,
)

const tags = computed(() => tagStore.tags)

const existingPayload = computed(() => {
  if (!item.value) return null
  return {
    id: item.value.id,
    name: item.value.name,
    imageUrl: item.value.imageUrl,
    tagIds: item.value.tags.map((t) => t.tag.id),
    sources: item.value.sources.map((s) => ({
      id: s.id,
      url: s.url,
      currency: s.currency,
      priceClass: s.priceClass,
      cssRule: s.cssRule,
      fatherClass: s.fatherClass,
      isMain: s.isMain,
      isDiscounted: s.isDiscounted,
      isUsed: s.isUsed,
      matchIndex: s.matchIndex ?? 0,
    })),
  }
})

async function loadAll(): Promise<void> {
  historyLoading.value = true
  try {
    await Promise.all([
      itemsApi.fetchItem(id.value).catch((err) => {
        toast.add({
          severity: 'error',
          summary: 'Item not found',
          detail: err instanceof Error ? err.message : '',
        })
        router.push('/pricing')
      }),
      tagsApi.fetchTags().catch(() => {}),
      loadHistory(),
      loadRates(),
    ])
  } finally {
    historyLoading.value = false
  }
}

async function loadHistory(): Promise<void> {
  try {
    history.value = await itemsApi.fetchHistory(id.value)
  } catch (err) {
    history.value = null
    toast.add({
      severity: 'warn',
      summary: 'History unavailable',
      detail: err instanceof Error ? err.message : '',
    })
  }
}

async function loadRates(): Promise<void> {
  try {
    const r = await currencies.getRates()
    rates.value = r.rates
    ratesBase.value = r.base
  } catch {
    rates.value = null
  }
}

onMounted(loadAll)
watch(() => id.value, loadAll)

async function onToggleFavorite(itemId: string): Promise<void> {
  try {
    await itemsApi.toggleFavorite(itemId)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Favorite failed', detail: String(err) })
  }
}

function onEdit(): void {
  editVisible.value = true
}

async function onSaveEdit(payload: {
  name: string
  imageUrl: string | null
  tagIds: string[]
  sources: Array<{
    id?: string
    url: string
    currency: string
    priceClass?: string | null
    cssRule?: string | null
    fatherClass?: string | null
    isMain: boolean
    isDiscounted?: boolean
    isUsed?: boolean
  }>
}): Promise<void> {
  try {
    await itemsApi.updateItem(id.value, {
      name: payload.name,
      imageUrl: payload.imageUrl,
      tagIds: payload.tagIds,
    })

    // Sync sources: diff against the current item's sources.
    const originalSources = item.value?.sources ?? []
    const originalById = new Map(originalSources.map((s) => [s.id, s]))
    const payloadById = new Map(
      payload.sources.filter((s) => s.id).map((s) => [s.id as string, s]),
    )

    const toDelete = originalSources.filter((s) => !payloadById.has(s.id))
    const newSources = payload.sources.filter((s) => !s.id)
    const existingUpdates = payload.sources.filter(
      (s): s is typeof s & { id: string } => Boolean(s.id) && originalById.has(s.id as string),
    )

    for (const s of newSources) {
      await sourcesApi.addSource(id.value, {
        url: s.url,
        currency: toCurrency(s.currency),
        priceClass: s.priceClass ?? null,
        cssRule: s.cssRule ?? null,
        fatherClass: s.fatherClass ?? null,
        isMain: s.isMain,
        isDiscounted: s.isDiscounted ?? false,
        isUsed: s.isUsed ?? false,
      })
    }
    for (const s of existingUpdates) {
      await sourcesApi.updateSource(s.id, {
        url: s.url,
        currency: toCurrency(s.currency),
        priceClass: s.priceClass ?? null,
        cssRule: s.cssRule ?? null,
        fatherClass: s.fatherClass ?? null,
        isMain: s.isMain,
        isDiscounted: s.isDiscounted ?? false,
        isUsed: s.isUsed ?? false,
      })
    }
    for (const s of toDelete) {
      await sourcesApi.deleteSource(s.id)
    }

    editVisible.value = false
    toast.add({ severity: 'success', summary: 'Saved', life: 2000 })
    await loadAll()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Save failed', detail: String(err) })
  }
}

async function onScrape(itemId: string): Promise<void> {
  scraping.value = true
  try {
    await itemsApi.triggerScrape(itemId)
    toast.add({ severity: 'info', summary: 'Scrape queued', life: 2000 })
    // Give the scraper a moment, then refetch history.
    setTimeout(async () => {
      await loadHistory()
      await loadAll()
      scraping.value = false
    }, 4000)
  } catch (err) {
    scraping.value = false
    toast.add({ severity: 'error', summary: 'Scrape failed', detail: String(err) })
  }
}

function onDelete(itemId: string): void {
  confirm.require({
    message: 'Delete this item and all its sources? This cannot be undone.',
    header: 'Delete item',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await itemsApi.deleteItem(itemId)
        toast.add({ severity: 'success', summary: 'Deleted', life: 2000 })
        router.push('/pricing')
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Delete failed', detail: String(err) })
      }
    },
  })
}

function onAddSource(itemId: string): void {
  addSourceItemId.value = itemId
  addSourceModalVisible.value = true
}

async function onSourceSaved(): Promise<void> {
  // Refresh the item to show the new source in the list.
  await loadAll()
}

function onEditSource(sourceId: string): void {
  editingSourceId.value = sourceId
  editSourceModalVisible.value = true
}

function onDeleteSource(sourceId: string): void {
  confirm.require({
    message: 'Delete this source?',
    header: 'Delete source',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await sourcesApi.deleteSource(sourceId)
        toast.add({ severity: 'success', summary: 'Source deleted', life: 2000 })
        await loadAll()
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Delete failed', detail: String(err) })
      }
    },
  })
}

async function onSetMain(sourceId: string): Promise<void> {
  try {
    await sourcesApi.setMain(sourceId)
    await loadAll()
    toast.add({ severity: 'success', summary: 'Main source updated', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Set main failed', detail: String(err) })
  }
}

function onSourceRefreshed(_sourceId: string): void {
  // The scrape was queued from SourceCard. After a short delay the source
  // should have new price/error data — reload item + history to display it.
  setTimeout(async () => {
    await loadHistory()
    await loadAll()
  }, 4000)
}
</script>