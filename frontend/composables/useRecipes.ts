import {
  RecipeEnvelopeSchema,
  RecipesResponseSchema,
  type SelectorRecipe,
} from '~/types/api.types'

export interface CreateRecipeInput {
  name: string
  domain?: string | null
  priceClass?: string | null
  cssRule?: string | null
  fatherClass?: string | null
}

/**
 * Selector-recipe CRUD. Recipes store reusable CSS selector combos so users
 * can re-apply shop-specific scrape configs without retyping fields.
 */
export function useRecipes() {
  const recipes = ref<SelectorRecipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRecipes(domain?: string | null): Promise<SelectorRecipe[]> {
    loading.value = true
    error.value = null
    try {
      // API currently returns the full list; domain filter is applied client-side.
      const raw = await $fetch<unknown>(`${useApiUrl()}/recipes`)
      const parsed = RecipesResponseSchema.parse(raw)
      const domainKey = domain?.trim().toLowerCase() ?? ''
      const next =
        domainKey.length > 0
          ? sortRecipesForDomain(parsed.recipes, domainKey)
          : parsed.recipes
      recipes.value = next
      return next
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load recipes'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Prefer same-domain recipes first, then undomain'd, then others. */
  function sortRecipesForDomain(
    list: SelectorRecipe[],
    domainKey: string,
  ): SelectorRecipe[] {
    const score = (r: SelectorRecipe): number => {
      const d = r.domain?.trim().toLowerCase() ?? ''
      if (!d) return 1
      if (d === domainKey || domainKey.endsWith(`.${d}`) || d.endsWith(`.${domainKey}`)) {
        return 0
      }
      return 2
    }
    return [...list].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name))
  }

  async function createRecipe(input: CreateRecipeInput): Promise<SelectorRecipe> {
    const body = {
      name: input.name.trim(),
      domain: input.domain?.trim() || null,
      priceClass: input.priceClass?.trim() || null,
      cssRule: input.cssRule?.trim() || null,
      fatherClass: input.fatherClass?.trim() || null,
    }
    const raw = await $fetch<unknown>(`${useApiUrl()}/recipes`, {
      method: 'POST',
      body,
    })
    const { recipe } = RecipeEnvelopeSchema.parse(raw)
    recipes.value = [recipe, ...recipes.value.filter((r) => r.id !== recipe.id)]
    return recipe
  }

  async function deleteRecipe(id: string): Promise<void> {
    await $fetch(`${useApiUrl()}/recipes/${id}`, { method: 'DELETE' })
    recipes.value = recipes.value.filter((r) => r.id !== id)
  }

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    createRecipe,
    deleteRecipe,
  }
}

/** Best-effort hostname extraction for recipe domain filtering. */
export function extractHostname(url: string): string | null {
  try {
    const trimmed = url.trim()
    if (!trimmed) return null
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withProtocol).hostname || null
  } catch {
    return null
  }
}
