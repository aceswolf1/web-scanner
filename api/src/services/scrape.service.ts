import { priceHistoryRepository } from '../repositories/priceHistory.repository.js'
import { sourceRepository } from '../repositories/source.repository.js'
import { notFound } from '../lib/errors.js'
import type { ScrapeResultInput } from '../schemas/item.schema.js'

/**
 * Called by the Python scraper after it pulls a new price (or fails to).
 * We persist a PriceHistory row + update the source's cached price on success,
 * or stash the error message + bump `lastScrapedAt` on failure so the UI can surface it.
 *
 * Also maintains health counters (scrapeSuccessCount / scrapeFailCount / lastSuccessAt)
 * and optional detectedCurrency from the scrape pipeline.
 */
export const scrapeService = {
  async recordResult(input: ScrapeResultInput): Promise<{ success: true; warning?: string }> {
    const source = await sourceRepository.findById(input.sourceId)
    if (!source) throw notFound('Source')

    if (input.price !== undefined && input.price !== null) {
      // Success path: record price history + update source + clear any prior error.
      await priceHistoryRepository.recordScrape(input.sourceId, input.price)
      await sourceRepository.update(input.sourceId, {
        currentPrice: input.price,
        lastScrapedAt: new Date(),
        lastError: null,
        lastSuccessAt: new Date(),
        incrementSuccess: true,
      })
    } else if (input.error) {
      // Error path: store error on source, touch lastScrapedAt, bump fail counter.
      // Keep old currentPrice intact.
      await sourceRepository.update(input.sourceId, {
        lastScrapedAt: new Date(),
        lastError: input.error,
        incrementFail: true,
      })
    }

    return input.warning
      ? { success: true, warning: input.warning }
      : { success: true }
  },
}
