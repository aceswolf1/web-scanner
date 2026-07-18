<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    :style="{
      background: tagBg,
      color: tag.color,
      border: `1px solid ${tagBorder}`,
    }"
  >
    <i class="pi pi-tag text-[10px]" />
    {{ tag.name }}
  </span>
</template>

<script setup lang="ts">
import type { Tag } from '~/types/api.types'

const props = defineProps<{ tag: Tag }>()

function hexWithAlpha(hex: string, alphaHex: string): string {
  // hex is "#RRGGBB"; alphaHex is "AA" (e.g. "22" = 13%).
  return `${hex}${alphaHex}`
}

const tagBg = computed(() => hexWithAlpha(props.tag.color, '22'))
const tagBorder = computed(() => hexWithAlpha(props.tag.color, '44'))
</script>