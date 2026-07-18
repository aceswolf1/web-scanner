import { sourceRepository } from '../repositories/source.repository.js'
import { notFound } from '../lib/errors.js'
import type { CreateSourceInput, UpdateSourceInput } from '../schemas/source.schema.js'
import { prisma } from '../lib/prisma.js'

export const sourceService = {
  async create(itemId: string, input: CreateSourceInput) {
    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item) throw notFound('Item')

    // If this is set as main, clear other mains atomically inside the repo.
    return sourceRepository.create(itemId, {
      url: input.url,
      currency: input.currency,
      priceClass: input.priceClass ?? null,
      cssRule: input.cssRule ?? null,
      fatherClass: input.fatherClass ?? null,
      isMain: input.isMain,
      isDiscounted: input.isDiscounted,
      isUsed: input.isUsed,
      notes: input.notes ?? null,
      matchIndex: input.matchIndex ?? 0,
    })
  },

  async update(id: string, input: UpdateSourceInput) {
    try {
      return await sourceRepository.update(id, {
        ...(input.url !== undefined && { url: input.url }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.priceClass !== undefined && { priceClass: input.priceClass }),
        ...(input.cssRule !== undefined && { cssRule: input.cssRule }),
        ...(input.fatherClass !== undefined && { fatherClass: input.fatherClass }),
        ...(input.isMain !== undefined && { isMain: input.isMain }),
        ...(input.isDiscounted !== undefined && { isDiscounted: input.isDiscounted }),
        ...(input.isUsed !== undefined && { isUsed: input.isUsed }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.matchIndex !== undefined && { matchIndex: input.matchIndex }),
      })
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        throw notFound('Source')
      }
      throw err
    }
  },

  async setMain(id: string) {
    try {
      const updated = await sourceRepository.setMain(id)
      if (!updated) throw notFound('Source')
      return updated
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        throw notFound('Source')
      }
      throw err
    }
  },

  async delete(id: string) {
    const existing = await sourceRepository.findById(id)
    if (!existing) throw notFound('Source')
    await sourceRepository.delete(id)
  },
}
