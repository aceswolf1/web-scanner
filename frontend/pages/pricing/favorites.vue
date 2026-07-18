<template>
  <div>
    <header class="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="font-brand text-3xl font-bold tracking-tight" style="color: var(--foreground)">
          Favorites
        </h1>
        <p class="text-sm font-mono mt-1" style="color: var(--muted-foreground)">
          Your pinned items for quick access.
        </p>
      </div>
      <NuxtLink
        to="/pricing"
        class="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-md border flex items-center gap-1.5"
        :style="{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }"
      >
        <i class="pi pi-arrow-left text-[10px]" />
        All items
      </NuxtLink>
    </header>

    <ItemList
      :items="favorites"
      :tags="tags"
      :loading="store.loading"
      :empty-title="'No favorites yet'"
      :empty-message="'Pin an item from the list to see it here.'"
      @create="openCreate"
      @create-tag="openCreateTag"
      @open="openItem"
      @toggle-favorite="onToggleFavorite"
    />

    <CreateItemModal
      v-model:visible="createVisible"
      :tags="tags"
      @submit="onCreateSubmit"
    />

    <CreateTagModal
      v-model:visible="createTagVisible"
      @created="onTagCreated"
    />
  </div>
</template>

<script setup lang="ts">

const router = useRouter()
const store = useItemsStore()
const tagStore = useTagsStore()
const itemsApi = useItems()
const tagsApi = useTags()
const toast = useToast()

const createVisible = ref(false)
const createTagVisible = ref(false)

const favorites = computed(() => store.items.filter((i) => i.isFavorite))
const tags = computed(() => tagStore.tags)

onMounted(async () => {
  try {
    await Promise.all([
      itemsApi.fetchItems({ favorite: true }),
      tagsApi.fetchTags(),
    ])
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to load',
      detail: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

function openItem(id: string): void {
  router.push(`/pricing/${id}`)
}

function openCreate(): void {
  createVisible.value = true
}

function openCreateTag(): void {
  createTagVisible.value = true
}

function onTagCreated(): void {
  // Tag is already upserted into the store by useTags().createTag.
}

async function onCreateSubmit(payload: {
  name: string
  imageUrl: string | null
  tagIds: string[]
  sources: Array<{
    url: string
    currency: string
    priceClass?: string | null
    cssRule?: string | null
    fatherClass?: string | null
    isMain: boolean
    isDiscounted?: boolean
    isUsed?: boolean
  }>
}): Promise<void> {
  try {
    const item = await itemsApi.createItem(payload)
    createVisible.value = false
    router.push(`/pricing/${item.id}`)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Create failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

async function onToggleFavorite(id: string): Promise<void> {
  try {
    await itemsApi.toggleFavorite(id)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Favorite failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
</script>