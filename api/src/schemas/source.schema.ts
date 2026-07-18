import { z } from 'zod'

export const CurrencyEnum = z.enum([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'MXN',
  'COP',
])

export const CreateSourceSchema = z.object({
  url: z.string().url().max(2000),
  currency: CurrencyEnum.default('USD'),
  priceClass: z.string().max(200).optional().nullable(),
  cssRule: z.string().max(500).optional().nullable(),
  fatherClass: z.string().max(200).optional().nullable(),
  isMain: z.boolean().default(false),
  isDiscounted: z.boolean().default(false),
  isUsed: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
  matchIndex: z.number().int().min(0).max(50).default(0),
})

export const UpdateSourceSchema = z.object({
  url: z.string().url().max(2000).optional(),
  currency: CurrencyEnum.optional(),
  priceClass: z.string().max(200).optional().nullable(),
  cssRule: z.string().max(500).optional().nullable(),
  fatherClass: z.string().max(200).optional().nullable(),
  isMain: z.boolean().optional(),
  isDiscounted: z.boolean().optional(),
  isUsed: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
  matchIndex: z.number().int().min(0).max(50).optional(),
})

/**
 * Validates a "try before you save" scrape request from the AddSourceModal.
 * All selector fields are optional individually but at least one must be provided
 * to be useful — that's enforced inside the service, not the schema, so we can
 * return a structured error instead of a 400.
 *
 * `currency` is optional and only used to produce `currencyWarning` when the
 * detected currency conflicts with the expected one.
 * `matchIndex` selects which match to use as the primary `price` when multiple
 * elements match the selector.
 */
export const TestScrapeSchema = z.object({
  url: z.string().url().max(2000),
  priceClass: z.string().max(200).optional().nullable(),
  cssRule: z.string().max(500).optional().nullable(),
  fatherClass: z.string().max(200).optional().nullable(),
  currency: CurrencyEnum.optional().nullable(),
  matchIndex: z.number().int().min(0).max(50).optional(),
})

export type CreateSourceInput = z.infer<typeof CreateSourceSchema>
export type UpdateSourceInput = z.infer<typeof UpdateSourceSchema>
export type TestScrapeInput = z.infer<typeof TestScrapeSchema>
