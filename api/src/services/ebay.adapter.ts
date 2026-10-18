import axios from 'axios'
import type { TestScrapeInput, TestScrapeResult } from './test-scrape.service.js'

/** Local copy — avoids circular import with test-scrape.service. */
function currencyWarning(
  detected: string | null | undefined,
  expected: string | null | undefined,
): string | null {
  if (!detected || !expected) return null
  if (detected.toUpperCase() === expected.toUpperCase()) return null
  return `Detected currency ${detected} does not match source currency ${expected}`
}

/**
 * eBay Browse API adapter.
 *
 * Auth env vars (developer.ebay.com portal labels):
 *   EBAY_APP_ID   — App ID  (OAuth Client ID)
 *   EBAY_CERTID   — Cert ID (OAuth Client Secret)
 *   EBAY_DEVID    — Dev ID  (optional for Browse API)
 *
 * Optional:
 *   EBAY_ENV=production|sandbox  (default production)
 */

const TOKEN_URL_PRODUCTION = 'https://api.ebay.com/identity/v1/oauth2/token'
const TOKEN_URL_SANDBOX = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
const BROWSE_BASE_PRODUCTION = 'https://api.ebay.com/buy/browse/v1'
const BROWSE_BASE_SANDBOX = 'https://api.sandbox.ebay.com/buy/browse/v1'

/** Host suffix → Browse API marketplace id */
const MARKETPLACE_BY_HOST: Record<string, string> = {
  'ebay.com': 'EBAY_US',
  'www.ebay.com': 'EBAY_US',
  'ebay.co.uk': 'EBAY_GB',
  'www.ebay.co.uk': 'EBAY_GB',
  'ebay.de': 'EBAY_DE',
  'www.ebay.de': 'EBAY_DE',
  'ebay.fr': 'EBAY_FR',
  'www.ebay.fr': 'EBAY_FR',
  'ebay.it': 'EBAY_IT',
  'www.ebay.it': 'EBAY_IT',
  'ebay.es': 'EBAY_ES',
  'www.ebay.es': 'EBAY_ES',
  'ebay.ca': 'EBAY_CA',
  'www.ebay.ca': 'EBAY_CA',
  'ebay.com.au': 'EBAY_AU',
  'www.ebay.com.au': 'EBAY_AU',
  'ebay.at': 'EBAY_AT',
  'www.ebay.at': 'EBAY_AT',
  'ebay.ch': 'EBAY_CH',
  'www.ebay.ch': 'EBAY_CH',
  'ebay.nl': 'EBAY_NL',
  'www.ebay.nl': 'EBAY_NL',
  'ebay.ie': 'EBAY_IE',
  'www.ebay.ie': 'EBAY_IE',
  'ebay.pl': 'EBAY_PL',
  'www.ebay.pl': 'EBAY_PL',
  'ebay.be': 'EBAY_BE',
  'www.ebay.be': 'EBAY_BE',
}

interface TokenCache {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

function isProduction(): boolean {
  const env = (process.env.EBAY_ENV ?? '').toLowerCase()
  if (env === 'sandbox') return false
  if (env === 'production' || env === 'prod') return true

  // Auto-detect: sandbox App/Cert IDs from developer.ebay.com contain "SBX-".
  const appId = process.env.EBAY_APP_ID ?? ''
  const certId = process.env.EBAY_CERTID ?? ''
  if (appId.includes('SBX') || certId.includes('SBX')) return false

  return true
}

function getCredentials(): { appId: string; certId: string } | null {
  const appId = process.env.EBAY_APP_ID?.trim()
  const certId = process.env.EBAY_CERTID?.trim()
  if (!appId || !certId) return null
  return { appId, certId }
}

export function isEbayUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'ebay.com' || host.endsWith('.ebay.com') || /^([a-z0-9-]+\.)?ebay\.[a-z.]+$/.test(host)
  } catch {
    return false
  }
}

