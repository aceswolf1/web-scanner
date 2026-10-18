/** Lightweight container healthcheck — does not touch the API or render SSR. */
export default defineEventHandler(() => ({ status: 'ok' }))
