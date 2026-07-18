<template>
  <div
    v-if="message"
    class="rounded-lg px-3 py-2 text-xs flex items-start gap-2"
    style="background: rgba(245,158,11,0.12); color: #D97706"
    role="status"
    aria-live="polite"
  >
    <i class="pi pi-exclamation-triangle mt-0.5 shrink-0" aria-hidden="true" />
    <div class="flex-1 min-w-0">
      <p class="font-medium">Currency warning</p>
      <p class="mt-0.5 opacity-90">{{ message }}</p>
      <p v-if="detectedCurrency" class="mt-1 font-mono text-[10px] opacity-80">
        Detected: {{ detectedCurrency }}
        <span v-if="selectedCurrency"> · Selected: {{ selectedCurrency }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currencyWarning?: string | null
  detectedCurrency?: string | null
  selectedCurrency?: string | null
}>()

const message = computed(() => {
  if (props.currencyWarning && props.currencyWarning.trim()) {
    return props.currencyWarning.trim()
  }
  const detected = props.detectedCurrency?.trim()
  const selected = props.selectedCurrency?.trim()
  if (detected && selected && detected.toUpperCase() !== selected.toUpperCase()) {
    return `Page text suggests ${detected}, but this source is set to ${selected}. Double-check before saving.`
  }
  return null
})
</script>
