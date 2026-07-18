<template>
  <article
    class="bg-card border rounded-2xl p-5 relative overflow-hidden transition-all"
    :class="cardBorderClass"
    :style="cardStyle"
  >
    <!-- MAIN badge -->
    <div
      v-if="source.isMain"
      class="absolute top-0 left-0 px-2.5 py-1 rounded-br-xl text-[10px] font-mono font-bold uppercase tracking-wider"
      :style="{ background: 'var(--primary)', color: 'var(--primary-foreground)' }"
    >
      Main
    </div>

    <!-- Best Deal badge -->
    <div
      v-if="isBestDeal"
      class="absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
      style="background: linear-gradient(135deg, #FBBF24, #F59E0B); color: #1C1408"
    >
      <i class="pi pi-star-fill text-[9px]" />
      Best Deal
    </div>

    <!-- Status badges (top-right stack) — shift down when Best Deal is present -->
    <div
      v-if="(source.isDiscounted || source.isUsed) && !isBestDeal"
      class="absolute top-0 right-0 flex flex-col items-end"
    >
      <div
        v-if="source.isDiscounted"
        class="px-2.5 py-1 rounded-bl-xl text-[10px] font-mono font-bold uppercase tracking-wider"
        style="background: rgba(245,158,11,0.18); color: #F59E0B"
      >
        <i class="pi pi-tag text-[9px] mr-1" />
        Discounted
      </div>
      <div
        v-if="source.isUsed"
        class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider"
        :class="source.isDiscounted ? '' : 'rounded-bl-xl'"
        style="background: rgba(59,130,246,0.16); color: #3B82F6"
      >
        <i class="pi pi-box text-[9px] mr-1" />
        Used
      </div>
    </div>
    <div
      v-else-if="(source.isDiscounted || source.isUsed) && isBestDeal"
      class="absolute top-7 right-0 flex flex-col items-end"
    >
      <div
        v-if="source.isDiscounted"
        class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider"
        style="background: rgba(245,158,11,0.18); color: #F59E0B"
      >
        <i class="pi pi-tag text-[9px] mr-1" />
        Discounted
      </div>
      <div
        v-if="source.isUsed"
        class="px-2.5 py-1 rounded-bl-xl text-[10px] font-mono font-bold uppercase tracking-wider"
        style="background: rgba(59,130,246,0.16); color: #3B82F6"
      >
        <i class="pi pi-box text-[9px] mr-1" />
        Used
      </div>
    </div>

    <!-- Top row: hostname + currency dropdown -->
    <div
      class="flex items-start justify-between gap-3 mb-3"
      :class="needsTopMargin ? 'mt-7' : ''"
    >
      <div class="min-w-0 flex-1">
        <a
          :href="source.url"
          target="_blank"
          rel="noopener"
          class="block text-sm font-semibold truncate hover:underline"
          style="color: var(--foreground)"
        >
          {{ hostname }}
        </a>
        <p class="text-[10px] font-mono truncate" style="color: var(--muted-foreground)">
          {{ source.url }}
        </p>
      </div>

      <Select
        v-model="displayCurrency"
        :options="currencyOptions"
        option-label="label"
        option-value="value"
        placeholder="Display in"
        class="text-xs"
        size="small"
      />
    </div>

    <!-- Price block -->
    <div class="flex items-baseline gap-2 mb-1">
      <span class="font-mono text-2xl font-bold leading-none" style="color: var(--primary)">
        {{ displayPrice }}
      </span>
      <span class="text-xs font-mono" style="color: var(--muted-foreground)">
        {{ displayCurrency }}
      </span>
      <span
        v-if="source.currency !== displayCurrency"
        class="text-[10px] font-mono ml-auto"
        style="color: var(--muted-foreground); opacity: 0.6"
      >
        from {{ source.currency }} {{ formatPrice(source.currentPrice ?? 0, source.currency) }}
      </span>
    </div>
    <div
      v-if="source.isDiscounted || source.isUsed"
      class="flex flex-wrap items-center gap-2 mb-3"
    >
      <p
        v-if="source.isDiscounted"
        class="text-[11px] font-mono flex items-center gap-1"
        style="color: #F59E0B"
      >
        <i class="pi pi-tag text-[10px]" />
        Extracting discounted price
      </p>
      <p
        v-if="source.isUsed"
        class="text-[11px] font-mono flex items-center gap-1"
        style="color: #3B82F6"
      >
        <i class="pi pi-box text-[10px]" />
        Used condition
      </p>
    </div>
    <div v-else class="mb-3" />

    <!-- Notes -->
    <p
      v-if="source.notes"
      class="text-xs font-mono mb-3 leading-relaxed"
      style="color: var(--muted-foreground)"
    >
      <i class="pi pi-pencil text-[10px] mr-1 opacity-70" aria-hidden="true" />
      {{ source.notes }}
    </p>

    <!-- Health chip -->
    <div v-if="health.score !== null" class="mb-3">
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border"
        :style="healthChipStyle"
        :aria-label="`Source health ${health.score} — ${health.label}`"
      >
        <span
          class="inline-block w-1.5 h-1.5 rounded-full"
          :style="{ background: healthDotColor }"
          aria-hidden="true"
        />
        Health {{ health.score }}
        <span class="opacity-70 font-normal">· {{ health.label }}</span>
      </span>
    </div>

    <!-- CSS selector chip row -->
    <div class="flex flex-wrap gap-1.5 mb-3">
      <span
        v-if="source.priceClass"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border"
        :style="{ background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }"
      >
        <i class="pi pi-hashtag text-[10px]" />
        .{{ source.priceClass }}
      </span>
      <span
        v-if="source.fatherClass"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border"
        :style="{ background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }"
      >
        <i class="pi pi-sitemap text-[10px]" />
        .{{ source.fatherClass }}
      </span>
      <span
        v-if="source.cssRule"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border truncate max-w-full"
        :style="{ background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }"
      >
        <i class="pi pi-code text-[10px]" />
        {{ source.cssRule }}
      </span>
      <span
        v-if="!source.priceClass && !source.fatherClass && !source.cssRule"
        class="text-[10px] font-mono"
        style="color: var(--muted-foreground); opacity: 0.6"
      >
        no selector configured
      </span>
    </div>

    <!-- Last scrape error -->
    <div
      v-if="source.lastError"
      class="flex items-start gap-1.5 mt-2 p-2 rounded text-xs"
      style="background: rgba(248,113,113,0.12); color: rgb(248 113 113)"
    >
      <i class="pi pi-exclamation-triangle text-xs mt-0.5 shrink-0" />
      <span>{{ source.lastError }}</span>
    </div>

    <!-- Footer: scraped time + actions -->
    <div class="flex items-center justify-between gap-3 pt-3 border-t" :style="{ borderColor: 'var(--border)' }">
      <div class="flex items-center gap-1.5 text-[10px] font-mono" style="color: var(--muted-foreground)">
        <i class="pi pi-clock text-[10px]" />
        <span v-if="source.lastScrapedAt">{{ timeAgo(source.lastScrapedAt) }}</span>
        <span v-else>never scraped</span>
        <span v-if="source.priceHistory && source.priceHistory.length" class="opacity-60">
          · {{ source.priceHistory.length }} pts
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="!source.isMain"
          type="button"
          class="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md transition-colors"
          :style="{ color: 'var(--muted-foreground)' }"
          @click="$emit('setMain', source.id)"
        >
          set main
        </button>
        <a
          :href="source.url"
          target="_blank"
          rel="noopener"
          class="p-1.5 rounded-md hover:bg-muted/40 transition-colors"
          :style="{ color: 'var(--muted-foreground)' }"
          aria-label="Open source URL"
        >
          <i class="pi pi-external-link text-xs" />
        </a>
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-muted/40 transition-colors"
          :style="{ color: 'var(--muted-foreground)' }"
          aria-label="Edit source"
          @click="$emit('edit', source.id)"
        >
          <i class="pi pi-pencil text-xs" />
        </button>
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-muted/40 transition-colors disabled:opacity-50"
          :style="{ color: 'var(--muted-foreground)' }"
          aria-label="Refresh source"
          :disabled="refreshing"
          @click="handleRefresh"
        >
          <i
            :class="refreshing ? 'pi pi-spin pi-spinner text-xs' : 'pi pi-refresh text-xs'"
          />
        </button>
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-red-400/10 transition-colors"
          style="color: rgb(248 113 113)"
          aria-label="Delete source"
          @click="$emit('delete', source.id)"
        >
          <i class="pi pi-trash text-xs" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import Select from 'primevue/select'
