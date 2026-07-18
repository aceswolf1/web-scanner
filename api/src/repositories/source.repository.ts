import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export interface SourceCreateData {
  url: string
  currency: string
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
  isMain: boolean
  isDiscounted?: boolean
  isUsed?: boolean
  notes?: string | null
  matchIndex?: number
}

export interface SourceUpdateData {
  url?: string
  currency?: string
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
  isMain?: boolean
  isDiscounted?: boolean
  isUsed?: boolean
  currentPrice?: number | null
  lastScrapedAt?: Date | null
  lastError?: string | null
  notes?: string | null
  matchIndex?: number
  scrapeSuccessCount?: number
  scrapeFailCount?: number
  lastSuccessAt?: Date | null
  detectedCurrency?: string | null
  /** When true, increments scrapeSuccessCount by 1 */
  incrementSuccess?: boolean
  /** When true, increments scrapeFailCount by 1 */
  incrementFail?: boolean
}

export const sourceRepository = {
  async create(itemId: string, data: SourceCreateData) {
    if (data.isMain) {
      await prisma.source.updateMany({
        where: { itemId },
        data: { isMain: false },
      })
    }
    return prisma.source.create({
      data: {
        itemId,
        url: data.url,
        currency: data.currency as Prisma.SourceCreateInput['currency'],
        priceClass: data.priceClass ?? null,
        cssRule: data.cssRule ?? null,
        fatherClass: data.fatherClass ?? null,
        isMain: data.isMain,
        isDiscounted: data.isDiscounted ?? false,
        isUsed: data.isUsed ?? false,
        notes: data.notes ?? null,
        matchIndex: data.matchIndex ?? 0,
      },
    })
  },

  async findById(id: string) {
    return prisma.source.findUnique({ where: { id } })
  },

  async update(id: string, data: SourceUpdateData) {
    const source = await prisma.source.findUnique({ where: { id } })
    if (!source) throw new Error(`Source ${id} not found`)

    if (data.isMain === true) {
      await prisma.source.updateMany({
        where: { itemId: source.itemId, NOT: { id } },
        data: { isMain: false },
      })
    }

    return prisma.source.update({
      where: { id },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.currency !== undefined && {
          currency: data.currency as Prisma.SourceUpdateInput['currency'],
        }),
        ...(data.priceClass !== undefined && { priceClass: data.priceClass }),
        ...(data.cssRule !== undefined && { cssRule: data.cssRule }),
        ...(data.fatherClass !== undefined && { fatherClass: data.fatherClass }),
        ...(data.isMain !== undefined && { isMain: data.isMain }),
        ...(data.isDiscounted !== undefined && { isDiscounted: data.isDiscounted }),
        ...(data.isUsed !== undefined && { isUsed: data.isUsed }),
        ...(data.currentPrice !== undefined && { currentPrice: data.currentPrice }),
        ...(data.lastScrapedAt !== undefined && { lastScrapedAt: data.lastScrapedAt }),
        ...(data.lastError !== undefined && { lastError: data.lastError }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.matchIndex !== undefined && { matchIndex: data.matchIndex }),
        ...(data.scrapeSuccessCount !== undefined && {
          scrapeSuccessCount: data.scrapeSuccessCount,
        }),
        ...(data.scrapeFailCount !== undefined && { scrapeFailCount: data.scrapeFailCount }),
        ...(data.lastSuccessAt !== undefined && { lastSuccessAt: data.lastSuccessAt }),
        ...(data.detectedCurrency !== undefined && {
          detectedCurrency: data.detectedCurrency,
        }),
        ...(data.incrementSuccess === true && {
          scrapeSuccessCount: { increment: 1 },
        }),
        ...(data.incrementFail === true && {
          scrapeFailCount: { increment: 1 },
        }),
      },
    })
  },

  async setMain(id: string) {
    const source = await prisma.source.findUnique({ where: { id } })
    if (!source) throw new Error(`Source ${id} not found`)
    // Atomic: clear all isMain flags on the item, then set this one true.
    await prisma.$transaction([
      prisma.source.updateMany({
        where: { itemId: source.itemId },
        data: { isMain: false },
      }),
      prisma.source.update({
        where: { id },
        data: { isMain: true },
      }),
    ])
    return prisma.source.findUnique({ where: { id } })
  },

  async delete(id: string) {
    await prisma.source.delete({ where: { id } })
  },
}
