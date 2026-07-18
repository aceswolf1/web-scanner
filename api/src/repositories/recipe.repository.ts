import { prisma } from '../lib/prisma.js'

export interface RecipeCreateData {
  name: string
  domain?: string | null
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
}

export const recipeRepository = {
  async list() {
    return prisma.selectorRecipe.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  },

  async findById(id: string) {
    return prisma.selectorRecipe.findUnique({ where: { id } })
  },

  async create(data: RecipeCreateData) {
    return prisma.selectorRecipe.create({
      data: {
        name: data.name,
        domain: data.domain ?? null,
        priceClass: data.priceClass ?? null,
        cssRule: data.cssRule ?? null,
        fatherClass: data.fatherClass ?? null,
      },
    })
  },

  async delete(id: string) {
    await prisma.selectorRecipe.delete({ where: { id } })
  },
}