import type { Source, Currency } from '~/types/api.types'
import { formatPrice, convertPrice } from '~/utils/currency'
import { hostnameOf, timeAgo } from '~/utils/time'
import { CURRENCY_OPTIONS } from '~/utils/currencyOptions'
import { sourceHealth } from '~/utils/healthScore'

const props = withDefaults(
  defineProps<{
    source: Source
    rates: Record<string, number> | null
    ratesBase: string
    isBestDeal?: boolean
  }>(),
  { isBestDeal: false },
)

const emit = defineEmits<{
  setMain: [id: string]
  edit: [id: string]
  delete: [id: string]
  refreshed: [id: string]
}>()

const { scrapeOne } = useSources()
const toast = useToast()
const refreshing = ref(false)

const currencyOptions = CURRENCY_OPTIONS.map((c) => ({ label: c, value: c }))

const displayCurrency = ref<Currency>(props.source.currency)

watch(
  () => props.source.currency,
  (next) => {
    displayCurrency.value = next
  },
)

const hostname = computed(() => hostnameOf(props.source.url))

const health = computed(() => sourceHealth(props.source))

const needsTopMargin = computed(
  () =>
    props.source.isMain ||
    props.source.isDiscounted ||
    props.source.isUsed ||
    props.isBestDeal,
)

