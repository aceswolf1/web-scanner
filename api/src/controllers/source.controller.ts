import type { FastifyInstance } from 'fastify'
import { sourceService } from '../services/source.service.js'
import { sourceRepository } from '../repositories/source.repository.js'
import { priceHistoryRepository } from '../repositories/priceHistory.repository.js'
import { testScrape } from '../services/test-scrape.service.js'
import {
  CreateSourceSchema,
  UpdateSourceSchema,
  TestScrapeSchema,
} from '../schemas/source.schema.js'
import { CreateItemSchema } from '../schemas/item.schema.js'

export async function registerSourceController(app: FastifyInstance): Promise<void> {
  // CREATE — source belongs to an item
  app.post<{ Params: { id: string } }>(
    '/items/:id/sources',
    async (req, reply) => {
      const body = CreateSourceSchema.parse(req.body)
      const source = await sourceService.create(req.params.id, body)
      return reply.code(201).send({ source })
    }
  )

  // PATCH
  app.patch<{ Params: { id: string } }>(
    '/sources/:id',
    async (req, reply) => {
      const body = UpdateSourceSchema.parse(req.body)
      const source = await sourceService.update(req.params.id, body)
      return reply.send({ source })
    }
  )

  // DELETE
  app.delete<{ Params: { id: string } }>(
    '/sources/:id',
    async (req, reply) => {
      await sourceService.delete(req.params.id)
      return reply.send({ success: true })
    }
  )

  // SET MAIN (atomic clear-others)
  app.post<{ Params: { id: string } }>(
    '/sources/:id/main',
    async (req, reply) => {
      const source = await sourceService.setMain(req.params.id)
      return reply.send({ source })
    }
  )

  // STATELESS TEST — try a URL+selector combo without persisting anything.
  // Returns { price, count, warning, error, matches?, detectedCurrency?, currencyWarning? }
  app.post('/sources/test', async (req, reply) => {
    const body = TestScrapeSchema.parse(req.body)
    const result = await testScrape(body)
    return reply.send(result)
  })

  // PER-SOURCE SCRAPE TRIGGER — fetches and parses the price inline using cheerio,
  // then persists the result (or error) directly to the source record.
  // Honors source.matchIndex and updates health counters + detectedCurrency.
  app.post<{ Params: { id: string } }>(
    '/sources/:id/scrape',
    async (req, reply) => {
      const source = await sourceRepository.findById(req.params.id)
      if (!source) return reply.code(404).send({ error: 'Source not found' })

      const result = await testScrape({
        url: source.url,
        priceClass: source.priceClass,
        cssRule: source.cssRule,
        fatherClass: source.fatherClass,
        currency: source.currency,
        matchIndex: source.matchIndex,
      })

      if (result.price !== null) {
        await priceHistoryRepository.recordScrape(source.id, result.price)
        await sourceRepository.update(source.id, {
          lastError: null,
          lastSuccessAt: new Date(),
          incrementSuccess: true,
          ...(result.detectedCurrency !== undefined && {
            detectedCurrency: result.detectedCurrency ?? null,
          }),
        })
      } else {
        await sourceRepository.update(source.id, {
          lastScrapedAt: new Date(),
          lastError: result.error ?? 'No price found',
          incrementFail: true,
          ...(result.detectedCurrency !== undefined && {
            detectedCurrency: result.detectedCurrency ?? null,
          }),
        })
      }

      return reply.send({
        price: result.price,
        warning: result.warning,
        error: result.error,
        matches: result.matches,
        detectedCurrency: result.detectedCurrency ?? null,
        currencyWarning: result.currencyWarning ?? null,
      })
    }
  )

  // Unused export to satisfy linter about CreateItemSchema re-export in this file's neighbor.
  void CreateItemSchema
}
