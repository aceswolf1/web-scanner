import axios from 'axios'
import type { TestScrapeInput, TestScrapeResult } from './test-scrape.service.js'

/**
 * Mercado Libre adapter.
 *
 * Env:
 *   ML_APP_ID          — Application App ID
 *   ML_CLIENT_SECRET   — Secret Key
 *   ML_SITE_ID         — optional default site (MCO, MLA, MLB, MLM, …)
 *   ML_ACCESS_TOKEN    — optional pre-issued token (skips client_credentials)
 */

const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'
const API_BASE = 'https://api.mercadolibre.com'

interface TokenCache {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

function currencyWarning(
  detected: string | null | undefined,
  expected: string | null | undefined,
): string | null {
  if (!detected || !expected) return null
  if (detected.toUpperCase() === expected.toUpperCase()) return null
  return `Detected currency ${detected} does not match source currency ${expected}`
}

function getCredentials(): { appId: string; secret: string } | null {
  const appId = process.env.ML_APP_ID?.trim()
  const secret = process.env.ML_CLIENT_SECRET?.trim()
  if (!appId || !secret) return null
  return { appId, secret }
}

export function isMercadoLibreUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host === 'mercadolibre.com' ||
      host.endsWith('.mercadolibre.com') ||
      host.includes('mercadolibre.com.') ||
      host.includes('mercadolivre.com') ||
      host.includes('mercadolibre.cl') ||
      host.includes('mercadolibre.com.ar') ||
      host.includes('mercadolibre.com.co') ||
      host.includes('mercadolibre.com.mx') ||
      host.includes('mercadolibre.com.pe') ||
      host.includes('mercadolibre.com.uy') ||
      host.includes('mercadolibre.com.ve') ||
      host.includes('mercadolibre.com.ec')
    )
  } catch {
    return false
  }
}

/** Map hostname → site id (MCO, MLA, …). */
export function siteIdFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('.com.co') || host.endsWith('com.co')) return 'MCO'
    if (host.includes('.com.ar')) return 'MLA'
    if (host.includes('.com.mx')) return 'MLM'
    if (host.includes('.com.br') || host.includes('mercadolivre')) return 'MLB'
    if (host.includes('.cl') && host.includes('mercado')) return 'MLC'
    if (host.includes('.com.pe')) return 'MPE'
    if (host.includes('.com.uy')) return 'MLU'
    if (host.includes('.com.ve')) return 'MLV'
    if (host.includes('.com.ec')) return 'MEC'
  } catch {
    /* fall through */
  }
  return (process.env.ML_SITE_ID ?? 'MCO').toUpperCase()
}

export type MlIdKind = 'product' | 'item' | 'user_product'

export interface ParsedMlId {
  kind: MlIdKind
  /** Normalized id for API: product MCO45517552, item MCO123, or user-product MCOU… */
  id: string
  siteId: string
  /** Optional listing id from query (?wid=MCO…) — preferred for price when present. */
  wid?: string
}

/**
 * Parse product/catalog, user-product (/up/), or classic listing ids from ML URLs.
 *  - /p/MCO45517552                 → product
 *  - /up/MCOU3753796057             → user_product (new PDP format)
 *  - ?wid=MCO3526193546             → concrete item/offer id (often on /up/ pages)
 *  - /MCO-1234567890-...            → item (MCO1234567890)
 *  - articulo.../MCO-...            → item
 */
