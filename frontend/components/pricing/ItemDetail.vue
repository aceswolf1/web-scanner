<template>
  <div v-if="!item" class="flex items-center justify-center py-20">
    <i class="pi pi-spin pi-spinner text-2xl" style="color: var(--muted-foreground)" />
  </div>

  <div v-else class="flex flex-col gap-6">
    <!-- Header card -->
    <section
      class="bg-card border rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start"
      :style="{ background: 'var(--card)', borderColor: 'var(--border)' }"
    >
      <div
        class="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border"
        :style="{ background: 'var(--muted)', borderColor: 'var(--border)' }"
      >
        <img
          v-if="item.imageUrl && !imgErr"
          :src="item.imageUrl"
          :alt="item.name"
          class="w-full h-full object-cover"
          @error="imgErr = true"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20"
        >
          <i class="pi pi-box text-3xl" style="color: var(--primary); opacity: 0.5" />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="font-brand text-2xl font-bold tracking-tight" style="color: var(--foreground)">
            {{ item.name }}
          </h1>
          <span
            class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
            :style="{ background: 'var(--muted)', color: 'var(--muted-foreground)' }"
          >
            {{ item.sources.length }} source{{ item.sources.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div v-if="item.tags.length" class="flex flex-wrap gap-1.5 mt-3">
          <TagBadge v-for="ref in item.tags" :key="ref.tag.id" :tag="ref.tag" />
        </div>

        <div v-if="mainSrc && mainSrc.currentPrice != null" class="flex items-baseline gap-2 mt-4">
          <span class="font-mono text-3xl font-bold leading-none" style="color: var(--primary)">
            {{ formatPrice(mainSrc.currentPrice, mainSrc.currency) }}
          </span>
          <span class="text-sm font-mono" style="color: var(--muted-foreground)">
            {{ mainSrc.currency }}
          </span>
          <span class="text-[10px] font-mono ml-2" style="color: var(--muted-foreground); opacity: 0.6">
            · main from {{ hostnameOf(mainSrc.url) }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          class="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors"
          :style="{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            color: item.isFavorite ? '#FBBF24' : 'var(--muted-foreground)',
          }"
          :aria-pressed="item.isFavorite"
          @click="$emit('toggleFavorite', item.id)"
        >
          <i :class="['pi pi-star-fill text-sm']" />
        </button>
        <button
          type="button"
          class="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors hover:bg-muted/30"
          :style="{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }"
          aria-label="Edit"
          @click="$emit('edit', item.id)"
        >
          <i class="pi pi-pencil text-sm" />
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-semibold text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:brightness-110 transition"
          style="background: linear-gradient(135deg, #8B5CF6, #7C3AED)"
          :disabled="scraping"
          @click="$emit('scrape', item.id)"
        >
          <i :class="['pi', scraping ? 'pi-spin pi-spinner' : 'pi-refresh', 'text-xs']" />
          Scrape All
        </button>
        <button
          type="button"
          class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-red-400/10"
          style="color: rgb(248 113 113)"
          aria-label="Delete"
          @click="$emit('delete', item.id)"
        >
          <i class="pi pi-trash text-sm" />
        </button>
      </div>
    </section>

    <!-- Comparison chart -->
    <PriceHistoryChart
      :history="history"
      :rates="rates"
      :rates-base="ratesBase"
      :loading="historyLoading"
    />

    <!-- Sources header -->
    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-2">
        <h2 class="font-brand text-lg font-bold" style="color: var(--foreground)">Sources</h2>
        <span
          class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          :style="{ background: 'var(--muted)', color: 'var(--muted-foreground)' }"
        >
          best deal first
        </span>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-white"
        style="background: linear-gradient(135deg, #8B5CF6, #7C3AED)"
        @click="$emit('addSource', item.id)"
      >
        <i class="pi pi-plus text-[10px]" />
        Add Source
      </button>
    </div>

    <!-- Sources grid (2 cols), sorted by best deal -->
    <div v-if="rankedSources.length" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SourceCard
        v-for="source in rankedSources"
        :key="source.id"
        :source="source"
        :rates="rates"
        :rates-base="ratesBase"
        :is-best-deal="source.isBestDeal"
        @set-main="(id) => $emit('setMain', id)"
        @edit="(id) => $emit('editSource', id)"
        @delete="(id) => $emit('deleteSource', id)"
        @refreshed="(id) => $emit('refreshed', id)"
      />
    </div>
    <div
      v-else
      class="rounded-2xl border border-dashed p-10 text-center"
      :style="{ borderColor: 'var(--border)' }"
    >
      <p class="text-sm" style="color: var(--muted-foreground)">
        No sources yet. Add one to start scraping prices.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item, HistoryResponse, Currency } from '~/types/api.types'
import { formatPrice } from '~/utils/currency'
import { hostnameOf } from '~/utils/time'
import { rankSourcesByDeal } from '~/utils/bestDeal'

const props = defineProps<{
  item: Item | null
  history: HistoryResponse | null
  historyLoading?: boolean
  rates: Record<string, number> | null
  ratesBase: string
  scraping?: boolean
}>()

defineEmits<{
  toggleFavorite: [id: string]
  edit: [id: string]
  scrape: [id: string]
  delete: [id: string]
  addSource: [id: string]
  editSource: [id: string]
  deleteSource: [id: string]
  setMain: [id: string]
  refreshed: [id: string]
}>()

const imgErr = ref(false)
const mainSrc = computed(() => {
  return props.item?.sources.find((s) => s.isMain) ?? props.item?.sources[0]
})

/** Prefer main source currency for ranking display base; fallback USD. */
const dealCurrency = computed<Currency>(() => {
  return mainSrc.value?.currency ?? 'USD'
})

const rankedSources = computed(() => {
  if (!props.item?.sources) return []
  return rankSourcesByDeal(props.item.sources, {
    rates: props.rates,
    ratesBase: props.ratesBase,
    displayCurrency: dealCurrency.value,
  })
})
</script>
