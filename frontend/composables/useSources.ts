import {
  SourceEnvelopeSchema,
  TestScrapeResultSchema,
  type Source,
  type Currency,
  type TestScrapeResult,
} from '~/types/api.types'

export type { TestScrapeResult }

export interface SourceWriteInput {
  url: string
  currency: Currency
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
  isMain: boolean
  isDiscounted?: boolean
  isUsed?: boolean
  matchIndex?: number
  notes?: string | null
}

export interface SourceUpdateInput {
  url?: string
  currency?: Currency
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
  isMain?: boolean
  isDiscounted?: boolean
  isUsed?: boolean
  matchIndex?: number
  notes?: string | null
}

/**
 * Source CRUD composable. After mutations we either patch the store's
 * `currentItem` or refetch the whole item for a consistent view.
 */
export function useSources() {
  const items = useItems()

  async function addSource(itemId: string, input: SourceWriteInput): Promise<Source> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/items/${itemId}/sources`, {
      method: 'POST',
      body: input,
    })
    const { source } = SourceEnvelopeSchema.parse(raw)
    await items.refetchCurrent(itemId)
    return source
  }

  async function updateSource(id: string, input: SourceUpdateInput): Promise<Source> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/sources/${id}`, {
      method: 'PATCH',
      body: input,
    })
    const { source } = SourceEnvelopeSchema.parse(raw)
    items.patchCurrentSource(source)
    return source
  }

  async function setMain(id: string): Promise<Source> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/sources/${id}/main`, {
      method: 'POST',
    })
    const { source } = SourceEnvelopeSchema.parse(raw)
    items.patchCurrentSource(source)
    return source
  }

  async function deleteSource(id: string): Promise<void> {
    await $fetch(`${useApiUrl()}/sources/${id}`, { method: 'DELETE' })
    const store = useItemsStore()
    if (store.currentItem) {
      items.refetchCurrent(store.currentItem.id)
    }
  }

  /**
   * Scrape a single source inline via `POST /sources/:id/scrape`.
   * The API fetches and parses the price synchronously and persists the result.
   */
  async function scrapeOne(
    sourceId: string,
  ): Promise<{
    price: number | null
    warning: string | null
    error: string | null
    detectedCurrency?: string | null
    currencyWarning?: string | null
  }> {
    return await $fetch(`${useApiUrl()}/sources/${sourceId}/scrape`, {
      method: 'POST',
    })
  }

  /**
   * Stateless preview scrape via `POST /sources/test`. Lets users validate a
   * URL + selectors before saving a source. Returns the matched price (if any),
   * multi-match candidates, currency detection, and any warnings/errors.
   */
  async function testScrape(params: {
    url: string
    priceClass?: string | null
    cssRule?: string | null
    fatherClass?: string | null
    currency?: Currency | null
    matchIndex?: number
  }): Promise<TestScrapeResult> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/sources/test`, {
      method: 'POST',
      body: params,
    })
    return TestScrapeResultSchema.parse(raw)
  }

  return { addSource, updateSource, setMain, deleteSource, scrapeOne, testScrape }
}
