import type { Currency, Item, Source } from '~/types/api.types'
import { convertPrice } from '~/utils/currency'

export interface RankedSource extends Source {
  /** Converted price in displayCurrency; null when currentPrice is null. */
  convertedPrice: number | null
  /** 0-based rank among sources with a price; null when no price. */
  dealRank: number | null
  isBestDeal: boolean
}

export interface RankSourcesOptions {
  rates: Record<string, number> | null
  ratesBase: string
  displayCurrency: Currency
}

/**
 * Convert a source price into the display currency.
 * Returns null when the source has no price.
 * Falls back to the raw price when rates are unavailable.
 */
export function getConvertedPrice(
  source: Pick<Source, 'currentPrice' | 'currency'>,
  options: RankSourcesOptions,
): number | null {
  if (source.currentPrice == null) return null
  if (source.currency === options.displayCurrency) return source.currentPrice
  if (!options.rates) return source.currentPrice
  return convertPrice(
    source.currentPrice,
    source.currency,
    options.displayCurrency,
    options.rates,
    options.ratesBase,
  )
}

/**
 * Rank sources by converted price ascending (cheapest first).
 * Sources without a price sort last. Ties break: isMain first, then id.
 * Exactly one source is marked Best Deal when at least one has a price.
 */
export function rankSourcesByDeal(
  sources: readonly Source[] | null | undefined,
  options: RankSourcesOptions,
): RankedSource[] {
  const list = Array.isArray(sources) ? sources : []
  if (list.length === 0) return []

  const withConverted = list.map((source) => ({
    source,
    convertedPrice: getConvertedPrice(source, options),
  }))

  const sorted = [...withConverted].sort((a, b) => {
    if (a.convertedPrice == null && b.convertedPrice == null) {
      if (a.source.isMain !== b.source.isMain) return a.source.isMain ? -1 : 1
      return a.source.id.localeCompare(b.source.id)
    }
    if (a.convertedPrice == null) return 1
    if (b.convertedPrice == null) return -1
    if (a.convertedPrice !== b.convertedPrice) {
      return a.convertedPrice - b.convertedPrice
    }
    if (a.source.isMain !== b.source.isMain) return a.source.isMain ? -1 : 1
    return a.source.id.localeCompare(b.source.id)
  })

  let pricedRank = 0
  return sorted.map((entry) => {
    const hasPrice = entry.convertedPrice != null
    const dealRank = hasPrice ? pricedRank++ : null
    return {
      ...entry.source,
      convertedPrice: entry.convertedPrice,
      dealRank,
      isBestDeal: dealRank === 0,
    }
  })
}

/**
 * Best-deal source for an item, falling back to main, then first source.
 * Used by portfolio totals and list cards.
 */
export function pickBestDealSource(
  item: Pick<Item, 'sources'> | null | undefined,
  options: RankSourcesOptions,
): Source | null {
  const sources = item?.sources
  if (!Array.isArray(sources) || sources.length === 0) return null
  const ranked = rankSourcesByDeal(sources, options)
  const best = ranked.find((s) => s.isBestDeal)
  if (best) return best
  return ranked.find((s) => s.isMain) ?? ranked[0] ?? null
}

/**
 * Portfolio total: sum of each item's best-deal (fallback main) converted price.
 * Items without any priced source contribute 0.
 */
export function portfolioTotal(
  items: readonly Item[] | null | undefined,
  options: RankSourcesOptions,
): number {
  const list = Array.isArray(items) ? items : []
  return list.reduce((sum, item) => {
    const source = pickBestDealSource(item, options)
    if (!source || source.currentPrice == null) return sum
    const converted = getConvertedPrice(source, options)
    return sum + (converted ?? 0)
  }, 0)
}