export function parseMercadoLibreId(url: string): ParsedMlId | null {
  try {
    const u = new URL(url)
    const path = u.pathname
    const siteId = siteIdFromUrl(url)

    // Concrete offer/item id from search/polycard links
    const widRaw = u.searchParams.get('wid') || u.searchParams.get('item_id')
    const wid =
      widRaw && /^[A-Z]{3}-?\d{6,}$/i.test(widRaw)
        ? widRaw.replace('-', '').toUpperCase()
        : undefined

    // User-product pages: /up/MCOU3753796057
    const userProduct = path.match(/\/up\/([A-Z]{3}U\d{6,})/i)
    if (userProduct?.[1]) {
      return {
        kind: 'user_product',
        id: userProduct[1].toUpperCase(),
        siteId,
        wid,
      }
    }

    const product = path.match(/\/p\/([A-Z]{3}\d{6,})/i)
    if (product?.[1]) {
      return { kind: 'product', id: product[1].toUpperCase(), siteId, wid }
    }

    // Classic item: MCO-1234567890 or MCO1234567890 in path
    const itemDash = path.match(/\b([A-Z]{3})-(\d{6,})\b/i)
    if (itemDash?.[1] && itemDash[2]) {
      return {
        kind: 'item',
        id: `${itemDash[1].toUpperCase()}${itemDash[2]}`,
        siteId: itemDash[1].toUpperCase(),
        wid,
      }
    }

    const itemPlain = path.match(/\/([A-Z]{3}\d{6,})(?:\/|$)/i)
    if (itemPlain?.[1]) {
      return { kind: 'item', id: itemPlain[1].toUpperCase(), siteId, wid }
    }

    // URL with only wid= (no path id) — still trackable as item
    if (wid) {
      return { kind: 'item', id: wid, siteId, wid }
    }

    return null
  } catch {
    return null
  }
}

async function getAccessToken(): Promise<string> {
  const staticToken = process.env.ML_ACCESS_TOKEN?.trim()
  if (staticToken) return staticToken

  const creds = getCredentials()
  if (!creds) {
    throw new Error('Mercado Libre credentials missing. Set ML_APP_ID and ML_CLIENT_SECRET.')
  }

  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.appId,
    client_secret: creds.secret,
  })

  const res = await axios.post(TOKEN_URL, body.toString(), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 15_000,
    validateStatus: () => true,
  })

  if (res.status >= 400 || !res.data?.access_token) {
    const msg =
      typeof res.data === 'object'
        ? JSON.stringify(res.data).slice(0, 300)
        : `HTTP ${res.status}`
    throw new Error(`Mercado Libre OAuth failed: ${msg}`)
  }

  const accessToken = String(res.data.access_token)
  const expiresIn = Number(res.data.expires_in ?? 21600)
  tokenCache = {
    accessToken,
    expiresAt: now + expiresIn * 1000,
  }
  return accessToken
}

interface MlItemLike {
  id?: string
  item_id?: string
  title?: string
  name?: string
  price?: number
  currency_id?: string
  status?: string
  condition?: string
}

async function mlGet<T>(path: string, token: string): Promise<{ status: number; data: T }> {
  const res = await axios.get<T>(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 15_000,
    validateStatus: () => true,
  })
  return { status: res.status, data: res.data as T }
}

function resultFromPrice(
  price: number,
  currency: string | null,
  title: string | null,
  expectedCurrency: string | null | undefined,
  warningPrefix: string,
): TestScrapeResult {
  const text = currency ? `${currency} ${price}` : String(price)
  const titlePart = title ? ` · ${title.slice(0, 80)}` : ''
  return {
    price,
    count: 1,
    warning: `${warningPrefix}${titlePart}`,
    error: null,
    matches: [{ index: 0, text, price }],
    detectedCurrency: currency,
    currencyWarning: currencyWarning(currency, expectedCurrency),
  }
}

async function scrapeProduct(
  productId: string,
  token: string,
  expectedCurrency: string | null | undefined,
): Promise<TestScrapeResult> {
  // Catalog product page: list offers and pick lowest price.
  const itemsRes = await mlGet<{
    results?: Array<{
      item_id?: string
      price?: number
      currency_id?: string
      condition?: string
    }>
  }>(`/products/${encodeURIComponent(productId)}/items`, token)

  if (itemsRes.status === 404) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre product ${productId} not found.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }

  if (itemsRes.status >= 400) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre API error (${itemsRes.status}) for product ${productId}.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }

  const offers = (itemsRes.data?.results ?? []).filter(
    (o) => typeof o.price === 'number' && o.price > 0,
  )
  if (offers.length === 0) {
    // Fallback: product metadata only (sometimes no offers list)
    const prod = await mlGet<{
      name?: string
      buy_box_winner?: { price?: number; currency_id?: string; item_id?: string } | null
    }>(`/products/${encodeURIComponent(productId)}`, token)

    const winner = prod.data?.buy_box_winner
    if (winner?.price != null) {
      return resultFromPrice(
        winner.price,
        winner.currency_id ?? null,
        prod.data?.name ?? null,
        expectedCurrency,
        'Mercado Libre API (buy box)',
      )
    }

    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre product ${productId} has no priced offers.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }

  // Sort by price ascending — first offer is best deal among catalog sellers.
  const sorted = [...offers].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  const best = sorted[0]!
  const matches = sorted.slice(0, 10).map((o, index) => ({
    index,
    text: `${o.currency_id ?? ''} ${o.price}`.trim() + (o.item_id ? ` (${o.item_id})` : ''),
    price: o.price ?? null,
  }))

  // Product name
  let title: string | null = null
  const prodMeta = await mlGet<{ name?: string }>(
    `/products/${encodeURIComponent(productId)}`,
    token,
  )
  if (prodMeta.status < 400) title = prodMeta.data?.name ?? null

  return {
    price: best.price ?? null,
    count: matches.length,
    warning:
      matches.length > 1
        ? `Mercado Libre API · ${matches.length} offers — using lowest${title ? ` · ${title.slice(0, 60)}` : ''}`
        : `Mercado Libre API${title ? ` · ${title.slice(0, 80)}` : ''}`,
    error: null,
    matches,
    detectedCurrency: best.currency_id ?? null,
    currencyWarning: currencyWarning(best.currency_id, expectedCurrency),
  }
}

