import { z } from 'zod'

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'color must be a hex code like #8B5CF6')
    .default('#8B5CF6'),
})

export type CreateTagInput = z.infer<typeof CreateTagSchema>
