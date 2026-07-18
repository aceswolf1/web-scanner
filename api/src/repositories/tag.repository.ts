import { prisma } from '../lib/prisma.js'

export const tagRepository = {
  async list() {
    return prisma.tag.findMany({ orderBy: { name: 'asc' } })
  },

  async findById(id: string) {
    return prisma.tag.findUnique({ where: { id } })
  },

  async findByName(name: string) {
    return prisma.tag.findUnique({ where: { name } })
  },

  async create(name: string, color: string) {
    return prisma.tag.create({ data: { name, color } })
  },

  async delete(id: string) {
    await prisma.tag.delete({ where: { id } })
  },
}