/**
 * Extract eBay item id from common listing URL shapes:
 *   /itm/123456789012
 *   /itm/Title-Here/123456789012
 *   ?item=123456789012
 */
export function extractEbayItemId(url: string): string | null {
  try {
    const u = new URL(url)
    const fromPath = u.pathname.match(/\/itm\/(?:[^/]+\/)?(\d{9,15})/i)
    if (fromPath?.[1]) return fromPath[1]
    const itemParam = u.searchParams.get('item')
    if (itemParam && /^\d{9,15}$/.test(itemParam)) return itemParam
    // Fallback: last long numeric segment in path
    const segments = u.pathname.split('/').filter(Boolean)
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i] ?? ''
      if (/^\d{9,15}$/.test(seg)) return seg
    }
    return null
  } catch {
    return null
  }
}

export function marketplaceIdForUrl(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return MARKETPLACE_BY_HOST[host] ?? 'EBAY_US'
  } catch {
    return 'EBAY_US'
  }
}

async function getAppAccessToken(): Promise<string> {
  const creds = getCredentials()
  if (!creds) {
    throw new Error(
      'eBay API credentials missing. Set EBAY_APP_ID and EBAY_CERTID in the environment.',
    )
  }

  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken
  }

  const tokenUrl = isProduction() ? TOKEN_URL_PRODUCTION : TOKEN_URL_SANDBOX
  const basic = Buffer.from(`${creds.appId}:${creds.certId}`).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    // Public scope for Browse API item reads
    scope: 'https://api.ebay.com/oauth/api_scope',
  })

  const res = await axios.post(tokenUrl, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    timeout: 15_000,
    validateStatus: () => true,
  })

  if (res.status >= 400) {
    const detail =
      typeof res.data === 'object' && res.data && 'error_description' in res.data
        ? String((res.data as { error_description?: string }).error_description)
        : `HTTP ${res.status}`
    throw new Error(`eBay OAuth failed: ${detail}`)
  }

  const accessToken = String((res.data as { access_token?: string }).access_token ?? '')
  const expiresIn = Number((res.data as { expires_in?: number }).expires_in ?? 7200)
  if (!accessToken) throw new Error('eBay OAuth failed: empty access_token')

  tokenCache = {
    accessToken,
    expiresAt: now + expiresIn * 1000,
  }
  return accessToken
}

interface EbayPrice {
  value?: string
  currency?: string
}

interface EbayItemResponse {
  itemId?: string
  title?: string
  price?: EbayPrice
  currentBidPrice?: EbayPrice
  marketingPrice?: {
    originalPrice?: EbayPrice
    discountPercentage?: string
  }
  condition?: string
  estimatedAvailabilities?: Array<{
    estimatedAvailabilityStatus?: string
  }>
  errors?: Array<{ errorId?: number; message?: string; longMessage?: string }>
  items?: EbayItemResponse[]
}

function firstApiError(data: EbayItemResponse | undefined): string | null {
  const err = data?.errors?.[0]
  if (!err) return null
  return err.longMessage || err.message || null
}

function itemGroupIdFromError(message: string | null): string | null {
  if (!message) return null
  const m = message.match(/item_group_id=(\d+)/i)
  return m?.[1] ?? null
}

async function browseGet(
  url: string,
  token: string,
  marketplaceId: string,
): Promise<{ status: number; data: EbayItemResponse }> {
  const res = await axios.get<EbayItemResponse>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      Accept: 'application/json',
    },
    timeout: 15_000,
    validateStatus: () => true,
  })
  return { status: res.status, data: res.data ?? {} }
}

