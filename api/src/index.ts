import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { ZodError } from 'zod'
import { prisma } from './lib/prisma.js'
import { ensureBucket } from './lib/minio.js'
import { HttpError } from './lib/errors.js'
import { registerItemController } from './controllers/item.controller.js'
import { registerSourceController } from './controllers/source.controller.js'
import { registerTagController } from './controllers/tag.controller.js'
import { registerScrapeController } from './controllers/scrape.controller.js'
import { registerCurrencyController } from './controllers/currency.controller.js'
import { registerImageController } from './controllers/image.controller.js'
import { registerRecipeController } from './controllers/recipe.controller.js'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
})

// Plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
})

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}))

// All controllers
await registerItemController(app)
await registerSourceController(app)
await registerTagController(app)
await registerScrapeController(app)
await registerCurrencyController(app)
await registerImageController(app)
await registerRecipeController(app)

// Centralized error handler — every error path renders the same envelope.
app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation failed',
      statusCode: 400,
      details: err.flatten(),
    })
  }
  if (err instanceof HttpError) {
    return reply.code(err.statusCode).send({
      error: err.message,
      statusCode: err.statusCode,
      ...(err.details !== undefined && { details: err.details }),
    })
  }
  // Fastify validation errors are shaped like { validation, statusCode }
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return reply.code(err.statusCode).send({
      error: err.message,
      statusCode: err.statusCode,
    })
  }
  app.log.error({ err }, 'Unhandled error')
  return reply.code(500).send({
    error: 'Internal server error',
    statusCode: 500,
  })
})

// 404
app.setNotFoundHandler((_req, reply) => {
  return reply.code(404).send({
    error: 'Route not found',
    statusCode: 404,
  })
})

// Verify DB + MinIO connectivity before listening.
async function bootstrap(): Promise<void> {
  try {
    await prisma.$executeRaw`SELECT 1`
    app.log.info('Database connection verified')
  } catch (err) {
    app.log.error({ err }, 'Failed to connect to database')
    process.exit(1)
  }

  try {
    await ensureBucket()
    app.log.info(`MinIO bucket "${process.env.MINIO_BUCKET ?? 'web-scanner-images'}" ready`)
  } catch (err) {
    app.log.warn({ err }, 'MinIO bucket ensure failed (continuing — may be transient)')
  }

  const port = Number(process.env.PORT ?? 4000)
  await app.listen({ port, host: '0.0.0.0' })
  app.log.info(`API listening on port ${port}`)
}

bootstrap().catch((err) => {
  app.log.error({ err }, 'Failed to start API')
  process.exit(1)
})

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  app.log.info(`Received ${signal}, shutting down...`)
  try {
    await app.close()
    await prisma.$disconnect()
  } catch (err) {
    app.log.error({ err }, 'Error during shutdown')
  } finally {
    process.exit(0)
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
