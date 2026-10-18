import { Client } from 'minio'

// Docker-internal host used by the API process to talk to MinIO (e.g. "storage").
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'storage'
const MINIO_PORT = Number(process.env.MINIO_PORT ?? 9000)

// Browser-facing base URL. Must be reachable from the user's machine
// (e.g. http://localhost:9000), NOT the Docker service name.
const MINIO_PUBLIC_URL = (
  process.env.MINIO_PUBLIC_URL ??
  process.env.NUXT_PUBLIC_STORAGE_URL ??
  'http://localhost:9000'
).replace(/\/$/, '')

export const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin123',
})

export const BUCKET = process.env.MINIO_BUCKET ?? 'web-scanner-images'

/** Public base used when returning image URLs to the browser. */
export const STORAGE_URL = MINIO_PUBLIC_URL

/**
 * Rewrite legacy Docker-internal image URLs so old rows still load in the browser.
 * e.g. http://storage:9000/bucket/key → http://localhost:9000/bucket/key
 */
export function toPublicImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'storage' || parsed.hostname === MINIO_ENDPOINT) {
      return `${STORAGE_URL}${parsed.pathname}${parsed.search}`
    }
  } catch {
    // leave non-URL strings alone
  }
  return url
}

/** Anonymous read-only access to objects — browsers load images without signing. */
const PUBLIC_READ_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${BUCKET}/*`],
    },
  ],
})

/**
 * Ensures the bucket exists and is publicly readable. Called once on startup.
 * Idempotent — replaces the one-shot `storage-init` container in deployments.
 */
export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1')
  }
  await minioClient.setBucketPolicy(BUCKET, PUBLIC_READ_POLICY)
}
