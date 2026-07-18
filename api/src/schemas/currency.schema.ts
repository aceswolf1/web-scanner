import { z } from 'zod'

// open.er-api.com response shape (170+ currencies, no API key, includes COP)
const OpenErApiSchema = z.object({
  result: z.string(),
  base_code: z.string().length(3),
  time_last_update_utc: z.string().optional(),
  rates: z.record(z.string(), z.number()),
})

// Internal canonical shape used by the rest of the app
export const FrankfurterLatestSchema = z.object({
  base: z.string().length(3),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})

export type FrankfurterLatest = z.infer<typeof FrankfurterLatestSchema>

export function parseOpenErApi(raw: unknown): FrankfurterLatest {
  const parsed = OpenErApiSchema.parse(raw)
  return {
    base: parsed.base_code,
    date: parsed.time_last_update_utc?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    rates: parsed.rates,
  }
}
