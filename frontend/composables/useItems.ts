import { z } from 'zod'
import {
  ItemEnvelopeSchema,
  ItemSchema,
  ListItemsResponseSchema,
  ScrapeResponseSchema,
  type Item,
  type Source,
} from '~/types/api.types'

interface FetchItemsParams {
  search?: string
  favorite?: boolean
}

/**
 * Centralized composable for item CRUD. Every method validates the API
 * response with Zod before storing it in the Pinia store, so a malformed
 * payload surfaces as a runtime error rather than silent type drift.
 */
export function useItems() {
  const store = useItemsStore()

  async function fetchItems(params?: FetchItemsParams): Promise<Item[]> {
    store.loading = true
    store.error = null
    try {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.favorite !== undefined) query.set('favorite', String(params.favorite))
      const url = `${useApiUrl()}/items${query.toString() ? '?' + query.toString() : ''}`
      const raw = await $fetch<unknown>(url)
      const parsed = ListItemsResponseSchema.safeParse(raw)
      if (!parsed.success) {
        const detail = parsed.error.issues
          .slice(0, 8)
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join(' · ')
        store.error = `Invalid API response — ${detail}`
        throw new Error(store.error)
      }
      store.setItems(parsed.data.items, parsed.data.total)
      return parsed.data.items
    } catch (err) {
      if (!store.error) {
        store.error = err instanceof Error ? err.message : 'Failed to fetch items'
      }
      throw err
    } finally {
      store.loading = false
    }
  }

  async function fetchItem(id: string): Promise<Item> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items/${id}`)
    const { item } = ItemEnvelopeSchema.parse(raw)
    store.setCurrentItem(item)
    return item
  }

  async function createItem(input: {
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
      matchIndex?: number
      notes?: string | null
    }>
  }): Promise<Item> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items`, {
      method: 'POST',
      body: input,
    })
    const { item } = ItemEnvelopeSchema.parse(raw)
    store.upsertItem(item)
    return item
  }

  async function updateItem(
    id: string,
    input: { name?: string; imageUrl?: string | null; isFavorite?: boolean; tagIds?: string[] },
  ): Promise<Item> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items/${id}`, {
      method: 'PATCH',
      body: input,
    })
    const { item } = ItemEnvelopeSchema.parse(raw)
    store.upsertItem(item)
    if (store.currentItem?.id === id) store.setCurrentItem(item)
    return item
  }

  async function deleteItem(id: string): Promise<void> {
    await $fetch(`${useApiUrl()}/items/${id}`, { method: 'DELETE' })
    store.removeItem(id)
    if (store.currentItem?.id === id) store.clearCurrent()
  }

  async function toggleFavorite(id: string): Promise<Item> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items/${id}/favorite`, {
      method: 'POST',
    })
    const { item } = ItemEnvelopeSchema.parse(raw)
    store.upsertItem(item)
    if (store.currentItem?.id === id) store.setCurrentItem(item)
    return item
  }

  async function triggerScrape(id: string): Promise<{ queued: boolean; sourceIds: string[] }> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items/${id}/scrape`, {
      method: 'POST',
    })
    return ScrapeResponseSchema.parse(raw)
  }

  async function fetchHistory(id: string) {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items/${id}/history`)
    const { HistoryResponseSchema } = await import('~/types/api.types')
    return HistoryResponseSchema.parse(raw)
  }

  async function refetchCurrent(id: string): Promise<Item> {
    // Used after adding/deleting sources so the detail page shows fresh data.
    return fetchItem(id)
  }

  // Helper for the detail page that needs to mutate sources locally too.
  function patchCurrentSource(updated: Source): void {
    if (!store.currentItem) return
    const idx = store.currentItem.sources.findIndex((s) => s.id === updated.id)
    if (idx < 0) return
    const next = [...store.currentItem.sources]
    next[idx] = updated
    store.setCurrentItem({ ...store.currentItem, sources: next })
  }

  function replaceCurrentSources(sources: Source[]): void {
    if (!store.currentItem) return
    store.setCurrentItem({ ...store.currentItem, sources })
  }

  return {
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    triggerScrape,
    fetchHistory,
    refetchCurrent,
    patchCurrentSource,
    replaceCurrentSources,
  }
}

// Re-export schemas for inline use elsewhere when needed.
export { ItemSchema }
export type { Item }