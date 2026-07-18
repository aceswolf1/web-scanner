import { defineStore } from 'pinia'
import type { Tag } from '~/types/api.types'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])
  const loading = ref(false)

  function setTags(next: Tag[]): void {
    tags.value = next
  }

  function upsertTag(tag: Tag): void {
    const idx = tags.value.findIndex((t) => t.id === tag.id)
    if (idx >= 0) {
      tags.value.splice(idx, 1, tag)
    } else {
      tags.value.push(tag)
    }
  }

  function removeTag(id: string): void {
    tags.value = tags.value.filter((t) => t.id !== id)
  }

  return { tags, loading, setTags, upsertTag, removeTag }
})