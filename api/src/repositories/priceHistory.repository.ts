import { prisma } from '../lib/prisma.js'

export const priceHistoryRepository = {
  async create(sourceId: string, price: number, scrapedAt: Date = new Date()) {
    return prisma.priceHistory.create({
      data: { sourceId, price, scrapedAt },
    })
  },

  /**
   * Save a scrape result AND atomically update the source's
   * `currentPrice` + `lastScrapedAt`. Keeps cache consistent.
   */
  async recordScrape(sourceId: string, price: number) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.source.findUnique({ where: { id: sourceId } })
      if (!source) throw new Error(`Source ${sourceId} not found`)

      const [history] = await Promise.all([
        tx.priceHistory.create({
          data: { sourceId, price, scrapedAt: new Date() },
        }),
        tx.source.update({
          where: { id: sourceId },
          data: { currentPrice: price, lastScrapedAt: new Date() },
        }),
      ])
      return history
    })
  },

  async listForItem(itemId: string) {
    const sources = await prisma.source.findMany({
      where: { itemId },
      include: {
        priceHistory: {
          orderBy: { scrapedAt: 'asc' },
          select: { price: true, scrapedAt: true },
        },
      },
    })
    return sources
  },
}
