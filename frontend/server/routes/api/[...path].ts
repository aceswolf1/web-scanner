/**
 * Same-origin proxy: browser → /api/<path> → API service on the Docker network.
 *
 * Lets deployments publish only the frontend port (no CORS, API stays internal).
 * Scraper-only `/internal/*` endpoints are never reachable from outside.
 */
const API_PREFIX = '/api'
const BLOCKED_SEGMENT = 'internal'

/**
 * Checks the first segment of the *normalized* upstream path, so `..`, `%2e%2e`,
 * `//` and percent-encoded tricks can't smuggle a request onto a blocked route.
 */
function isAllowedUpstream(target: URL): boolean {
  const firstSegment = target.pathname.split('/')[1] ?? ''
  if (firstSegment === '' || firstSegment.includes('%')) return target.pathname === '/'
  return firstSegment.toLowerCase() !== BLOCKED_SEGMENT
}

export default defineEventHandler((event) => {
  const { apiInternalUrl } = useRuntimeConfig(event)
  const upstreamPath = event.path.slice(API_PREFIX.length) || '/'
  const target = new URL(`${apiInternalUrl.replace(/\/$/, '')}${upstreamPath}`)

  if (!isAllowedUpstream(target)) {
    throw createError({ statusCode: 404, statusMessage: 'Route not found' })
  }

  return proxyRequest(event, target.href)
})
