import axios from 'axios'
import { parseOpenErApi, type FrankfurterLatest } from '../schemas/currency.schema.js'

interface RatesCache {
  data: FrankfurterLatest
  fetchedAt: number
}

let ratesCache: RatesCache | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// open.er-api.com covers 170+ currencies including COP — frankfurter uses ECB data which excludes COP
const RATES_URL = 'https://open.er-api.com/v6/latest/EUR'

/**
 * Returns the latest EUR-based rates from open.er-api.com with a 1h in-memory cache.
 * If the upstream is unreachable, we serve stale data if available — better stale than nothing.
 */
export async function getRates(): Promise<FrankfurterLatest> {
  const now = Date.now()

  if (ratesCache && now - ratesCache.fetchedAt < CACHE_TTL) {
    return ratesCache.data
  }

  try {
    const res = await axios.get(RATES_URL, { timeout: 5_000 })
    const parsed = parseOpenErApi(res.data)
    ratesCache = { data: parsed, fetchedAt: now }
    return parsed
  } catch (err) {
    if (ratesCache) return ratesCache.data
    throw new Error(
      `Failed to fetch currency rates and no cache available: ${(err as Error).message}`
    )
  }
}

/**
 * Test helper. Not exported in production code paths.
 */
export function __resetCurrencyCacheForTests(): void {
  ratesCache = null
}
