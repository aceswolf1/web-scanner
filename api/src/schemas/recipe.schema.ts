import { z } from 'zod'

export const CreateRecipeSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(300).optional().nullable(),
  priceClass: z.string().max(200).optional().nullable(),
  cssRule: z.string().max(500).optional().nullable(),
  fatherClass: z.string().max(200).optional().nullable(),
})

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>
