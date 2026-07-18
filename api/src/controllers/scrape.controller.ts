import type { FastifyInstance } from 'fastify'
import { scrapeService } from '../services/scrape.service.js'
import { ScrapeResultSchema } from '../schemas/item.schema.js'

export async function registerScrapeController(app: FastifyInstance): Promise<void> {
  // POST /internal/scrape-result — called by the Python scraper.
  app.post('/internal/scrape-result', async (req, reply) => {
    const body = ScrapeResultSchema.parse(req.body)
    const result = await scrapeService.recordResult(body)
    return reply.code(200).send(result)
  })
}
