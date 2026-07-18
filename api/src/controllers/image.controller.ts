import type { FastifyInstance, FastifyRequest } from 'fastify'
import { Readable } from 'node:stream'
import { minioClient, BUCKET, STORAGE_URL } from '../lib/minio.js'
import { badRequest } from '../lib/errors.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/svg+xml':
      return 'svg'
    default:
      return 'bin'
  }
}

export async function registerImageController(app: FastifyInstance): Promise<void> {
  app.post('/images/upload', async (req: FastifyRequest, reply) => {
    const file = await req.file()
    if (!file) throw badRequest('Missing "file" field in multipart body')

    if (file.mimetype && !ALLOWED_MIME.has(file.mimetype)) {
      throw badRequest(`Unsupported MIME type: ${file.mimetype}`)
    }

    // Generate a stable, collision-resistant object key.
    const ext = extFromMime(file.mimetype ?? '')
    const objectKey = `${Date.now()}-${crypto.randomUUID()}.${ext}`

    // Convert the Fastify multipart stream into a Node Readable for the MinIO client.
    const buffer = await file.toBuffer()
    if (buffer.length > MAX_FILE_SIZE) {
      throw badRequest(
        `File too large (${buffer.length} bytes). Max is ${MAX_FILE_SIZE}.`
      )
    }

    await minioClient.putObject(
      BUCKET,
      objectKey,
      Readable.from(buffer),
      buffer.length,
      { 'Content-Type': file.mimetype ?? 'application/octet-stream' }
    )

    const url = `${STORAGE_URL}/${BUCKET}/${objectKey}`
    return reply.code(201).send({ url })
  })
}
