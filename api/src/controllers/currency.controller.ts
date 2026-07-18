import type { FastifyInstance } from 'fastify'
import { getRates } from '../services/currency.service.js'

export async function registerCurrencyController(app: FastifyInstance): Promise<void> {
  app.get('/currencies/rates', async (_req, reply) => {
    const rates = await getRates()
    return reply.send(rates)
  })
}
