import axios from 'axios'
import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Cap multi-match results so the UI stays usable. */
export const MAX_MATCHES = 10

export interface TestScrapeInput {
  url: string
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
  /** Expected currency — used only to produce currencyWarning when it conflicts. */
  currency?: string | null
  /** Which match to use as the primary price (default 0). Falls back to first. */
  matchIndex?: number | null
}

export interface ScrapeMatch {
  index: number
  text: string
  price: number | null
}

export interface TestScrapeResult {
  price: number | null
  count: number
  warning: string | null
  error: string | null
  matches?: ScrapeMatch[]
  detectedCurrency?: string | null
  currencyWarning?: string | null
  /**
   * When true, marketplace adapter could not get a price via API and the HTML
   * scrape pipeline should try next (e.g. restricted ML user-product pages).
   * Stripped before leaving the service if a later path succeeds.
   */
  htmlFallback?: boolean
}

/**
 * Extract a price from arbitrary text, correctly handling both dot-decimal and
 * comma-decimal locales including Colombian/European thousands separators.
 *
 * Rules:
 *   - Both separators present → whichever comes last is the decimal separator
 *       "1.234,56" → 1234.56   "1,234.56" → 1234.56
 *   - Only one separator, followed by exactly 3 digits → thousands separator
 *       "2.090" → 2090   "2,090" → 2090
 *   - Only one separator, followed by 1-2 digits → decimal separator
 *       "2.09" → 2.09   "2,9" → 2.9
 *   - Multiple occurrences of the same separator → all are thousands separators
 *       "1.234.567" → 1234567
 */
export function extractPrice(text: string): number | null {
  const cleaned = text.replace(/[^\d.,]/g, '').trim()
  if (!cleaned) return null

  const hasDot = cleaned.includes('.')
  const hasComma = cleaned.includes(',')

  if (hasDot && hasComma) {
    // Whichever separator appears last is the decimal point
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastComma > lastDot) {
      // European: "1.234,56" — dot=thousands, comma=decimal
      const normalized = cleaned.replace(/\./g, '').replace(',', '.')
      const val = parseFloat(normalized)
      return isNaN(val) ? null : val
    } else {
      // US: "1,234.56" — comma=thousands, dot=decimal
      const normalized = cleaned.replace(/,/g, '')
      const val = parseFloat(normalized)
      return isNaN(val) ? null : val
    }
  }

  if (hasComma && !hasDot) {
    const parts = cleaned.split(',')
    const lastPart = parts[parts.length - 1] ?? ''
    if (parts.length > 2 || lastPart.length === 3) {
      // "1,234,567" or "2,090" — comma is thousands separator
      const val = parseFloat(cleaned.replace(/,/g, ''))
      return isNaN(val) ? null : val
    } else {
      // "2,09" or "2,9" — comma is decimal separator
      const val = parseFloat(cleaned.replace(',', '.'))
      return isNaN(val) ? null : val
    }
  }

  if (hasDot && !hasComma) {
    const parts = cleaned.split('.')
    const lastPart = parts[parts.length - 1] ?? ''
    if (parts.length > 2 || lastPart.length === 3) {
      // "1.234.567" or "2.090" — dot is thousands separator
      const val = parseFloat(cleaned.replace(/\./g, ''))
      return isNaN(val) ? null : val
    } else {
      // "2.09" or "2.9" — dot is decimal separator
      const val = parseFloat(cleaned)
      return isNaN(val) ? null : val
    }
  }

  // No separators — plain integer
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : val
}

/**
 * Scan raw price text for currency hints. More specific tokens win over bare `$`.
 * Returns an ISO-like currency code when confidently detected, else null.
 */
export function detectCurrency(text: string): string | null {
  if (!text) return null

  // Order matters: specific codes/symbols before ambiguous bare `$`.
  const patterns: Array<{ re: RegExp; code: string }> = [
    { re: /\bUSD\b|US\$|\$\s*USD/i, code: 'USD' },
    { re: /\bCOP\b|Col\$|COL\$/i, code: 'COP' },
    { re: /\bEUR\b|€/i, code: 'EUR' },
    { re: /\bGBP\b|£/i, code: 'GBP' },
    { re: /\bJPY\b|¥|￥/i, code: 'JPY' },
    { re: /\bCAD\b|C\$/i, code: 'CAD' },
    { re: /\bMXN\b|MX\$/i, code: 'MXN' },
    // Bare dollar is a weak USD hint (common on US sites).
    { re: /\$/, code: 'USD' },
  ]

  for (const { re, code } of patterns) {
    if (re.test(text)) return code
  }
  return null
}

/**
 * Build a warning when the detected currency conflicts with the expected one.
 */
export function buildCurrencyWarning(
  detected: string | null,
  expected: string | null | undefined
): string | null {
  if (!detected || !expected) return null
  if (detected.toUpperCase() === expected.toUpperCase()) return null
  return `Detected currency ${detected} differs from expected ${expected}`
}

/**
 * Pick the match at matchIndex, falling back to the first match when out of range.
 */
export function selectMatchIndex(count: number, matchIndex?: number | null): number {
  if (count <= 0) return 0
  if (matchIndex === undefined || matchIndex === null) return 0
  if (matchIndex < 0 || matchIndex >= count) return 0
  return matchIndex
}

/**
 * Attach currency fields to a scrape result (immutable).
 */
