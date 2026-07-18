import { z } from 'zod'
import { CreateSourceSchema, UpdateSourceSchema } from './source.schema.js'

export const CreateItemSchema = z.object({
  name: z.string().min(1).max(200),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  tagIds: z.array(z.string().min(1)).default([]),
  sources: z.array(CreateSourceSchema).min(1, 'At least one source is required'),
})

export const UpdateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  isFavorite: z.boolean().optional(),
  tagIds: z.array(z.string().min(1)).optional(),
})

export const ListItemsQuerySchema = z.object({
  search: z.string().optional(),
  favorite: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

export const AddSourceToItemSchema = z.object({
  source: CreateSourceSchema,
})

export const UpdateSourceForItemSchema = z.object({
  source: UpdateSourceSchema,
})

export const ScrapeResultSchema = z.object({
  sourceId: z.string().min(1),
  price: z.number().finite().nonnegative().optional().nullable(),
  warning: z.string().max(1000).optional().nullable(),
  error: z.string().max(2000).optional().nullable(),
})

export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>
export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>
export type ScrapeResultInput = z.infer<typeof ScrapeResultSchema>
