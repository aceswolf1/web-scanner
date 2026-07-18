import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { itemService } from '../services/item.service.js'
import { sourceService } from '../services/source.service.js'
import {
  CreateItemSchema,
  UpdateItemSchema,
  ListItemsQuerySchema,
} from '../schemas/item.schema.js'

export async function registerItemController(app: FastifyInstance): Promise<void> {
  // LIST
  app.get('/items', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = ListItemsQuerySchema.parse(req.query)
    const result = await itemService.list(query)
    return reply.send({ items: result.items, total: result.total })
  })

  // CREATE
  app.post('/items', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateItemSchema.parse(req.body)
    const item = await itemService.create(body)
    return reply.code(201).send({ item })
  })

  // GET BY ID (with sources + price history)
  app.get<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    const item = await itemService.getById(req.params.id)
    return reply.send({ item })
  })

  // PATCH
  app.patch<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    const body = UpdateItemSchema.parse(req.body)
    const item = await itemService.update(req.params.id, body)
    return reply.send({ item })
  })

  // DELETE
  app.delete<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    await itemService.delete(req.params.id)
    return reply.send({ success: true })
  })

  // TOGGLE FAVORITE
  app.post<{ Params: { id: string } }>(
    '/items/:id/favorite',
    async (req, reply) => {
      const item = await itemService.toggleFavorite(req.params.id)
      return reply.send({ item })
    }
  )

  // HISTORY (per-source time series)
  app.get<{ Params: { id: string } }>(
    '/items/:id/history',
    async (req, reply) => {
      const history = await itemService.getHistory(req.params.id)
      return reply.send(history)
    }
  )

  // TRIGGER SCRAPE
  app.post<{ Params: { id: string } }>(
    '/items/:id/scrape',
    async (req, reply) => {
      const result = await itemService.triggerScrape(req.params.id)
      return reply.send(result)
    }
  )
}
