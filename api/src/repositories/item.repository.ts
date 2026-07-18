import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export interface ListItemsArgs {
  search?: string
  favorite?: boolean
}

/** Sources include used by list/create/update so card sparklines always have data. */
const sourcesWithSparklineHistory = {
  orderBy: { isMain: 'desc' as const },
  include: {
    priceHistory: {
      orderBy: { scrapedAt: 'desc' as const },
      take: 30,
      select: { price: true, scrapedAt: true },
    },
  },
}

function withChronologicalHistory<
  T extends {
    sources: Array<{ priceHistory: Array<{ price: number; scrapedAt: Date }> }>
  },
>(item: T): T {
  return {
    ...item,
    sources: item.sources.map((source) => ({
      ...source,
      priceHistory: [...source.priceHistory].reverse(),
    })),
  }
}

export const itemRepository = {
  async list(args: ListItemsArgs = {}) {
    const where: Prisma.ItemWhereInput = {}

    if (typeof args.favorite === 'boolean') {
      where.isFavorite = args.favorite
    }

    if (args.search && args.search.trim().length > 0) {
      const term = args.search.trim()
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { sources: { some: { url: { contains: term, mode: 'insensitive' } } } },
        { tags: { some: { tag: { name: { contains: term, mode: 'insensitive' } } } } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          tags: { include: { tag: true } },
          sources: sourcesWithSparklineHistory,
        },
      }),
      prisma.item.count({ where }),
    ])

    return {
      items: items.map((item) => withChronologicalHistory(item)),
      total,
    }
  },

  async findById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        sources: {
          orderBy: { isMain: 'desc' },
          include: {
            priceHistory: {
              orderBy: { scrapedAt: 'asc' },
            },
          },
        },
      },
    })
  },

  async findByIdOrThrow(id: string) {
    const item = await this.findById(id)
    if (!item) throw new Error(`Item ${id} not found`)
    return item
  },

  async create(data: {
    name: string
    imageUrl?: string | null
    tagIds: string[]
    sources: Array<{
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
    }>
  }) {
    const hasMain = data.sources.some((s) => s.isMain)
    return prisma.item.create({
      data: {
        name: data.name,
        imageUrl: data.imageUrl ?? null,
        tags: {
          create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
        sources: {
          create: data.sources.map((s) => ({
            url: s.url,
            currency: s.currency as Prisma.SourceCreateInput['currency'],
            priceClass: s.priceClass ?? null,
            cssRule: s.cssRule ?? null,
            fatherClass: s.fatherClass ?? null,
            // If no source marked itself as main, the first one wins.
            isMain: hasMain ? s.isMain : s === data.sources[0],
            isDiscounted: s.isDiscounted ?? false,
            isUsed: s.isUsed ?? false,
            notes: s.notes ?? null,
            matchIndex: s.matchIndex ?? 0,
          })),
        },
      },
      include: {
        tags: { include: { tag: true } },
        sources: sourcesWithSparklineHistory,
      },
    }).then((item) => withChronologicalHistory(item))
  },

  async update(
    id: string,
    data: {
      name?: string
      imageUrl?: string | null
      isFavorite?: boolean
    }
  ) {
    return prisma.item.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
      },
      include: {
        tags: { include: { tag: true } },
        sources: sourcesWithSparklineHistory,
      },
    }).then((item) => withChronologicalHistory(item))
  },

  async replaceTags(itemId: string, tagIds: string[]) {
    await prisma.itemTag.deleteMany({ where: { itemId } })
    if (tagIds.length > 0) {
      await prisma.itemTag.createMany({
        data: tagIds.map((tagId) => ({ itemId, tagId })),
      })
    }
  },

  async toggleFavorite(id: string) {
    const current = await prisma.item.findUnique({
      where: { id },
      select: { isFavorite: true },
    })
    if (!current) throw new Error(`Item ${id} not found`)
    return prisma.item.update({
      where: { id },
      data: { isFavorite: !current.isFavorite },
      include: {
        tags: { include: { tag: true } },
        sources: { orderBy: { isMain: 'desc' } },
      },
    })
  },

  async delete(id: string) {
    await prisma.item.delete({ where: { id } })
  },
}
