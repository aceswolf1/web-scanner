import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { Browser } from 'puppeteer-core'
import {
  extractPrice,
  withCurrencyFields,
  selectMatchIndex,
  MAX_MATCHES,
} from './test-scrape.service.js'
import type { TestScrapeInput, TestScrapeResult, ScrapeMatch } from './test-scrape.service.js'

puppeteerExtra.use(StealthPlugin())

const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium-browser'

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Substrings in the final URL that indicate a bot-check or login wall
const BOT_WALL_PATTERNS = [
  'account-verification',
  'captcha',
  'robot',
  'challenge',
  'verify',
  'login',
  'signin',
  'auth',
]

function emptyResult(error: string): TestScrapeResult {
  return {
    price: null,
    count: 0,
    warning: null,
    error,
    matches: [],
    detectedCurrency: null,
    currencyWarning: null,
  }
}

export async function puppeteerScrape(input: TestScrapeInput): Promise<TestScrapeResult> {
  const priceClass = input.priceClass?.replace(/^\./, '') || null
  const fatherClass = input.fatherClass?.replace(/^\./, '') || null
  const cssRule = input.cssRule || null

  let selector: string
  if (cssRule) {
    selector = cssRule
  } else if (fatherClass && priceClass) {
    selector = `.${fatherClass} .${priceClass}`
  } else if (priceClass) {
    selector = `.${priceClass}`
  } else {
    return emptyResult('No selector configured')
  }

  let browser: Browser | undefined
  try {
    browser = await puppeteerExtra.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: LAUNCH_ARGS,
    }) as unknown as Browser

    const page = await browser.newPage()

    await page.setUserAgent(USER_AGENT)
    await page.setViewport({ width: 1280, height: 800 })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

    // Block images/media/fonts to speed up load — we only need DOM text
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const type = req.resourceType()
      if (type === 'image' || type === 'media' || type === 'font') {
        req.abort()
      } else {
        req.continue()
      }
    })

    const response = await page.goto(input.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    if (response && response.status() >= 400) {
      return emptyResult(`HTTP ${response.status()} from URL`)
    }

    // Detect bot-wall redirects before wasting 15s waiting for an element that won't appear
    const finalUrl = page.url()
    const hitBotWall = BOT_WALL_PATTERNS.some((p) => finalUrl.toLowerCase().includes(p))
    if (hitBotWall) {
      return emptyResult(
        `The site redirected to a bot-check page (${new URL(finalUrl).pathname}). This site actively blocks scrapers — try logging in via browser cookies or use the site's API if available.`
      )
    }

    // Wait for the target element to appear AND contain a numeric price.
    // Many sites render empty placeholders first, then fill them via JS —
    // waiting only for the element would return too early with empty text.
    try {
      // Browser-context callbacks: cast document via globalThis so Node tsc (no DOM lib) stays clean.
      await page.waitForFunction(
        (sel: string) => {
          const doc = (globalThis as unknown as { document: { querySelectorAll: (s: string) => ArrayLike<{ textContent: string | null }> } }).document
          const els = Array.from(doc.querySelectorAll(sel))
          return els.some((el) => /\d/.test(el.textContent ?? ''))
        },
        { timeout: 20_000 },
        selector
      )
    } catch {
      const currentUrl = page.url()
      const redirected =
        currentUrl !== input.url &&
        !currentUrl.startsWith(input.url.split('?')[0] ?? input.url)
      // Check whether the element exists but is still empty vs missing entirely
      const exists = await page.evaluate((sel: string) => {
        const doc = (globalThis as unknown as { document: { querySelectorAll: (s: string) => { length: number } } }).document
        return doc.querySelectorAll(sel).length
      }, selector)
      return emptyResult(
        redirected
          ? `Page redirected to ${new URL(currentUrl).pathname} — element was never rendered`
          : exists > 0
            ? `Element "${selector}" found but stayed empty after ${20}s — price may load behind a login wall`
            : `Element "${selector}" not found after JavaScript render`
      )
    }

    const { count, texts } = await page.evaluate(
      (sel: string, maxMatches: number) => {
        const doc = (globalThis as unknown as {
          document: { querySelectorAll: (s: string) => ArrayLike<{ textContent: string | null }> }
        }).document
        const els = Array.from(doc.querySelectorAll(sel))
        return {
          count: els.length,
          texts: els.slice(0, maxMatches).map((el) => (el.textContent ?? '').trim()),
        }
      },
      selector,
      MAX_MATCHES
    )

    if (count === 0) {
      return emptyResult('No elements matched the selector')
    }

    const matches: ScrapeMatch[] = texts.map((text, index) => ({
      index,
      text: text.slice(0, 200),
      price: extractPrice(text),
    }))

    const selectedIdx = selectMatchIndex(count, input.matchIndex)
    // Prefer the requested match; if it has no digits, fall back to first numeric match.
    const preferredText = texts[selectedIdx] ?? texts[0] ?? ''
    const fallbackText =
      texts.find((t) => /\d/.test(t)) ?? preferredText
    const selectedText =
      extractPrice(preferredText) !== null ? preferredText : fallbackText

    const price = extractPrice(selectedText)
    const warning =
      count > 1
        ? `Multiple matches (${count}) — using index ${selectedIdx}. Consider a more specific selector.`
        : null

    if (price === null) {
      return withCurrencyFields(
        {
          price: null,
          count,
          warning,
          error: `Could not extract a number from: "${selectedText.slice(0, 60)}"`,
          matches,
        },
        selectedText,
        input.currency
      )
    }

    return withCurrencyFields(
      { price, count, warning, error: null, matches },
      selectedText,
      input.currency
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return emptyResult('Page load timed out')
    }
    if (msg.includes('net::ERR') || msg.includes('ECONNREFUSED')) {
      return emptyResult(`Network error: ${msg}`)
    }
    return emptyResult(`Browser error: ${msg}`)
  } finally {
    await browser?.close()
  }
}
