import {
  TagEnvelopeSchema,
  TagsResponseSchema,
  type Tag,
} from '~/types/api.types'

export function useTags() {
  const config = useRuntimeConfig()
  const store = useTagsStore()

  async function fetchTags(): Promise<Tag[]> {
    store.loading = true
    try {
      const raw = await $fetch<unknown>(`${useApiUrl()}/tags`)
      const { tags } = TagsResponseSchema.parse(raw)
      store.setTags(tags)
      return tags
    } finally {
      store.loading = false
    }
  }

  async function createTag(name: string, color: string): Promise<Tag> {
    const raw = await $fetch<unknown>(`${useApiUrl()}/tags`, {
      method: 'POST',
      body: { name, color },
    })
    const { tag } = TagEnvelopeSchema.parse(raw)
    store.upsertTag(tag)
    return tag
  }

  async function deleteTag(id: string): Promise<void> {
    await $fetch(`${useApiUrl()}/tags/${id}`, { method: 'DELETE' })
    store.removeTag(id)
  }

  return { fetchTags, createTag, deleteTag }
}