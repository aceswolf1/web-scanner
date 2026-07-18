import { tagRepository } from '../repositories/tag.repository.js'
import { notFound, conflict } from '../lib/errors.js'
import type { CreateTagInput } from '../schemas/tag.schema.js'

export const tagService = {
  async list() {
    return tagRepository.list()
  },

  async create(input: CreateTagInput) {
    const existing = await tagRepository.findByName(input.name)
    if (existing) throw conflict(`Tag "${input.name}" already exists`)
    return tagRepository.create(input.name, input.color)
  },

  async delete(id: string) {
    const existing = await tagRepository.findById(id)
    if (!existing) throw notFound('Tag')
    await tagRepository.delete(id)
  },
}
