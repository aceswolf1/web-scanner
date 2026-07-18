import { defineStore } from 'pinia'
import type { Item } from '~/types/api.types'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Cached detail (loaded by ID for the detail page).
  const currentItem = ref<Item | null>(null)

  function setItems(next: Item[], nextTotal: number): void {
    items.value = next
    total.value = nextTotal
  }

  function upsertItem(item: Item): void {
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx >= 0) {
      items.value.splice(idx, 1, item)
    } else {
      items.value.unshift(item)
    }
  }

  function removeItem(id: string): void {
    items.value = items.value.filter((i) => i.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  function setCurrentItem(item: Item | null): void {
    currentItem.value = item
  }

  function clearCurrent(): void {
    currentItem.value = null
  }

  return {
    items,
    total,
    loading,
    error,
    currentItem,
    setItems,
    upsertItem,
    removeItem,
    setCurrentItem,
    clearCurrent,
  }
})