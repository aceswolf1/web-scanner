<template>
  <div>
    <header class="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="font-brand text-3xl font-bold tracking-tight" style="color: var(--foreground)">
          Pricing Tracker
        </h1>
        <p class="text-sm font-mono mt-1" style="color: var(--muted-foreground)">
          Track prices across all sources. Updated every 8 hours.
        </p>
      </div>
      <NuxtLink
        to="/pricing/favorites"
        class="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-md border flex items-center gap-1.5"
        :style="{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }"
      >
        <i class="pi pi-star-fill text-[10px]" style="color: #FBBF24" />
        Favorites
      </NuxtLink>
    </header>

    <!-- Portfolio bar -->
    <section
      class="mb-6 rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-4"
      :style="{ background: 'var(--card)', borderColor: 'var(--border)' }"
      aria-label="Portfolio total"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          :style="{ background: 'rgba(139,92,246,0.15)' }"
        >
          <i class="pi pi-wallet text-sm" style="color: var(--primary)" />
        </div>
        <div class="min-w-0">
          <p class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--muted-foreground)">
            Portfolio total
          </p>
          <p class="font-mono text-xl font-bold leading-none" style="color: var(--primary)">
            <template v-if="ratesLoading">…</template>
            <template v-else-if="!rates">—</template>
            <template v-else>
              {{ formatPrice(portfolioValue, portfolioCurrency) }}
            </template>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <label class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--muted-foreground)" for="portfolio-currency">
          Currency
        </label>
        <Select
          id="portfolio-currency"
          v-model="portfolioCurrency"
          :options="currencyOptions"
          option-label="label"
          option-value="value"
          size="small"
          class="text-xs"
          aria-label="Portfolio currency"
        />
      </div>

      <p
        v-if="!rates && !ratesLoading"
        class="w-full text-[11px] font-mono"
        style="color: var(--muted-foreground)"
      >
        Rates unavailable — totals use raw prices without conversion.
      </p>
    </section>

    <div
      v-if="store.error"
      class="mb-4 rounded-xl border px-4 py-3 text-sm font-mono flex items-start gap-2"
      style="background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.35); color: rgb(248 113 113)"
    >
      <i class="pi pi-exclamation-triangle mt-0.5 shrink-0" />
      <div class="min-w-0 break-words">
        <div class="font-semibold mb-0.5">Failed to load items</div>
        <div class="opacity-90 text-xs whitespace-pre-wrap">{{ store.error }}</div>
      </div>
    </div>

    <ItemList
      ref="itemListRef"
      :items="items"
      :tags="tags"
      :loading="store.loading"
      :initial-search="initialSearch"
      :enable-bulk="true"
      :bulk-busy="bulkBusy"
      @search="onSearch"
      @create="openCreate"
      @create-tag="openCreateTag"
      @open="openItem"
      @toggle-favorite="onToggleFavorite"
      @bulk-action="onBulkAction"
    />

    <CreateItemModal
      v-model:visible="createVisible"
      :tags="tags"
      @submit="onCreateSubmit"
    />

    <CreateTagModal
      v-model:visible="createTagVisible"
      @created="onTagCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn, useLocalStorage } from '@vueuse/core'
import Select from 'primevue/select'
import type { Currency } from '~/types/api.types'
import { formatPrice } from '~/utils/currency'
import { portfolioTotal } from '~/utils/bestDeal'
import { CURRENCY_OPTIONS } from '~/utils/currencyOptions'
type BulkAction = 'scrape' | 'favorite' | 'unfavorite' | 'delete'

definePageMeta({ name: 'pricing-index' })

const router = useRouter()
const route = useRoute()
const store = useItemsStore()
const tagStore = useTagsStore()
const itemsApi = useItems()
const tagsApi = useTags()
const currencies = useCurrencies()
const toast = useToast()
const confirm = useConfirm()

const createVisible = ref(false)
const createTagVisible = ref(false)
const searchQuery = ref<string>(typeof route.query.search === 'string' ? route.query.search : '')
const initialSearch = searchQuery.value
const bulkBusy = ref(false)
const rates = ref<Record<string, number> | null>(null)
const ratesBase = ref('EUR')
const ratesLoading = ref(true)
const itemListRef = ref<{ clearSelection: () => void } | null>(null)

const portfolioCurrency = useLocalStorage<Currency>('pricing-portfolio-currency', 'USD')
const currencyOptions = CURRENCY_OPTIONS.map((c) => ({ label: c, value: c }))