async function scrapeItem(
  itemId: string,
  token: string,
  expectedCurrency: string | null | undefined,
): Promise<TestScrapeResult> {
  const res = await mlGet<MlItemLike>(`/items/${encodeURIComponent(itemId)}`, token)

  if (res.status === 404) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre item ${itemId} not found.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      htmlFallback: true,
    }
  }

  if (res.status === 403) {
    // App token often cannot read arbitrary seller items — let HTML/Puppeteer try.
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre item ${itemId} is restricted for this app token (403).`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      htmlFallback: true,
    }
  }

  if (res.status >= 400) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre API error (${res.status}) for item ${itemId}.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      htmlFallback: true,
    }
  }

  const data = res.data
  if (data.price == null || typeof data.price !== 'number') {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre item ${itemId} has no price (paused/ended?).`,
      matches: [],
      detectedCurrency: data.currency_id ?? null,
      currencyWarning: currencyWarning(data.currency_id, expectedCurrency),
      htmlFallback: true,
    }
  }

  return resultFromPrice(
    data.price,
    data.currency_id ?? null,
    data.title ?? null,
    expectedCurrency,
    'Mercado Libre API',
  )
}

/**
 * New ML PDP format: /up/MCOU… (user-product).
 * Metadata is public; price often only on a linked item (wid=) which may be 403
 * for app tokens. We try wid → catalog_product_id → catalog search by name/seller.
 */
