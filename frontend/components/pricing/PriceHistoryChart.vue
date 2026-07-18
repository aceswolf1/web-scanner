<template>
  <section
    class="bg-card border rounded-2xl p-6"
    :style="{ background: 'var(--card)', borderColor: 'var(--border)' }"
  >
    <header class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <h2 class="font-brand text-lg font-bold" style="color: var(--foreground)">
          Price history
        </h2>
        <p class="text-xs font-mono mt-0.5" style="color: var(--muted-foreground)">
          {{ totalPoints }} data points · {{ series.length }} source{{ series.length === 1 ? '' : 's' }}
        </p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <div
          v-if="athAtl.ath != null && athAtl.atl != null"
          class="flex items-center gap-3 text-[10px] font-mono"
        >
          <span style="color: #10B981" :title="'All-time low across series'">
            ATL {{ formatPrice(athAtl.atl, displayCurrency) }}
          </span>
          <span style="color: #F87171" :title="'All-time high across series'">
            ATH {{ formatPrice(athAtl.ath, displayCurrency) }}
          </span>
        </div>
        <Select
          v-model="displayCurrency"
          :options="currencyOptions"
          option-label="label"
          option-value="value"
          placeholder="Display in"
          size="small"
        />
        <span
          class="text-[10px] font-mono px-2 py-1 rounded-md"
          :style="{ background: 'var(--muted)', color: 'var(--muted-foreground)' }"
        >
          {{ ratesBase }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="h-72 flex items-center justify-center">
      <i class="pi pi-spin pi-spinner text-2xl" style="color: var(--muted-foreground)" />
    </div>

    <div v-else-if="!hasData" class="h-72 flex flex-col items-center justify-center gap-2">
      <i class="pi pi-chart-line text-3xl" style="color: var(--muted-foreground); opacity: 0.5" />
      <p class="text-sm font-medium" style="color: var(--foreground)">No price history yet</p>
      <p class="text-xs font-mono" style="color: var(--muted-foreground)">
        History appears after the first scrape completes.
      </p>
    </div>

    <div v-else class="relative" style="height: 288px">
      <Line :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
    </div>

    <!-- Legend -->
    <ul v-if="hasData" class="flex flex-wrap gap-3 mt-4">
      <li
        v-for="(s, idx) in series"
        :key="s.sourceId"
        class="flex items-center gap-1.5 text-[10px] font-mono"
        style="color: var(--muted-foreground)"
      >
        <span
          class="inline-block w-2.5 h-2.5 rounded-sm"
          :style="{ background: PALETTE[idx % PALETTE.length] }"
        />
        <span>{{ s.sourceName }}</span>
      </li>
      <li
        v-if="athAtl.ath != null"
        class="flex items-center gap-1.5 text-[10px] font-mono"
        style="color: var(--muted-foreground)"
      >
        <span class="inline-block w-2.5 h-0.5" style="background: #F87171" />
        <span>ATH</span>
      </li>
      <li
        v-if="athAtl.atl != null"
        class="flex items-center gap-1.5 text-[10px] font-mono"
        style="color: var(--muted-foreground)"
      >
        <span class="inline-block w-2.5 h-0.5" style="background: #10B981" />
        <span>ATL</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import Select from 'primevue/select'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
  type Plugin,
} from 'chart.js'
import type { HistoryResponse, Currency } from '~/types/api.types'
import { formatPrice, convertPrice } from '~/utils/currency'
import { formatChartDate } from '~/utils/time'
import { CURRENCY_OPTIONS } from '~/utils/currencyOptions'
import { getAthAtlFromSeries } from '~/utils/athAtl'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps<{
  history: HistoryResponse | null
  rates: Record<string, number> | null
  ratesBase: string
  loading?: boolean
}>()

const currencyOptions = CURRENCY_OPTIONS.map((c) => ({ label: c, value: c }))
const displayCurrency = ref<Currency>('USD')

const PALETTE = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#3B82F6']

