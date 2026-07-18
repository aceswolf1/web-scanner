import { RatesResponseSchema, type RatesResponse } from '~/types/api.types'

/**
 * Fetches and caches frankfurter.dev rates via our backend proxy endpoint
 * `/currencies/rates`. Result is cached in module state for 1 hour so every
 * item detail page that needs currency conversion reuses the same fetch.
 */
let cache: { data: RatesResponse; fetchedAt: number } | null = null
const TTL = 60 * 60 * 1000 // 1 hour

export function useCurrencies() {
  const config = useRuntimeConfig()

  async function getRates(force = false): Promise<RatesResponse> {
    const now = Date.now()
    if (!force && cache && now - cache.fetchedAt < TTL) {
      return cache.data
    }
    const raw = await $fetch<unknown>(`${useApiUrl()}/currencies/rates`)
    const data = RatesResponseSchema.parse(raw)
    cache = { data, fetchedAt: now }
    return data
  }

  function resetCache(): void {
    cache = null
  }

  return { getRates, resetCache }
}