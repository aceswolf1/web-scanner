import { itemRepository } from '../repositories/item.repository.js'
import { tagRepository } from '../repositories/tag.repository.js'
import { HttpError, notFound, badRequest } from '../lib/errors.js'
import { toPublicImageUrl } from '../lib/minio.js'
import type { CreateItemInput, ListItemsQuery, UpdateItemInput } from '../schemas/item.schema.js'
import type { Item, Tag } from '@prisma/client'

function withPublicImage<T extends { imageUrl: string | null }>(item: T): T {
  return {
    ...item,
    imageUrl: toPublicImageUrl(item.imageUrl),
  }
}

export interface ItemWithRelations {
  id: string
  name: string
  imageUrl: string | null
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  tags: { tag: Tag }[]
  sources: Array<{
    id: string
    itemId: string
    url: string
    currency: string
    priceClass: string | null
    cssRule: string | null
    fatherClass: string | null
    isMain: boolean
    isDiscounted: boolean
    isUsed: boolean
    currentPrice: number | null
    lastScrapedAt: Date | null
    lastError: string | null
    notes: string | null
    matchIndex: number
    scrapeSuccessCount: number
    scrapeFailCount: number
    lastSuccessAt: Date | null
    detectedCurrency: string | null
  }>
}

export const itemService = {
  async list(query: ListItemsQuery): Promise<{ items: ItemWithRelations[]; total: number }> {
    const result = await itemRepository.list({
      search: query.search,
      favorite: query.favorite,
    })
    return {
      items: result.items.map((item) => withPublicImage(item as ItemWithRelations)),
      total: result.total,
    }
  },

  async getById(id: string): Promise<ItemWithRelations> {
    const item = await itemRepository.findById(id)
    if (!item) throw notFound('Item')
    return withPublicImage(item as ItemWithRelations)
  },

  async create(input: CreateItemInput): Promise<ItemWithRelations> {
    if (input.sources.length === 0) {
      throw badRequest('At least one source is required')
    }

    // Validate referenced tags exist
    if (input.tagIds.length > 0) {
      const existing = await tagRepository.list()
      const existingIds = new Set(existing.map((t) => t.id))
      const missing = input.tagIds.filter((tid) => !existingIds.has(tid))
      if (missing.length > 0) {
        throw badRequest(`Unknown tagIds: ${missing.join(', ')}`)
      }
    }

    const created = await itemRepository.create({
      name: input.name,
      imageUrl: input.imageUrl ?? null,
      tagIds: input.tagIds,
      sources: input.sources.map((s) => ({
        url: s.url,
        currency: s.currency,
        priceClass: s.priceClass ?? null,
        cssRule: s.cssRule ?? null,
        fatherClass: s.fatherClass ?? null,
        isMain: s.isMain,
        isDiscounted: s.isDiscounted ?? false,
        isUsed: s.isUsed ?? false,
        notes: s.notes ?? null,
        matchIndex: s.matchIndex ?? 0,
      })),
    })
    return withPublicImage(created as ItemWithRelations)
  },

  async update(id: string, input: UpdateItemInput): Promise<ItemWithRelations> {
    const existing = await itemRepository.findById(id)
    if (!existing) throw notFound('Item')

    if (input.tagIds) {
      const tags = await tagRepository.list()
      const validIds = new Set(tags.map((t) => t.id))
      const invalid = input.tagIds.filter((tid) => !validIds.has(tid))
      if (invalid.length > 0) {
        throw badRequest(`Unknown tagIds: ${invalid.join(', ')}`)
      }
      await itemRepository.replaceTags(id, input.tagIds)
    }

    const updated = await itemRepository.update(id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
    })
    return withPublicImage(updated as ItemWithRelations)
  },

  async toggleFavorite(id: string): Promise<ItemWithRelations> {
    try {
      const updated = await itemRepository.toggleFavorite(id)
      return withPublicImage(updated as ItemWithRelations)
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        throw notFound('Item')
      }
      throw err
    }
  },

  async delete(id: string): Promise<void> {
    const existing = await itemRepository.findById(id)
    if (!existing) throw notFound('Item')
    await itemRepository.delete(id)
  },

  /**
   * Group per-source price history for an item.
   * Output is shaped for the frontend chart: one entry per source,
   * each with a list of { price, scrapedAt } points.
   */
  async getHistory(id: string) {
    const item = await itemRepository.findById(id)
    if (!item) throw notFound('Item')

    const sources = item.sources
    return {
      history: sources.map((s) => ({
        sourceId: s.id,
        sourceName: new URL(s.url).hostname.replace(/^www\./, ''),
        sourceUrl: s.url,
        currency: s.currency,
        points: s.priceHistory.map((p) => ({
          price: p.price,
          scrapedAt: p.scrapedAt.toISOString(),
        })),
      })),
    }
  },

  /**
   * Ask the scraper to refresh every source of an item.
   * Returns the list of source ids that were sent.
   * If the scraper is unreachable, still returns `queued: true`
   * gracefully — the front-end polls /items/:id/history anyway.
   */
  async triggerScrape(id: string): Promise<{ queued: boolean; sourceIds: string[] }> {
    const item = await itemRepository.findById(id)
    if (!item) throw notFound('Item')
    const sourceIds = item.sources.map((s) => s.id)

    const scraperUrl =
      process.env.SCRAPER_INTERNAL_URL ?? 'http://scraper:8000'

    try {
      await fetch(`${scraperUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds }),
        // Hard timeout — don't let the API hang on a slow scraper.
        signal: AbortSignal.timeout(3000),
      })
    } catch (err) {
      // Graceful: scraper offline is not a client-visible error.
      // The frontend will continue to display the cached data.
      void err
    }

    return { queued: true, sourceIds }
  },
}

/** Type alias re-exported for convenience. */
export type { Item }
