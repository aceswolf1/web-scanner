<template>
  <div
    class="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_28px_rgba(139,92,246,0.2)]"
    :class="selected ? 'ring-2 ring-primary/60 border-primary/50' : ''"
    role="button"
    tabindex="0"
    :aria-label="`Open ${item.name}`"
    :aria-selected="selectable ? selected : undefined"
    @click="onClick"
    @keydown.enter="onClick"
    @keydown.space.prevent="onClick"
  >
    <!-- Selection checkbox -->
    <div
      v-if="selectable"
      class="absolute top-3 left-3 z-10"
      @click.stop
    >
      <input
        type="checkbox"
        class="w-4 h-4 rounded border cursor-pointer accent-[var(--primary)]"
        :checked="selected"
        :aria-label="`Select ${item.name}`"
        @change="onToggleSelect"
      />
    </div>

    <!-- Zone 1 — Header -->
    <div class="relative flex items-start gap-3 px-4 pt-4 pb-3" :class="selectable ? 'pl-9' : ''">
      <div class="w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
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
          <i class="pi pi-box text-primary/40 text-xl" />
        </div>
      </div>

      <div class="flex-1 min-w-0 pr-7">
        <div class="font-semibold text-sm leading-snug line-clamp-2 mb-1.5" style="color: var(--foreground)">
          {{ item.name }}
        </div>
        <div v-if="itemTags.length" class="flex flex-wrap gap-1">
          <TagBadge v-for="t in itemTags.slice(0, 2)" :key="t.id" :tag="t" />
          <span
            v-if="itemTags.length > 2"
            class="text-[10px] self-center font-mono"
            style="color: var(--muted-foreground)"
          >
            +{{ itemTags.length - 2 }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors border border-border/60 group-hover:border-primary/30"
        :aria-pressed="item.isFavorite"
        :aria-label="item.isFavorite ? 'Unfavorite' : 'Favorite'"
        @click="onToggleFavorite"
      >
        <i
          :class="['pi pi-star-fill text-xs transition-colors']"
          :style="{
            color: item.isFavorite ? '#FBBF24' : 'var(--muted-foreground)',
          }"
        />
      </button>
    </div>

    <!-- Zone 2 — Sparkline zone -->
    <div class="relative">
      <div class="flex items-center justify-between px-4 mb-1">
        <span
          class="text-[10px] font-mono uppercase tracking-wider"
          style="color: var(--muted-foreground)"
        >
          30d trend
        </span>
        <span
          v-if="pctChange !== null"
          class="flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
          :class="isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'"
        >
          <i :class="['pi', isPositive ? 'pi-arrow-up-right' : 'pi-arrow-down-right', 'text-[10px]']" />
          {{ isPositive ? '+' : '' }}{{ pctChange.toFixed(1) }}%
        </span>
      </div>

      <Sparkline
        :data="history"
        :grad-id="gradId"
        :positive="isPositive"
      />

      <!-- ATH / ATL -->
      <div
        v-if="athAtl.ath != null && athAtl.atl != null && mainSrc"
        class="flex items-center justify-between gap-2 px-4 mt-1"
      >
        <span
          class="text-[10px] font-mono"
          style="color: #10B981"
          :title="athAtl.atlAt ? `All-time low at ${athAtl.atlAt}` : 'All-time low'"
        >
          ATL {{ formatPrice(athAtl.atl, mainSrc.currency) }}
        </span>
        <span
          class="text-[10px] font-mono"
          style="color: #F87171"
          :title="athAtl.athAt ? `All-time high at ${athAtl.athAt}` : 'All-time high'"
        >
          ATH {{ formatPrice(athAtl.ath, mainSrc.currency) }}
        </span>
      </div>
    </div>

    <!-- Zone 3 — Footer -->
    <div
      class="px-4 pt-2.5 pb-3.5 border-t flex items-end justify-between gap-2"
      :style="{ borderColor: 'var(--border)' }"
    >
      <div class="min-w-0">
        <div v-if="mainSrc && mainSrc.currentPrice != null" class="flex items-baseline gap-1">
          <span class="font-mono text-lg font-bold leading-none" style="color: var(--primary)">
            {{ formatPrice(mainSrc.currentPrice, mainSrc.currency) }}
          </span>
          <span class="text-xs font-mono" style="color: var(--muted-foreground)">
            {{ mainSrc.currency }}
          </span>
        </div>
        <span v-else class="text-xs font-mono" style="color: var(--muted-foreground)">
          No price yet
        </span>

        <div class="flex items-center gap-2 mt-1">
          <span
            v-if="host"
            class="text-[10px] font-mono truncate max-w-[110px]"
            style="color: var(--muted-foreground); opacity: 0.7"
          >
            {{ host }}
          </span>
          <span
            v-if="mainSrc?.lastScrapedAt"
            class="flex items-center gap-0.5 text-[10px] font-mono shrink-0"
            style="color: var(--muted-foreground); opacity: 0.6"
          >
            <i class="pi pi-clock text-[10px]" />
            {{ timeAgo(mainSrc.lastScrapedAt) }}
          </span>
        </div>
      </div>

      <div
        class="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono shrink-0 border"
        :style="{
          background: 'var(--secondary)',
          color: 'var(--secondary-foreground)',
          borderColor: 'var(--border)',
        }"
      >
        <i class="pi pi-link text-[10px]" />
        {{ item.sources.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item, Tag, PricePoint } from '~/types/api.types'
import { hostnameOf, timeAgo } from '~/utils/time'
import { formatPrice } from '~/utils/currency'
import { getAthAtl } from '~/utils/athAtl'

const props = withDefaults(
  defineProps<{
    item: Item
    tags: Tag[]
    onClick: () => void
    onToggleFavorite: () => void
    selectable?: boolean
    selected?: boolean
    onToggleSelect?: () => void
  }>(),
  {
    selectable: false,
    selected: false,
    onToggleSelect: undefined,
  },
)

const imgErr = ref(false)

const gradId = computed(() => `sg-${props.item.id}`)

const mainSrc = computed(() => {
  return props.item.sources.find((s) => s.isMain) ?? props.item.sources[0]
})

const itemTags = computed(() => props.tags.filter((t) => props.item.tags.some((ref) => ref.tag.id === t.id)))

const history = computed<PricePoint[]>(() => mainSrc.value?.priceHistory ?? [])

const athAtl = computed(() => getAthAtl(history.value))

const pctChange = computed<number | null>(() => {
  const hist = history.value
  if (!mainSrc.value || hist.length < 2) return null
  const first = hist[0]?.price
  const current = mainSrc.value.currentPrice
  if (first == null || current == null || first === 0) return null
  return ((current - first) / first) * 100
})

const isPositive = computed(() => (pctChange.value ?? 0) >= 0)

const host = computed(() => (mainSrc.value ? hostnameOf(mainSrc.value.url) : ''))

function onToggleFavorite(event: MouseEvent): void {
  event.stopPropagation()
  props.onToggleFavorite()
}

function onToggleSelect(): void {
  props.onToggleSelect?.()
}
</script>
