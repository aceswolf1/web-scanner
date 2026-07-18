import { z } from 'zod'

// ── Currency enum (must match backend) ────────────────────────────────────────
export const CurrencyEnum = z.enum([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'MXN',
  'COP',
])
export type Currency = z.infer<typeof CurrencyEnum>

// ── Tag ───────────────────────────────────────────────────────────────────────
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
})
export type Tag = z.infer<typeof TagSchema>

// ── Source ────────────────────────────────────────────────────────────────────
// List endpoint returns slim history points ({ price, scrapedAt }) for sparklines;
// detail can include id/sourceId. Keep those optional so both shapes validate.
export const PricePointSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string().optional(),
  price: z.number(),
  scrapedAt: z.union([z.string(), z.date()]).transform((v) =>
    v instanceof Date ? v.toISOString() : v,
  ),
})
export type PricePoint = z.infer<typeof PricePointSchema>

export const SourceSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  url: z.string(),
  currency: CurrencyEnum,
  priceClass: z.string().nullable().optional(),
  cssRule: z.string().nullable().optional(),
  fatherClass: z.string().nullable().optional(),
  isMain: z.boolean(),
  isDiscounted: z.boolean().optional().default(false),
  isUsed: z.boolean().optional().default(false),
  currentPrice: z.number().nullable(),
  lastScrapedAt: z
    .union([z.string(), z.date(), z.null()])
    .transform((v) => (v instanceof Date ? v.toISOString() : v))
    .nullable(),
  lastError: z.string().nullable(),
  priceHistory: z.array(PricePointSchema).optional().default([]),
  // pricing-evolution (W1 contracts; optional so older payloads still parse)
  notes: z.string().nullable().optional(),
  matchIndex: z.number().int().nonnegative().optional().default(0),
  scrapeSuccessCount: z.number().int().nonnegative().optional().default(0),
  scrapeFailCount: z.number().int().nonnegative().optional().default(0),
  lastSuccessAt: z
    .union([z.string(), z.date(), z.null()])
    .transform((v) => (v instanceof Date ? v.toISOString() : v))
    .nullable()
    .optional(),
  detectedCurrency: z.string().nullable().optional(),
})
export type Source = z.infer<typeof SourceSchema>

// ── Selector recipes ─────────────────────────────────────────────────────────
export const SelectorRecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().nullable().optional(),
  priceClass: z.string().nullable().optional(),
  cssRule: z.string().nullable().optional(),
  fatherClass: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).transform((v) =>
    v instanceof Date ? v.toISOString() : v,
  ),
  updatedAt: z.union([z.string(), z.date()]).transform((v) =>
    v instanceof Date ? v.toISOString() : v,
  ),
})
export type SelectorRecipe = z.infer<typeof SelectorRecipeSchema>

export const RecipesResponseSchema = z.object({
  recipes: z.array(SelectorRecipeSchema),
})
export type RecipesResponse = z.infer<typeof RecipesResponseSchema>

export const RecipeEnvelopeSchema = z.object({
  recipe: SelectorRecipeSchema,
})
export type RecipeEnvelope = z.infer<typeof RecipeEnvelopeSchema>

// ── Test-scrape multi-match ──────────────────────────────────────────────────
export const ScrapeMatchSchema = z.object({
  index: z.number().int().nonnegative(),
  text: z.string(),
  price: z.number().nullable(),
})
export type ScrapeMatch = z.infer<typeof ScrapeMatchSchema>

export const TestScrapeResultSchema = z.object({
  price: z.number().nullable(),
  count: z.number(),
  warning: z.string().nullable(),
  error: z.string().nullable(),
  matches: z.array(ScrapeMatchSchema).optional(),
  detectedCurrency: z.string().nullable().optional(),
  currencyWarning: z.string().nullable().optional(),
})
export type TestScrapeResult = z.infer<typeof TestScrapeResultSchema>

// ── Item ──────────────────────────────────────────────────────────────────────
// API includes join columns (itemId/tagId) alongside nested tag — accept and strip.
export const ItemTagRefSchema = z
  .object({
    tag: TagSchema,
  })
  .passthrough()
export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  isFavorite: z.boolean(),
  createdAt: z.union([z.string(), z.date()]).transform((v) =>
    v instanceof Date ? v.toISOString() : v,
  ),
  updatedAt: z.union([z.string(), z.date()]).transform((v) =>
    v instanceof Date ? v.toISOString() : v,
  ),
  tags: z.array(ItemTagRefSchema),
  sources: z.array(SourceSchema),
})
export type Item = z.infer<typeof ItemSchema>

// ── History entry (per-source time series) ────────────────────────────────────
export const HistoryPointSchema = z.object({
  price: z.number(),
  scrapedAt: z.string(),
})
export const HistorySourceSchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string(),
  currency: CurrencyEnum,
  points: z.array(HistoryPointSchema),
})
export const HistoryResponseSchema = z.object({
  history: z.array(HistorySourceSchema),
})
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>

// ── List response ────────────────────────────────────────────────────────────
export const ListItemsResponseSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number(),
})
export type ListItemsResponse = z.infer<typeof ListItemsResponseSchema>

export const TagsResponseSchema = z.object({
  tags: z.array(TagSchema),
})
export type TagsResponse = z.infer<typeof TagsResponseSchema>

export const ItemEnvelopeSchema = z.object({ item: ItemSchema })
export type ItemEnvelope = z.infer<typeof ItemEnvelopeSchema>

export const SourceEnvelopeSchema = z.object({ source: SourceSchema })
export type SourceEnvelope = z.infer<typeof SourceEnvelopeSchema>

export const TagEnvelopeSchema = z.object({ tag: TagSchema })
export type TagEnvelope = z.infer<typeof TagEnvelopeSchema>

export const ScrapeResponseSchema = z.object({
  queued: z.boolean(),
  sourceIds: z.array(z.string()),
})
export type ScrapeResponse = z.infer<typeof ScrapeResponseSchema>

// ── Currency rates (frankfurter) ─────────────────────────────────────────────
export const RatesResponseSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})
export type RatesResponse = z.infer<typeof RatesResponseSchema>

// ── Image upload ─────────────────────────────────────────────────────────────
export const ImageUploadResponseSchema = z.object({
  url: z.string(),
})
export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>