export function withCurrencyFields(
  result: TestScrapeResult,
  sampleText: string,
  expectedCurrency?: string | null
): TestScrapeResult {
  const detectedCurrency = detectCurrency(sampleText)
  const currencyWarning = buildCurrencyWarning(detectedCurrency, expectedCurrency)
  return {
    ...result,
    detectedCurrency,
    currencyWarning,
  }
}

/**
 * Stateless "scrape and show me what you'd extract" — used by the AddSourceModal
 * to validate URL+selector combos before persisting anything.
 *
 * Selector precedence (first match wins):
 *   1. cssRule      — raw CSS selector
 *   2. fatherClass+priceClass — scoped descendants of `.fatherClass`
 *   3. priceClass   — any `.priceClass` on the page
 */
export async function testScrape(input: TestScrapeInput): Promise<TestScrapeResult> {
  // Marketplace adapters (avoid bot walls when credentials are present).
  // Dynamic import keeps the HTML path independent if an adapter module fails to load.
  try {
    const { isEbayUrl, scrapeEbayListing } = await import('./ebay.adapter.js')
    if (isEbayUrl(input.url)) {
      return scrapeEbayListing(input)
    }
  } catch {
    // Fall through
  }

  try {
    const { isMercadoLibreUrl, scrapeMercadoLibreListing } = await import(
      './mercadolibre.adapter.js'
    )
    if (isMercadoLibreUrl(input.url)) {
      const mlResult = await scrapeMercadoLibreListing(input)
      // API succeeded or hard failure without HTML hope — return as-is.
      if (mlResult.price !== null || !mlResult.htmlFallback) {
        const { htmlFallback: _drop, ...rest } = mlResult
        return rest
      }
      // Restricted /up/ pages and some items: continue to cheerio/puppeteer.
    }
  } catch {
    // Fall through to HTML scrape
  }

  // Normalize class names: strip leading dot if user added one.
  const priceClass = input.priceClass?.replace(/^\./, '') || null
  const fatherClass = input.fatherClass?.replace(/^\./, '') || null
  const cssRule = input.cssRule || null

  try {
    const response = await axios.get(input.url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15_000,
      maxRedirects: 5,
      responseType: 'text',
      // Don't reject on non-2xx — many product pages return 403/404 selectively;
      // surface that as a structured error rather than an exception.
      validateStatus: () => true,
    })

    if (response.status >= 400) {
      return {
        price: null,
        count: 0,
        warning: null,
        error: `HTTP ${response.status} from URL`,
        matches: [],
        detectedCurrency: null,
        currencyWarning: null,
      }
    }

    const html = typeof response.data === 'string' ? response.data : String(response.data ?? '')
    const $ = cheerio.load(html)
    type MatchSet = ReturnType<typeof $> // Cheerio<AnyNode>

    let elements: MatchSet | undefined

    if (cssRule) {
      elements = $(cssRule)
    } else if (fatherClass && priceClass) {
      const fathers = $(`.${fatherClass}`)
      const matches: unknown[] = []
      fathers.each((_idx, el) => {
        const scoped = $(el).find(`.${priceClass}`)
        scoped.each((_i, child) => {
          matches.push(child)
        })
      })
      // Cheerio 1.x accepts an array of nodes; cast through unknown to bridge
      // the missing `AnyNode` re-export from the public types.
      elements = $(matches as Parameters<typeof $>[0])
    } else if (priceClass) {
      elements = $(`.${priceClass}`)
    } else {
      return {
        price: null,
        count: 0,
        warning: null,
        error: 'No selector configured (priceClass, cssRule, or fatherClass required)',
        matches: [],
        detectedCurrency: null,
        currencyWarning: null,
      }
    }

    // TypeScript narrowing: at this point elements is always defined because every
    // branch above assigns it OR returns early.
    const matched: MatchSet = elements!
    const count = matched.length

    const matches: ScrapeMatch[] = []
    const limit = Math.min(count, MAX_MATCHES)
    for (let i = 0; i < limit; i++) {
      const text = $(matched.get(i)).text().trim()
      matches.push({
        index: i,
        text: text.slice(0, 200),
        price: extractPrice(text),
      })
    }

    const selectedIdx = selectMatchIndex(count, input.matchIndex)
    const selectedText =
      count > 0
        ? $(matched.get(Math.min(selectedIdx, count - 1))).text().trim()
        : ''
    const price = count > 0 ? extractPrice(selectedText) : null

    // Fall back to Puppeteer when:
    //   1. 0 elements matched  → selector only exists after JS renders
    //   2. elements matched but text is empty / non-numeric → placeholder filled by JS
    if (count === 0 || price === null) {
      const { puppeteerScrape } = await import('./puppeteer-scrape.service.js')
      return puppeteerScrape(input)
    }

    const warning =
      count > 1
        ? `Multiple matches (${count}) — using index ${selectedIdx}. Consider a more specific selector.`
        : null

    return withCurrencyFields(
      { price, count, warning, error: null, matches },
      selectedText,
      input.currency
    )
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        return {
          price: null,
          count: 0,
          warning: null,
          error: 'Request timed out',
          matches: [],
          detectedCurrency: null,
          currencyWarning: null,
        }
      }
      if (err.response) {
        return {
          price: null,
          count: 0,
          warning: null,
          error: `HTTP ${err.response.status} from URL`,
          matches: [],
          detectedCurrency: null,
          currencyWarning: null,
        }
      }
      return {
        price: null,
        count: 0,
        warning: null,
        error: `Network error: ${err.message}`,
        matches: [],
        detectedCurrency: null,
        currencyWarning: null,
      }
    }
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Unexpected error: ${String(err)}`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }
}
