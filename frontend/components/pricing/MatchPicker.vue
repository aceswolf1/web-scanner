<template>
  <fieldset
    v-if="matches.length > 1"
    class="rounded-lg border px-3 py-2 space-y-2"
    :style="{ borderColor: 'var(--border)', background: 'var(--background)' }"
  >
    <legend class="text-xs font-medium px-1" style="color: var(--foreground)">
      Multiple matches ({{ matches.length }}) — pick one
    </legend>
    <p class="text-[10px] font-mono" style="color: var(--muted-foreground)">
      The selected index is saved on the source and used on future scrapes.
    </p>
    <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1" role="radiogroup" aria-label="Scrape match options">
      <label
        v-for="match in matches"
        :key="match.index"
        class="flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors"
        :class="modelValue === match.index ? 'ring-1 ring-primary/40' : 'hover:bg-muted/20'"
        :style="
          modelValue === match.index
            ? { background: 'rgba(139,92,246,0.08)' }
            : undefined
        "
      >
        <RadioButton
          :input-id="`${idPrefix}-match-${match.index}`"
          :name="`${idPrefix}-match`"
          :value="match.index"
          :model-value="modelValue"
          @update:model-value="onPick"
        />
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-2 text-xs" style="color: var(--foreground)">
            <span class="font-mono text-[10px] opacity-70">#{{ match.index }}</span>
            <span class="font-semibold">
              {{ match.price !== null ? match.price : '—' }}
            </span>
          </span>
          <span
            class="block text-[11px] font-mono truncate mt-0.5"
            style="color: var(--muted-foreground)"
            :title="match.text"
          >
            {{ match.text || '(empty text)' }}
          </span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import RadioButton from 'primevue/radiobutton'
import type { ScrapeMatch } from '~/types/api.types'

const props = withDefaults(
  defineProps<{
    matches: ScrapeMatch[]
    modelValue: number
    idPrefix?: string
  }>(),
  {
    idPrefix: 'scan',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function onPick(value: number | string | boolean | undefined): void {
  if (typeof value === 'number') {
    emit('update:modelValue', value)
    return
  }
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    emit('update:modelValue', Number(value))
  }
}

// Ensure a valid selection when matches change.
watch(
  () => props.matches,
  (next) => {
    if (next.length === 0) return
    const hasCurrent = next.some((m) => m.index === props.modelValue)
    if (!hasCurrent) {
      emit('update:modelValue', next[0]!.index)
    }
  },
  { immediate: true },
)
</script>
