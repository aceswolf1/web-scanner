import type { FastifyInstance } from 'fastify'
import { recipeService } from '../services/recipe.service.js'
import { CreateRecipeSchema } from '../schemas/recipe.schema.js'

export async function registerRecipeController(app: FastifyInstance): Promise<void> {
  // LIST
  app.get('/recipes', async (_req, reply) => {
    const recipes = await recipeService.list()
    return reply.send({ recipes })
  })

  // CREATE
  app.post('/recipes', async (req, reply) => {
    const body = CreateRecipeSchema.parse(req.body)
    const recipe = await recipeService.create(body)
    return reply.code(201).send({ recipe })
  })

  // DELETE
  app.delete<{ Params: { id: string } }>('/recipes/:id', async (req, reply) => {
    await recipeService.delete(req.params.id)
    return reply.send({ success: true })
  })
}
