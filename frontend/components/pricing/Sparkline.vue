<template>
  <div v-if="!hasData" class="h-14 flex items-center justify-center">
    <span class="text-[10px] font-mono" style="color: var(--muted-foreground); opacity: 0.4">
      No history
    </span>
  </div>
  <svg
    v-else
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    :style="{ width: '100%', height: '56px' }"
    role="img"
    aria-label="30-day price trend sparkline"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.4" />
        <stop offset="90%" :stop-color="color" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    <path :d="areaPath" :fill="`url(#${gradId})`" />
    <path
      :d="linePath"
      fill="none"
      :stroke="color"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle :cx="lastPoint.x.toFixed(1)" :cy="lastPoint.y.toFixed(1)" r="3" :fill="color" />
    <circle :cx="lastPoint.x.toFixed(1)" :cy="lastPoint.y.toFixed(1)" r="5" :fill="color" fill-opacity="0.25" />
  </svg>
</template>

<script setup lang="ts">
import type { PricePoint } from '~/types/api.types'

const props = defineProps<{
  data: PricePoint[]
  gradId: string
  positive: boolean
}>()

const W = 200
const H = 56
const PAD = 5

const hasData = computed(() => props.data.length >= 1)
const color = computed(() => (props.positive ? '#34D399' : '#F87171'))

const coords = computed(() => {
  const pts = props.data.slice(-30)
  if (pts.length === 0) return []
  const prices = pts.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || min * 0.02 || 1
  // Single point: place a centered marker so brand-new sources still show a spark
  if (prices.length === 1) {
    return [{ x: W / 2, y: H / 2 }]
  }
  return prices.map((price, i) => ({
    x: (i / (prices.length - 1)) * W,
    y: H - PAD - ((price - min) / range) * (H - PAD * 2),
  }))
})

const linePath = computed(() => {
  const c = coords.value
  if (c.length === 0) return ''
  return c
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
})

const areaPath = computed(() => {
  const c = coords.value
  if (c.length === 0) return ''
  const segments = c.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `M0,${H} ${segments} L${W},${H} Z`
})

const lastPoint = computed(() => {
  const c = coords.value
  return c[c.length - 1] ?? { x: 0, y: H / 2 }
})
</script>