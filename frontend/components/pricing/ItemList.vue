<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-wrap items-center gap-3">
        <span class="p-input-icon-left flex-1 min-w-[220px] max-w-md relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2" style="color: var(--muted-foreground)" />
          <InputText
            v-model="search"
            placeholder="Search by name, URL, or tag…"
            class="w-full pl-9"
            @input="onSearchInput"
          />
        </span>

        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="tag in availableTags"
            :key="tag.id"
            type="button"
            class="text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors"
            :style="activeTagIds.has(tag.id)
              ? { background: tag.color, color: '#fff', borderColor: tag.color }
              : { background: 'transparent', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }"
            @click="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </button>
          <button
            v-if="activeTagIds.size"
            type="button"
            class="text-[10px] font-mono px-2 py-1 rounded-full"
            style="color: var(--muted-foreground)"
            @click="clearTags"
          >
            clear ×
          </button>
          <button
            v-if="!hideCreateTag"
            type="button"
            class="text-[11px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors hover:bg-muted/30"
            :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
            @click="$emit('createTag')"
          >
            <i class="pi pi-plus text-[10px]" />
            New tag
          </button>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            v-if="enableBulk"
            type="button"
            class="text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors"
            :style="selectionMode
              ? { background: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--primary)' }
              : { background: 'transparent', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }"
            :aria-pressed="selectionMode"
            @click="toggleSelectionMode"
          >
            <i class="pi pi-check-square text-[10px] mr-1" />
            {{ selectionMode ? 'Done' : 'Select' }}
          </button>
          <span class="text-xs font-mono" style="color: var(--muted-foreground)">
            {{ filteredCount }}/{{ safeItems.length }}
          </span>
          <button
            v-if="!hideCreate"
            type="button"
            class="flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-semibold text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:brightness-110 active:brightness-95 transition"
            style="background: linear-gradient(135deg, #8B5CF6, #7C3AED)"
            @click="$emit('create')"
          >
            <i class="pi pi-plus text-xs" />
            Add Product
          </button>
        </div>
      </div>

      <!-- Bulk action bar -->
      <div
        v-if="enableBulk && selectionMode && selectedIds.size > 0"
        class="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border"
        :style="{ background: 'var(--muted)', borderColor: 'var(--border)' }"
        role="toolbar"
        :aria-label="`${selectedIds.size} items selected`"
      >
        <span class="text-xs font-mono font-semibold mr-1" style="color: var(--foreground)">
          {{ selectedIds.size }} selected
        </span>
        <button
          type="button"
          class="text-[11px] font-mono px-2.5 py-1 rounded-md border hover:bg-card transition-colors"
          :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
          :disabled="bulkBusy"
          @click="emitBulk('scrape')"
        >
          <i class="pi pi-refresh text-[10px] mr-1" />
          Scrape
        </button>
        <button
          type="button"
          class="text-[11px] font-mono px-2.5 py-1 rounded-md border hover:bg-card transition-colors"
          :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
          :disabled="bulkBusy"
          @click="emitBulk('favorite')"
        >
          <i class="pi pi-star-fill text-[10px] mr-1" style="color: #FBBF24" />
          Favorite
        </button>
        <button
          type="button"
          class="text-[11px] font-mono px-2.5 py-1 rounded-md border hover:bg-card transition-colors"
          :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
          :disabled="bulkBusy"
          @click="emitBulk('unfavorite')"
        >
          <i class="pi pi-star text-[10px] mr-1" />
          Unfavorite
        </button>
        <button
          type="button"
          class="text-[11px] font-mono px-2.5 py-1 rounded-md border hover:bg-red-400/10 transition-colors"
          style="border-color: rgba(248,113,113,0.4); color: rgb(248 113 113)"
          :disabled="bulkBusy"
          @click="emitBulk('delete')"
        >
          <i class="pi pi-trash text-[10px] mr-1" />
          Delete
        </button>
        <button
          type="button"
          class="text-[10px] font-mono ml-auto px-2 py-1"
          style="color: var(--muted-foreground)"
          @click="clearSelection"
        >
          clear selection
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div
      v-if="!loading && filteredItems.length"
      class="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
    >
      <ItemCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        :tags="tags"
        :selectable="enableBulk && selectionMode"
        :selected="selectedIds.has(item.id)"
        :on-click="() => onCardClick(item.id)"
        :on-toggle-favorite="() => $emit('toggleFavorite', item.id)"
        :on-toggle-select="() => toggleSelect(item.id)"
      />
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="h-64 rounded-2xl border animate-pulse"
        :style="{ background: 'var(--muted)', borderColor: 'var(--border)' }"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        :style="{ background: 'var(--muted)' }"
      >
        <i class="pi pi-box text-2xl" style="color: var(--muted-foreground)" />
      </div>
      <p class="font-brand text-lg font-bold" style="color: var(--foreground)">
        {{ emptyTitle }}
      </p>
      <p class="text-sm font-mono mt-1" style="color: var(--muted-foreground)">
        {{ emptyMessage }}
      </p>
      <button
        v-if="!hideCreate"
        type="button"
        class="mt-5 flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-semibold text-white"
        style="background: linear-gradient(135deg, #8B5CF6, #7C3AED)"
        @click="$emit('create')"
      >
        <i class="pi pi-plus text-xs" />
        {{ safeItems.length === 0 ? 'Add your first product' : 'Add Product' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import type { Item, Tag } from '~/types/api.types'

export type BulkAction = 'scrape' | 'favorite' | 'unfavorite' | 'delete'

const props = withDefaults(
  defineProps<{
    items: Item[]
    tags: Tag[]
    loading?: boolean
    initialSearch?: string
    initialTagIds?: string[]
    hideCreate?: boolean
    hideCreateTag?: boolean
    emptyTitle?: string
    emptyMessage?: string
    enableBulk?: boolean
    bulkBusy?: boolean
  }>(),
  {
    loading: false,
    initialSearch: '',
    initialTagIds: () => [],
    hideCreate: false,
    hideCreateTag: false,
    emptyTitle: 'No products yet',
    emptyMessage: 'Track your first product to start seeing price history.',
    enableBulk: false,
    bulkBusy: false,
  },
)

const emit = defineEmits<{
  open: [id: string]
  toggleFavorite: [id: string]
  create: []
  createTag: []
  search: [value: string]
  bulkAction: [action: BulkAction, ids: string[]]
}>()

const search = ref(props.initialSearch)
const activeTagIds = ref<Set<string>>(new Set(props.initialTagIds))
const selectionMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())

// Guard against undefined props during SSR/hydration.
const safeItems = computed(() => (Array.isArray(props.items) ? props.items : []))
// Show all known tags (not only those currently used by items) so newly created
// tags appear immediately and can be managed from /pricing.
const availableTags = computed(() => (Array.isArray(props.tags) ? props.tags : []))

const filteredItems = computed(() => {
  return safeItems.value.filter((item) => {
    if (activeTagIds.value.size) {
      const itemTagIds = new Set(item.tags.map((ref) => ref.tag.id))
      for (const id of activeTagIds.value) if (!itemTagIds.has(id)) return false
    }
    return true
  })
})

const filteredCount = computed(() => filteredItems.value.length)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput(): void {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('search', search.value.trim())
  }, 250)
}

function toggleTag(id: string): void {
  const next = new Set(activeTagIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  activeTagIds.value = next
}

function clearTags(): void {
  activeTagIds.value = new Set()
}

function toggleSelectionMode(): void {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedIds.value = new Set()
  }
}

function toggleSelect(id: string): void {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function clearSelection(): void {
  selectedIds.value = new Set()
}

function onCardClick(id: string): void {
  if (props.enableBulk && selectionMode.value) {
    toggleSelect(id)
    return
  }
  emit('open', id)
}

function emitBulk(action: BulkAction): void {
  const ids = Array.from(selectedIds.value)
  if (ids.length === 0) return
  emit('bulkAction', action, ids)
}

/** Parent can clear selection after successful bulk delete. */
function clearSelectionExternal(): void {
  selectedIds.value = new Set()
}

defineExpose({ clearSelection: clearSelectionExternal, selectedIds })
</script>