function resultFromItem(
  data: EbayItemResponse,
  expectedCurrency: string | null | undefined,
  warningPrefix = 'eBay Browse API',
): TestScrapeResult {
  const priceNode = data.price ?? data.currentBidPrice
  const rawValue = priceNode?.value
  const currency = priceNode?.currency ?? null
  const price = rawValue != null ? Number.parseFloat(String(rawValue)) : NaN

  if (rawValue == null || Number.isNaN(price)) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: 'eBay item has no price (ended listing, auction without bid, or restricted item).',
      matches: [],
      detectedCurrency: currency,
      currencyWarning: currencyWarning(currency, expectedCurrency),
    }
  }

  const text = currency ? `${currency} ${rawValue}` : String(rawValue)
  const title = data.title ? ` · ${data.title.slice(0, 80)}` : ''

  return {
    price,
    count: 1,
    warning: `${warningPrefix}${title}`,
    error: null,
    matches: [{ index: 0, text, price }],
    detectedCurrency: currency,
    currencyWarning: currencyWarning(currency, expectedCurrency),
  }
}

/**
 * Fetch price for an eBay listing via Browse API getItem.
 * Returns the same TestScrapeResult shape as cheerio/puppeteer scrapes.
 */
export async function scrapeEbayListing(input: TestScrapeInput): Promise<TestScrapeResult> {
  if (!getCredentials()) {
    return {
      price: null,
      count: 0,
      warning: null,
      error:
        'eBay URL detected but EBAY_APP_ID / EBAY_CERTID are not configured on the API server.',
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }

  const itemId = extractEbayItemId(input.url)
  if (!itemId) {
    return {
      price: null,
      count: 0,
      warning: null,
      error:
        'Could not extract eBay item id from URL. Expected /itm/{id} or a numeric item id in the path.',
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }

  try {
    const token = await getAppAccessToken()
    const base = isProduction() ? BROWSE_BASE_PRODUCTION : BROWSE_BASE_SANDBOX
    const marketplaceId = marketplaceIdForUrl(input.url)

    // Preferred path for /itm/{legacyId} URLs.
    let { status, data } = await browseGet(
      `${base}/item/get_item_by_legacy_id?legacy_item_id=${encodeURIComponent(itemId)}`,
      token,
      marketplaceId,
    )

    // Variation / multi-SKU listings are item groups, not single legacy items.
    if (status >= 400) {
      const apiErr = firstApiError(data)
      const groupId = itemGroupIdFromError(apiErr) ?? itemId
      if (apiErr?.toLowerCase().includes('item group') || apiErr?.toLowerCase().includes('item_group')) {
        const group = await browseGet(
          `${base}/item/get_items_by_item_group?item_group_id=${encodeURIComponent(groupId)}`,
          token,
          marketplaceId,
        )
        status = group.status
        data = group.data
        if (status < 400) {
          const items = Array.isArray(data.items) ? data.items : []
          const withPrice = items.find((it) => it.price?.value || it.currentBidPrice?.value)
          if (withPrice) {
            return resultFromItem(
              withPrice,
              input.currency,
              `eBay Browse API (variation group ${groupId})`,
            )
          }
        }
      }
    }

    // RESTful item id form: v1|{id}|0
    if (status >= 400) {
      const rest = await browseGet(
        `${base}/item/${encodeURIComponent(`v1|${itemId}|0`)}`,
        token,
        marketplaceId,
      )
      if (rest.status < 400) {
        status = rest.status
        data = rest.data
      }
    }

    if (status === 404) {
      return {
        price: null,
        count: 0,
        warning: null,
        error: `eBay item ${itemId} not found on ${marketplaceId}. The listing may have ended or is not available via Browse API.`,
        matches: [],
        detectedCurrency: null,
        currencyWarning: null,
      }
    }

    if (status >= 400) {
      const msg = firstApiError(data) ?? `HTTP ${status}`
      return {
        price: null,
        count: 0,
        warning: null,
        error: `eBay Browse API error: ${msg}`,
        matches: [],
        detectedCurrency: null,
        currencyWarning: null,
      }
    }

    return resultFromItem(data, input.currency)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      price: null,
      count: 0,
      warning: null,
      error: `eBay adapter error: ${msg}`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }
}

/** Test helper — clear cached OAuth token. */
export function __resetEbayTokenCacheForTests(): void {
  tokenCache = null
}