const debouncedSearch = useDebounceFn(async (value: string) => {
  await itemsApi.fetchItems({ search: value || undefined })
}, 250)

watch(searchQuery, (v) => {
  router.replace({ query: { ...route.query, search: v || undefined } })
  void debouncedSearch(v)
})

const items = computed(() => store.items)
const tags = computed(() => tagStore.tags)

const portfolioValue = computed(() =>
  portfolioTotal(items.value, {
    rates: rates.value,
    ratesBase: ratesBase.value,
    displayCurrency: portfolioCurrency.value,
  }),
)

// Load on both SSR and client so a client-hydration glitch can't leave the grid empty.
const { error: loadError } = await useAsyncData(
  'pricing-index',
  async () => {
    await Promise.all([
      itemsApi.fetchItems({ search: searchQuery.value || undefined }),
      tagsApi.fetchTags(),
      loadRates(),
    ])
    return true
  },
  { server: true, lazy: false },
)

async function loadRates(): Promise<void> {
  ratesLoading.value = true
  try {
    const data = await currencies.getRates()
    rates.value = data.rates
    ratesBase.value = data.base
  } catch {
    rates.value = null
  } finally {
    ratesLoading.value = false
  }
}

watch(
  loadError,
  (err) => {
    if (!err) return
    toast.add({
      severity: 'error',
      summary: 'Failed to load',
      detail: err.message || store.error || 'Unknown error',
      life: 12000,
    })
  },
  { immediate: true },
)

function onSearch(value: string): void {
  searchQuery.value = value
}

function openItem(id: string): void {
  router.push(`/pricing/${id}`)
}

function openCreate(): void {
  createVisible.value = true
}

function openCreateTag(): void {
  createTagVisible.value = true
}

function onTagCreated(): void {
  // Tag is already upserted into the store by useTags().createTag.
  // No extra work needed; the filter chips re-render from tagStore.tags.
}

async function onCreateSubmit(payload: {
  name: string
  imageUrl: string | null
  tagIds: string[]
  sources: Array<{
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
    const item = await itemsApi.createItem(payload)
    createVisible.value = false
    toast.add({ severity: 'success', summary: 'Created', detail: item.name, life: 3000 })
    router.push(`/pricing/${item.id}`)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Create failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
      life: 5000,
    })
  }
}

async function onToggleFavorite(id: string): Promise<void> {
  try {
    await itemsApi.toggleFavorite(id)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Favorite failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

function onBulkAction(action: BulkAction, ids: string[]): void {
  if (action === 'delete') {
    confirm.require({
      message: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
      header: 'Confirm bulk delete',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      accept: () => {
        void runBulk(action, ids)
      },
    })
    return
  }
  void runBulk(action, ids)
}

async function runBulk(action: BulkAction, ids: string[]): Promise<void> {
  if (bulkBusy.value || ids.length === 0) return
  bulkBusy.value = true
  let succeeded = 0
  let failed = 0

  try {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        if (action === 'scrape') {
          await itemsApi.triggerScrape(id)
          return
        }
        if (action === 'delete') {
          await itemsApi.deleteItem(id)
          return
        }
        // favorite / unfavorite: toggle only when current state differs
        const item = store.items.find((i) => i.id === id)
        const wantFavorite = action === 'favorite'
        if (item && item.isFavorite === wantFavorite) return
        await itemsApi.toggleFavorite(id)
        // If toggle flipped the wrong way (race), toggle again
        const after = store.items.find((i) => i.id === id)
        if (after && after.isFavorite !== wantFavorite) {
          await itemsApi.toggleFavorite(id)
        }
      }),
    )

    for (const r of results) {
      if (r.status === 'fulfilled') succeeded += 1
      else failed += 1
    }

    toast.add({
      severity: failed === 0 ? 'success' : succeeded === 0 ? 'error' : 'warn',
      summary: bulkSummary(action),
      detail: `${succeeded} succeeded${failed ? ` · ${failed} failed` : ''}`,
      life: 4000,
    })

    if (action === 'delete' && succeeded > 0) {
      itemListRef.value?.clearSelection()
    }
  } finally {
    bulkBusy.value = false
  }
}

function bulkSummary(action: BulkAction): string {
  switch (action) {
    case 'scrape':
      return 'Bulk scrape'
    case 'favorite':
      return 'Bulk favorite'
    case 'unfavorite':
      return 'Bulk unfavorite'
    case 'delete':
      return 'Bulk delete'
  }
}
</script>
