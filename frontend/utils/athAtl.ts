import type { PricePoint } from '~/types/api.types'

export interface AthAtl {
  ath: number | null
  atl: number | null
  athAt: string | null
  atlAt: string | null
  count: number
}

/**
 * Compute all-time high / low from price history points.
 * Empty or missing history → null ATH/ATL.
 * Ties keep the earliest scrapedAt for ATL and latest for ATH (stable).
 */
export function getAthAtl(
  points: readonly Pick<PricePoint, 'price' | 'scrapedAt'>[] | null | undefined,
): AthAtl {
  const list = Array.isArray(points) ? points : []
  if (list.length === 0) {
    return { ath: null, atl: null, athAt: null, atlAt: null, count: 0 }
  }

  let ath = list[0]!.price
  let atl = list[0]!.price
  let athAt = list[0]!.scrapedAt
  let atlAt = list[0]!.scrapedAt

  for (let i = 1; i < list.length; i++) {
    const p = list[i]!
    if (p.price > ath) {
      ath = p.price
      athAt = p.scrapedAt
    } else if (p.price === ath && p.scrapedAt > athAt) {
      athAt = p.scrapedAt
    }
    if (p.price < atl) {
      atl = p.price
      atlAt = p.scrapedAt
    } else if (p.price === atl && p.scrapedAt < atlAt) {
      atlAt = p.scrapedAt
    }
  }

  return { ath, atl, athAt, atlAt, count: list.length }
}

/**
 * Aggregate ATH/ATL across multiple series (e.g. chart history).
 * Prices must already be in a common unit if comparing across sources.
 */
export function getAthAtlFromSeries(
  series: ReadonlyArray<{ points: ReadonlyArray<{ price: number; scrapedAt: string }> }> | null | undefined,
): AthAtl {
  const list = Array.isArray(series) ? series : []
  const flat = list.flatMap((s) => s.points ?? [])
  return getAthAtl(flat)
}
