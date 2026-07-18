import { recipeRepository } from '../repositories/recipe.repository.js'
import { notFound, badRequest } from '../lib/errors.js'
import type { CreateRecipeInput } from '../schemas/recipe.schema.js'

export const recipeService = {
  async list() {
    return recipeRepository.list()
  },

  async create(input: CreateRecipeInput) {
    const hasSelector =
      Boolean(input.priceClass?.trim()) ||
      Boolean(input.cssRule?.trim()) ||
      Boolean(input.fatherClass?.trim())

    if (!hasSelector) {
      throw badRequest(
        'At least one selector field is required (priceClass, cssRule, or fatherClass)'
      )
    }

    return recipeRepository.create({
      name: input.name.trim(),
      domain: input.domain?.trim() || null,
      priceClass: input.priceClass?.trim() || null,
      cssRule: input.cssRule?.trim() || null,
      fatherClass: input.fatherClass?.trim() || null,
    })
  },

  async delete(id: string) {
    const existing = await recipeRepository.findById(id)
    if (!existing) throw notFound('Recipe')
    await recipeRepository.delete(id)
  },
}
