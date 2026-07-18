<template>
  <Dialog
    :visible="visible"
    @update:visible="(v) => emit('update:visible', v)"
    modal
    :draggable="false"
    header="Create tag"
    :style="{ width: '420px', maxWidth: '95vw' }"
    :pt="{ root: { class: 'rounded-2xl overflow-hidden' } }"
  >
    <div class="flex flex-col gap-4 py-1">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color: var(--foreground)">
          Name <span style="color: rgb(248 113 113)">*</span>
        </label>
        <InputText
          v-model="name"
          placeholder="e.g. Tech, Medicine, Used"
          class="w-full"
          maxlength="50"
          @keyup.enter="save"
        />
        <p v-if="errors.name" class="text-[11px]" style="color: rgb(248 113 113)">
          {{ errors.name }}
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-medium" style="color: var(--foreground)">Color</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="swatch in COLOR_PRESETS"
            :key="swatch"
            type="button"
            class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
            :style="{
              background: swatch,
              borderColor: color.toUpperCase() === swatch.toUpperCase() ? 'var(--foreground)' : 'transparent',
              boxShadow: color.toUpperCase() === swatch.toUpperCase() ? `0 0 0 2px ${swatch}55` : 'none',
            }"
            :aria-label="`Pick color ${swatch}`"
            @click="color = swatch"
          />
        </div>
        <div class="flex items-center gap-2 mt-1">
          <InputText
            v-model="color"
            placeholder="#8B5CF6"
            class="w-28 font-mono text-sm"
            maxlength="7"
          />
          <span
            class="w-8 h-8 rounded-lg border shrink-0"
            :style="{ background: isValidHex(color) ? color : '#8B5CF6', borderColor: 'var(--border)' }"
          />
          <p v-if="errors.color" class="text-[11px]" style="color: rgb(248 113 113)">
            {{ errors.color }}
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-medium" style="color: var(--foreground)">Preview</label>
        <div
          class="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-mono border"
          :style="{
            background: hexWithAlpha(previewColor, '22'),
            color: previewColor,
            borderColor: hexWithAlpha(previewColor, '44'),
          }"
        >
          <i class="pi pi-tag text-[10px]" />
          {{ name.trim() || 'Tag name' }}
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" @click="emit('update:visible', false)" />
      <Button
        label="Create tag"
        icon="pi pi-plus"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="save"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { Tag } from '~/types/api.types'

const COLOR_PRESETS = [
  '#8B5CF6',
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#64748B',
] as const

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  created: [tag: Tag]
}>()

const tagsApi = useTags()
const toast = useToast()

const name = ref('')
const color = ref('#8B5CF6')
const submitting = ref(false)
const errors = reactive<{ name: string; color: string }>({ name: '', color: '' })

function isValidHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim())
}

function hexWithAlpha(hex: string, alpha: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return `#8B5CF622`
  return `#${clean}${alpha}`
}

const previewColor = computed(() => (isValidHex(color.value) ? color.value.trim() : '#8B5CF6'))
const canSubmit = computed(() => name.value.trim().length > 0 && !submitting.value)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      name.value = ''
      color.value = '#8B5CF6'
      errors.name = ''
      errors.color = ''
      submitting.value = false
    }
  },
)

async function save(): Promise<void> {
  const trimmedName = name.value.trim()
  const trimmedColor = color.value.trim() || '#8B5CF6'

  errors.name = trimmedName ? '' : 'Name is required'
  errors.color = isValidHex(trimmedColor) ? '' : 'Use a hex color like #8B5CF6'
  if (errors.name || errors.color) return

  submitting.value = true
  try {
    const tag = await tagsApi.createTag(trimmedName, trimmedColor)
    toast.add({ severity: 'success', summary: 'Tag created', detail: tag.name, life: 2500 })
    emit('created', tag)
    emit('update:visible', false)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to create tag',
      detail: err instanceof Error ? err.message : '',
      life: 4000,
    })
  } finally {
    submitting.value = false
  }
}
</script>