const series = computed(() => props.history?.history ?? [])
const totalPoints = computed(() => series.value.reduce((acc, s) => acc + s.points.length, 0))
const hasData = computed(() => totalPoints.value > 0 && series.value.length > 0)

// Build a unified X axis: all unique scrapedAt values across sources, sorted.
const xLabels = computed(() => {
  const all = new Set<string>()
  for (const s of series.value) {
    for (const p of s.points) all.add(p.scrapedAt)
  }
  return Array.from(all).sort().map(formatChartDate)
})

function convertPoint(price: number, from: Currency): number {
  if (displayCurrency.value === from) return price
  if (!props.rates) return price
  return convertPrice(price, from, displayCurrency.value, props.rates, props.ratesBase)
}

/** Converted series for ATH/ATL in display currency. */
const convertedSeries = computed(() => {
  return series.value.map((s) => ({
    points: s.points.map((p) => ({
      price: convertPoint(p.price, s.currency),
      scrapedAt: p.scrapedAt,
    })),
  }))
})

const athAtl = computed(() => getAthAtlFromSeries(convertedSeries.value))

const athAtlPlugin = computed<Plugin<'line'>>(() => {
  const ath = athAtl.value.ath
  const atl = athAtl.value.atl
  return {
    id: 'athAtlLines',
    afterDraw(chart) {
      if (ath == null && atl == null) return
      const { ctx, chartArea, scales } = chart
      const yScale = scales.y
      if (!yScale || !chartArea) return

      const drawLine = (value: number, color: string) => {
        const y = yScale.getPixelForValue(value)
        if (y < chartArea.top || y > chartArea.bottom) return
        ctx.save()
        ctx.beginPath()
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.moveTo(chartArea.left, y)
        ctx.lineTo(chartArea.right, y)
        ctx.stroke()
        ctx.restore()
      }

      if (ath != null) drawLine(ath, 'rgba(248,113,113,0.7)')
      if (atl != null) drawLine(atl, 'rgba(16,185,129,0.7)')
    },
  }
})

const chartData = computed<ChartData<'line'>>(() => {
  const labels = xLabels.value
  return {
    labels,
    datasets: series.value.map((s, idx) => {
      const color = PALETTE[idx % PALETTE.length]
      // Map each point to its index in the unified label list.
      const data = labels.map((label) => {
        const match = s.points.find((p) => formatChartDate(p.scrapedAt) === label)
        return match ? convertPoint(match.price, s.currency) : null
      })
      return {
        label: s.sourceName,
        data,
        borderColor: color,
        backgroundColor: hexWithAlpha(color, 0.18),
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        spanGaps: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color,
        pointHoverBorderWidth: 2,
      }
    }),
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      grid: { color: 'rgba(124,58,237,0.06)' },
      ticks: {
        color: '#7C6FA0',
        font: { family: 'JetBrains Mono', size: 10 },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      },
    },
    y: {
      grid: { color: 'rgba(124,58,237,0.06)' },
      ticks: {
        color: '#7C6FA0',
        font: { family: 'JetBrains Mono', size: 10 },
        callback: (val) => {
          const num = Number(val)
          if (Number.isNaN(num)) return ''
          return displayCurrency.value + ' ' + formatNumberShort(num)
        },
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,11,30,0.95)',
      titleColor: '#F0EEFF',
      bodyColor: '#C4B5FD',
      borderColor: 'rgba(139,92,246,0.4)',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Inter', weight: 'bold', size: 11 },
      bodyFont: { family: 'JetBrains Mono', size: 11 },
      callbacks: {
        label: (ctx) => {
          const value = typeof ctx.parsed.y === 'number' ? ctx.parsed.y : 0
          return ` ${ctx.dataset.label}: ${formatPrice(value, displayCurrency.value)}`
        },
      },
    },
  },
}))

// vue-chartjs Line accepts plugins via the `plugins` prop in v5.
const chartPlugins = computed(() => [athAtlPlugin.value])

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${hex}${a}`
}

function formatNumberShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toFixed(0)
}
</script>
