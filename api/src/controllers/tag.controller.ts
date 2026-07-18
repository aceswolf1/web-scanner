import type { FastifyInstance } from 'fastify'
import { tagService } from '../services/tag.service.js'
import { CreateTagSchema } from '../schemas/tag.schema.js'

export async function registerTagController(app: FastifyInstance): Promise<void> {
  app.get('/tags', async (_req, reply) => {
    const tags = await tagService.list()
    return reply.send({ tags })
  })

  app.post('/tags', async (req, reply) => {
    const body = CreateTagSchema.parse(req.body)
    const tag = await tagService.create(body)
    return reply.code(201).send({ tag })
  })

  app.delete<{ Params: { id: string } }>('/tags/:id', async (req, reply) => {
    await tagService.delete(req.params.id)
    return reply.send({ success: true })
  })
}
