// Re-export from api.types for convenience. Kept separate so consumers can
// `import type { Item } from '~/types/item.types'` cleanly.
export type { Item, Source, PricePoint, Tag, Currency } from './api.types'

export interface SparklinePoint {
  x: number
  y: number
}

export interface CreateItemFormState {
  name: string
  imageUrl: string | null
  uploadedFile: File | null
  tagIds: string[]
  sources: SourceFormState[]
}

export interface SourceFormState {
  url: string
  currency: Currency
  priceClass: string
  cssRule: string
  fatherClass: string
  isMain: boolean
  isDiscounted: boolean
  isUsed: boolean
}