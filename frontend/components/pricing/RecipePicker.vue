<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <label class="text-xs font-medium" style="color: var(--foreground)">
        Selector recipes
      </label>
      <div class="flex items-center gap-1.5">
        <Button
          v-if="showCreate"
          label="Save as recipe"
          icon="pi pi-bookmark"
          size="small"
          severity="secondary"
          text
          :disabled="!canCreate"
          @click="emit('create')"
        />
        <Button
          icon="pi pi-refresh"
          size="small"
          severity="secondary"
          text
          rounded
          :loading="loading"
          aria-label="Refresh recipes"
          @click="reload"
        />
      </div>
    </div>

    <div v-if="error" class="text-[11px]" style="color: rgb(248 113 113)">
      {{ error }}
    </div>

    <div v-else-if="loading && recipes.length === 0" class="text-[11px] font-mono" style="color: var(--muted-foreground)">
      Loading recipes…
    </div>

    <div v-else-if="recipes.length === 0" class="text-[11px] font-mono" style="color: var(--muted-foreground)">
      No recipes yet. Scan a page, then save selectors as a recipe.
    </div>

    <div v-else class="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
      <div
        v-for="recipe in recipes"
        :key="recipe.id"
        class="flex items-center gap-2 rounded-lg border px-2.5 py-2"
        :style="{ borderColor: 'var(--border)', background: 'var(--background)' }"
      >
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium truncate" style="color: var(--foreground)">
            {{ recipe.name }}
          </p>
          <p class="text-[10px] font-mono truncate" style="color: var(--muted-foreground)">
            <span v-if="recipe.domain">{{ recipe.domain }} · </span>
            <span>{{ summarizeSelectors(recipe) }}</span>
          </p>
        </div>
        <Button
          label="Apply"
          size="small"
          severity="secondary"
          @click="emit('apply', recipe)"
        />
        <Button
          v-if="allowDelete"
          icon="pi pi-trash"
          size="small"
          severity="danger"
          text
          rounded
          aria-label="Delete recipe"
          :loading="deletingId === recipe.id"
          @click="onDelete(recipe.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import type { SelectorRecipe } from '~/types/api.types'
import { extractHostname } from '~/composables/useRecipes'

const props = withDefaults(
  defineProps<{
    url?: string
    showCreate?: boolean
    canCreate?: boolean
    allowDelete?: boolean
    autoLoad?: boolean
  }>(),
  {
    url: '',
    showCreate: true,
    canCreate: false,
    allowDelete: true,
    autoLoad: true,
  },
)

const emit = defineEmits<{
  apply: [recipe: SelectorRecipe]
  create: []
}>()

const { recipes, loading, error, fetchRecipes, deleteRecipe } = useRecipes()
const toast = useToast()
const deletingId = ref<string | null>(null)

const domainFilter = computed(() => extractHostname(props.url ?? ''))

async function reload(): Promise<void> {
  try {
    // Loads all recipes; same-domain entries are sorted first when URL is known.
    await fetchRecipes(domainFilter.value)
  } catch {
    // error state is set inside useRecipes
  }
}

async function onDelete(id: string): Promise<void> {
  deletingId.value = id
  try {
    await deleteRecipe(id)
    toast.add({ severity: 'success', summary: 'Recipe deleted', life: 2000 })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to delete recipe',
      detail: err instanceof Error ? err.message : '',
      life: 3500,
    })
  } finally {
    deletingId.value = null
  }
}

function summarizeSelectors(recipe: SelectorRecipe): string {
  const parts = [recipe.cssRule, recipe.priceClass, recipe.fatherClass].filter(
    (v): v is string => Boolean(v && v.trim()),
  )
  return parts.length > 0 ? parts.join(' · ') : 'No selectors'
}

watch(
  () => [props.autoLoad, domainFilter.value] as const,
  ([auto]) => {
    if (auto) void reload()
  },
  { immediate: true },
)

defineExpose({ reload, recipes })
</script>
