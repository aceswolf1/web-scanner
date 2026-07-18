<template>
  <Dialog
    :visible="visible"
    @update:visible="(v) => emit('update:visible', v)"
    modal
    :draggable="false"
    header="Save selector recipe"
    :style="{ width: '420px', maxWidth: '95vw' }"
    :pt="{ root: { class: 'rounded-2xl overflow-hidden' } }"
  >
    <div class="flex flex-col gap-3 py-1">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color: var(--foreground)">
          Name <span style="color: rgb(248 113 113)">*</span>
        </label>
        <InputText
          v-model="name"
          placeholder="e.g. Colombian Mac Store price"
          class="w-full"
          maxlength="80"
          @keyup.enter="save"
        />
        <p v-if="nameError" class="text-[11px]" style="color: rgb(248 113 113)">
          {{ nameError }}
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color: var(--foreground)">Domain</label>
        <InputText
          v-model="domain"
          placeholder="store.example.com"
          class="w-full font-mono text-sm"
        />
        <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
          Optional — used to filter recipes by shop hostname.
        </small>
      </div>

      <div
        class="rounded-lg border px-3 py-2 text-[11px] font-mono space-y-1"
        :style="{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }"
      >
        <p><span class="opacity-70">cssRule:</span> {{ cssRule || '—' }}</p>
        <p><span class="opacity-70">priceClass:</span> {{ priceClass || '—' }}</p>
        <p><span class="opacity-70">fatherClass:</span> {{ fatherClass || '—' }}</p>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" @click="emit('update:visible', false)" />
      <Button
        label="Save recipe"
        icon="pi pi-bookmark"
        :loading="submitting"
        @click="save"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { SelectorRecipe } from '~/types/api.types'
import { extractHostname } from '~/composables/useRecipes'

const props = defineProps<{
  visible: boolean
  url?: string
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
  suggestedName?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  created: [recipe: SelectorRecipe]
}>()

const { createRecipe } = useRecipes()
const toast = useToast()

const name = ref('')
const domain = ref('')
const nameError = ref('')
const submitting = ref(false)

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    name.value = props.suggestedName?.trim() || defaultNameFromUrl(props.url)
    domain.value = extractHostname(props.url ?? '') ?? ''
    nameError.value = ''
  },
)

function defaultNameFromUrl(url?: string): string {
  const host = extractHostname(url ?? '')
  return host ? `${host} selectors` : ''
}

async function save(): Promise<void> {
  const trimmed = name.value.trim()
  if (!trimmed) {
    nameError.value = 'Name is required'
    return
  }
  const hasSelector = Boolean(
    (props.cssRule && props.cssRule.trim()) ||
      (props.priceClass && props.priceClass.trim()) ||
      (props.fatherClass && props.fatherClass.trim()),
  )
  if (!hasSelector) {
    toast.add({
      severity: 'warn',
      summary: 'Add at least one selector before saving a recipe',
      life: 3000,
    })
    return
  }

  nameError.value = ''
  submitting.value = true
  try {
    const recipe = await createRecipe({
      name: trimmed,
      domain: domain.value.trim() || null,
      priceClass: props.priceClass?.trim() || null,
      cssRule: props.cssRule?.trim() || null,
      fatherClass: props.fatherClass?.trim() || null,
    })
    toast.add({ severity: 'success', summary: 'Recipe saved', life: 2500 })
    emit('created', recipe)
    emit('update:visible', false)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to save recipe',
      detail: err instanceof Error ? err.message : '',
      life: 4000,
    })
  } finally {
    submitting.value = false
  }
}
</script>