async function scrapeUserProduct(
  userProductId: string,
  token: string,
  expectedCurrency: string | null | undefined,
  wid?: string,
  siteId = 'MCO',
): Promise<TestScrapeResult> {
  // Prefer concrete offer id from the URL when present.
  if (wid) {
    const fromWid = await scrapeItem(wid, token, expectedCurrency)
    if (fromWid.price !== null) {
      return {
        ...fromWid,
        warning: fromWid.warning
          ? `${fromWid.warning} (from wid)`
          : `Mercado Libre API · offer ${wid}`,
      }
    }
  }

  const res = await mlGet<{
    id?: string
    name?: string
    catalog_product_id?: string | null
    user_id?: number
    site_id?: string
  }>(`/user-products/${encodeURIComponent(userProductId)}`, token)

  if (res.status === 404) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre user-product ${userProductId} not found.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      htmlFallback: true,
    }
  }

  if (res.status >= 400) {
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre API error (${res.status}) for user-product ${userProductId}.`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      htmlFallback: true,
    }
  }

  const name = res.data?.name ?? null
  const catalogId = res.data?.catalog_product_id
  const sellerId = res.data?.user_id
  const site = (res.data?.site_id ?? siteId).toUpperCase()

  // If this user-product maps to a catalog product, reuse the multi-offer path.
  if (catalogId) {
    const fromCatalog = await scrapeProduct(catalogId, token, expectedCurrency)
    if (fromCatalog.price !== null) return fromCatalog
  }

  // Best-effort: catalog product search by title, prefer offers from same seller
  // or the same user_product_id when ML links them.
  if (name) {
    const q = encodeURIComponent(name)
    const search = await mlGet<{ results?: Array<{ id?: string; name?: string }> }>(
      `/products/search?status=active&site_id=${encodeURIComponent(site)}&q=${q}&limit=8`,
      token,
    )
    if (search.status < 400 && Array.isArray(search.data?.results)) {
      for (const hit of search.data.results) {
        if (!hit.id) continue
        const itemsRes = await mlGet<{
          results?: Array<{
            item_id?: string
            price?: number
            currency_id?: string
            seller_id?: number
            user_product_id?: string
          }>
        }>(`/products/${encodeURIComponent(hit.id)}/items`, token)
        if (itemsRes.status >= 400) continue
        const offers = itemsRes.data?.results ?? []
        if (offers.length === 0) continue

        const exactUp = offers.filter(
          (o) => o.user_product_id?.toUpperCase() === userProductId.toUpperCase(),
        )
        const sameSeller = offers.filter((o) => sellerId && o.seller_id === sellerId)
        const pool =
          exactUp.length > 0 ? exactUp : sameSeller.length > 0 ? sameSeller : offers
        const priced = pool.filter((o) => typeof o.price === 'number' && o.price > 0)
        if (priced.length === 0) continue

        const sorted = [...priced].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        const best = sorted[0]!
        const matches = sorted.slice(0, 10).map((o, index) => ({
          index,
          text:
            `${o.currency_id ?? ''} ${o.price}`.trim() +
            (o.item_id ? ` (${o.item_id})` : '') +
            (o.user_product_id ? ` [${o.user_product_id}]` : ''),
          price: o.price ?? null,
        }))

        const matchQuality =
          exactUp.length > 0
            ? 'exact user-product match'
            : sameSeller.length > 0
              ? 'same seller catalog match'
              : 'name-based catalog match'

        return {
          price: best.price ?? null,
          count: matches.length,
          warning: `Mercado Libre API · ${matchQuality}${name ? ` · ${name.slice(0, 50)}` : ''}`,
          error: null,
          matches,
          detectedCurrency: best.currency_id ?? null,
          currencyWarning: currencyWarning(best.currency_id, expectedCurrency),
        }
      }
    }
  }

  // No price via API — fall through to HTML scrape (may still hit bot wall).
  return {
    price: null,
    count: 0,
    warning: null,
    error: name
      ? `Mercado Libre user-product “${name.slice(0, 60)}” has no API price (try HTML scrape).`
      : `Mercado Libre user-product ${userProductId} has no API price (try HTML scrape).`,
    matches: [],
    detectedCurrency: null,
    currencyWarning: null,
    htmlFallback: true,
  }
}

export async function scrapeMercadoLibreListing(
  input: TestScrapeInput,
): Promise<TestScrapeResult> {
  if (!getCredentials() && !process.env.ML_ACCESS_TOKEN?.trim()) {
    return {
      price: null,
      count: 0,
      warning: null,
      error:
        'Mercado Libre URL detected but ML_APP_ID / ML_CLIENT_SECRET are not configured on the API server.',
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
    }
  }

  const parsed = parseMercadoLibreId(input.url)
  if (!parsed) {
    return {
      price: null,
      count: 0,
      warning: null,
      error:
        'Could not extract Mercado Libre product/item id from URL. Expected /p/MCO…, /up/MCOU…, MCO-… listing, or ?wid=MCO….',
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      // Let HTML try if the page is still a mercadolibre host we didn't parse.
      htmlFallback: true,
    }
  }

  try {
    const token = await getAccessToken()
    if (parsed.kind === 'product') {
      return await scrapeProduct(parsed.id, token, input.currency)
    }
    if (parsed.kind === 'user_product') {
      return await scrapeUserProduct(
        parsed.id,
        token,
        input.currency,
        parsed.wid,
        parsed.siteId,
      )
    }
    // Prefer wid when present even on classic item URLs.
    if (parsed.wid && parsed.wid !== parsed.id) {
      const fromWid = await scrapeItem(parsed.wid, token, input.currency)
      if (fromWid.price !== null) return fromWid
    }
    return await scrapeItem(parsed.id, token, input.currency)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      price: null,
      count: 0,
      warning: null,
      error: `Mercado Libre adapter error: ${msg}`,
      matches: [],
      detectedCurrency: null,
      currencyWarning: null,
      htmlFallback: true,
    }
  }
}

export function __resetMlTokenCacheForTests(): void {
  tokenCache = null
}