const cardBorderClass = computed(() => {
  if (props.isBestDeal) return 'border-amber-400/70'
  if (props.source.isMain) return 'border-primary/40 shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_4px_24px_rgba(124,58,237,0.12)]'
  return 'border-border'
})

const cardStyle = computed(() => {
  const base: Record<string, string> = { background: 'var(--card)' }
  if (props.isBestDeal) {
    base.boxShadow =
      '0 0 0 1px rgba(245,158,11,0.45), 0 4px 28px rgba(245,158,11,0.18)'
  }
  return base
})

const healthDotColor = computed(() => {
  switch (health.value.tone) {
    case 'green':
      return '#10B981'
    case 'amber':
      return '#F59E0B'
    case 'red':
      return '#F87171'
    default:
      return 'var(--muted-foreground)'
  }
})

const healthChipStyle = computed(() => {
  switch (health.value.tone) {
    case 'green':
      return {
        background: 'rgba(16,185,129,0.12)',
        color: '#10B981',
        borderColor: 'rgba(16,185,129,0.35)',
      }
    case 'amber':
      return {
        background: 'rgba(245,158,11,0.12)',
        color: '#F59E0B',
        borderColor: 'rgba(245,158,11,0.35)',
      }
    case 'red':
      return {
        background: 'rgba(248,113,113,0.12)',
        color: '#F87171',
        borderColor: 'rgba(248,113,113,0.35)',
      }
    default:
      return {
        background: 'var(--muted)',
        color: 'var(--muted-foreground)',
        borderColor: 'var(--border)',
      }
  }
})

const displayPrice = computed(() => {
  if (props.source.currentPrice == null) return '—'
  if (displayCurrency.value === props.source.currency) {
    return formatPrice(props.source.currentPrice, props.source.currency)
  }
  if (!props.rates) {
    return formatPrice(props.source.currentPrice, props.source.currency)
  }
  const converted = convertPrice(
    props.source.currentPrice,
    props.source.currency,
    displayCurrency.value,
    props.rates,
    props.ratesBase,
  )
  return formatPrice(converted, displayCurrency.value)
})

async function handleRefresh(): Promise<void> {
  if (refreshing.value) return
  refreshing.value = true
  try {
    const result = await scrapeOne(props.source.id)
    if (result.price !== null) {
      toast.add({
        severity: 'success',
        summary: 'Price updated',
        detail: result.warning ?? undefined,
        life: 3000,
      })
      emit('refreshed', props.source.id)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Could not fetch price',
        detail: result.error ?? 'No price found',
        life: 5000,
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Refresh failed',
      detail: err instanceof Error ? err.message : '',
      life: 4000,
    })
  } finally {
    refreshing.value = false
  }
}
</script>
