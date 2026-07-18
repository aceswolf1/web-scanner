/**
 * Resolve the API base URL for the current runtime.
 *
 * - Browser: public URL (http://localhost:4000) so the host browser can reach the mapped port.
 * - Server (SSR inside Docker): internal service hostname (http://api:4000) — `localhost`
 *   inside the frontend container is the frontend itself, not the API.
 */
export function useApiUrl(): string {
  const config = useRuntimeConfig()
  if (import.meta.server) {
    const internal = (config.apiInternalUrl as string | undefined)?.trim()
    if (internal) return internal
    // Sensible Docker Compose default when env is missing.
    return 'http://api:4000'
  }
  return config.public.apiUrl
}
