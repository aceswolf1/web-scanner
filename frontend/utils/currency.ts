import type { Currency } from '~/types/api.types'

const ZERO_DECIMAL = new Set<Currency>(['JPY', 'COP'])

const SYMBOL: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  MXN: 'Mex$',
  COP: 'Col$',
}

/**
 * Format a price with the appropriate currency symbol.
 * JPY and COP are integer currencies — no decimals.
 * All others get 2 decimals.
 */
export function formatPrice(value: number, currency: Currency): string {
  const useDecimals = !ZERO_DECIMAL.has(currency)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  })
  return `${SYMBOL[currency]}${formatter.format(value)}`
}

/**
 * Convert a price from one currency to another using a frankfurter.dev-style
 * rates object (keys are target currency codes, values are rates relative to
 * the base). We always go through the base by dividing source by its rate
 * then multiplying by the target rate.
 *
 * Falls back to the original value if either currency is missing.
 */
export function convertPrice(
  value: number,
  from: Currency,
  to: Currency,
  rates: Record<string, number>,
  base = 'EUR',
): number {
  if (from === to) return value
  // Frankfurter rates are base-relative. If a currency is the base, its rate is 1.
  const fromRate = from === base ? 1 : rates[from]
  const toRate = to === base ? 1 : rates[to]
  if (fromRate === undefined || toRate === undefined) return value
  const inBase = value / fromRate
  return inBase * toRate
}