/**
 * Same-origin, read-only proxy for product images: /storage/<bucket>/<key> → MinIO.
 *
 * Only GET/HEAD of object paths are forwarded, so the S3 API (uploads, listings,
 * admin) is never exposed — MinIO stays internal and serves via its public-read policy.
 */
const STORAGE_PREFIX = '/storage'
const READ_METHODS = new Set(['GET', 'HEAD'])
// /<bucket>/<key…> on the *normalized* path — never the root or a bare bucket (listings).
const OBJECT_PATH = /^\/[^/%]+\/[^/]/

export default defineEventHandler((event) => {
  if (!READ_METHODS.has(event.method)) {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const { storageInternalUrl } = useRuntimeConfig(event)
  const objectPath = event.path.slice(STORAGE_PREFIX.length) || '/'
  const target = new URL(`${storageInternalUrl.replace(/\/$/, '')}${objectPath}`)

  if (!OBJECT_PATH.test(target.pathname)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return proxyRequest(event, target.href)
})
