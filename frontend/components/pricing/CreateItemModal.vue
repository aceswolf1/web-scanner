<template>
  <Dialog
    :visible="visible"
    @update:visible="(v) => $emit('update:visible', v)"
    modal
    :draggable="false"
    :style="{ width: '720px', maxWidth: '95vw' }"
    :pt="{ root: { class: 'rounded-2xl overflow-hidden' } }"
  >
    <template #container>
      <div
        class="flex flex-col max-h-[90vh] rounded-2xl overflow-hidden border"
        :style="{ background: 'var(--card)', borderColor: 'var(--border)' }"
      >
        <header class="flex items-center justify-between px-6 py-4 border-b" :style="{ borderColor: 'var(--border)' }">
          <div>
            <h2 class="font-brand text-lg font-bold" style="color: var(--foreground)">
              {{ existing ? 'Edit item' : 'Add new product' }}
            </h2>
            <p class="text-xs font-mono mt-0.5" style="color: var(--muted-foreground)">
              Track prices across multiple sources.
            </p>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30"
            :style="{ color: 'var(--muted-foreground)' }"
            @click="close"
          >
            <i class="pi pi-times text-sm" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <!-- Name -->
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--foreground)">
              Name <span style="color: rgb(248 113 113)">*</span>
            </label>
            <InputText v-model="form.name" placeholder="e.g. Sony WH-1000XM5" class="w-full" />
            <p v-if="errors.name" class="text-[11px] mt-1" style="color: rgb(248 113 113)">
              {{ errors.name }}
            </p>
          </div>

          <!-- Image -->
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--foreground)">Image</label>
            <TabView>
              <TabPanel header="URL">
                <InputText
                  v-model="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  class="w-full"
                />
              </TabPanel>
              <TabPanel header="Upload">
                <div
                  class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                  :class="dragOver ? 'border-primary bg-primary/5' : ''"
                  :style="{ borderColor: dragOver ? 'var(--primary)' : 'var(--border)' }"
                  @dragover.prevent="dragOver = true"
                  @dragleave="dragOver = false"
                  @drop.prevent="onDrop"
                  @click="fileInput?.click()"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onFileChange"
                  />
                  <i class="pi pi-cloud-upload text-2xl" style="color: var(--muted-foreground)" />
                  <p class="text-sm mt-2" style="color: var(--foreground)">
                    {{ uploadedFile ? uploadedFile.name : 'Click or drop an image' }}
                  </p>
                  <p class="text-[10px] font-mono mt-1" style="color: var(--muted-foreground)">
                    Max 10 MB · JPG, PNG, WebP, GIF, SVG
                  </p>
                </div>
              </TabPanel>
            </TabView>
          </div>

          <!-- Tags -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium" style="color: var(--foreground)">Tags</label>
              <button
                type="button"
                class="text-xs px-2.5 h-7 rounded-md border flex items-center gap-1"
                :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
                @click="createTagVisible = true"
              >
                <i class="pi pi-plus text-[10px]" />
                New tag
              </button>
            </div>
            <MultiSelect
              v-model="selectedTagIds"
              :options="tags"
              option-label="name"
              option-value="id"
              placeholder="Pick tags"
              display="chip"
              class="w-full"
            />
          </div>

          <CreateTagModal
            v-model:visible="createTagVisible"
            @created="onTagCreated"
          />

          <!-- Sources -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-medium" style="color: var(--foreground)">
                Sources <span style="color: rgb(248 113 113)">*</span>
              </label>
              <button
                type="button"
                class="text-xs px-2.5 h-7 rounded-md border flex items-center gap-1"
                :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
                @click="addSource"
              >
                <i class="pi pi-plus text-[10px]" />
                Add Source
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(src, idx) in form.sources"
                :key="idx"
                class="rounded-xl border p-4 space-y-3"
                :style="{ background: 'var(--background)', borderColor: 'var(--border)' }"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2">
                      <RadioButton
                        :input-id="`main-${idx}`"
                        :name="`main-radio`"
                        :value="idx"
                        :model-value="src.isMain ? idx : -1"
                        @update:model-value="onSetMain(idx)"
                      />
                      <label :for="`main-${idx}`" class="text-xs font-mono cursor-pointer" style="color: var(--foreground)">
                        Main price
                      </label>
                    </div>
                    <div class="flex items-center gap-2">
                      <Checkbox
                        v-model="src.isDiscounted"
                        binary
                        :input-id="`discounted-${idx}`"
                      />
                      <label
                        :for="`discounted-${idx}`"
                        class="text-xs font-mono cursor-pointer"
                        style="color: var(--foreground)"
                      >
                        Price discounted
                      </label>
                    </div>
                    <div class="flex items-center gap-2">
                      <Checkbox
                        v-model="src.isUsed"
                        binary
                        :input-id="`used-${idx}`"
                      />
                      <label
                        :for="`used-${idx}`"
                        class="text-xs font-mono cursor-pointer"
                        style="color: var(--foreground)"
                      >
                        Used
                      </label>
                    </div>
                  </div>
                  <button
                    v-if="form.sources.length > 1"
                    type="button"
                    class="text-xs px-2 py-1 rounded-md hover:bg-red-400/10"
                    style="color: rgb(248 113 113)"
                    @click="removeSource(idx)"
                  >
                    <i class="pi pi-trash text-xs" />
                  </button>
                </div>

                <RecipePicker
                  :key="`recipe-picker-${idx}-${recipeListVersion}`"
                  :url="src.url"
                  :can-create="Boolean(src.cssRule.trim() || src.priceClass.trim() || src.fatherClass.trim())"
                  :show-create="true"
                  @apply="(recipe) => applyRecipe(idx, recipe)"
                  @create="openCreateRecipe(idx)"
                />

                <InputText v-model="src.url" placeholder="https://…" class="w-full" />

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <Select
                      v-model="src.currency"
                      :options="currencyOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Currency"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
                      Class name only — no dot. e.g. <code>price-tag</code>
                    </small>
                    <InputText
                      v-model="src.priceClass"
                      placeholder="Price class (e.g. price-value)"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
                      Class name only — no dot. e.g. <code>product-card</code>
                    </small>
                    <InputText
                      v-model="src.fatherClass"
                      placeholder="Father class (optional)"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
                      Full CSS selector — use dots for classes. e.g. <code>.product .price</code>
                    </small>
                    <InputText
                      v-model="src.cssRule"
                      placeholder="CSS rule (optional)"
                    />
                  </div>
                </div>

                <!-- Scan row -->
                <div class="flex items-center gap-2 pt-1">
                  <Button
                    label="Scan"
                    icon="pi pi-search"
                    size="small"
                    severity="secondary"
                    :loading="scanStates[idx]?.loading"
                    @click="runScan(idx)"
                  />
                  <span
                    v-if="scanStates[idx]?.result"
                    class="text-[11px] flex items-center gap-1"
                    :style="
                      selectedPriceFor(idx) !== null
                        ? 'color: rgb(22 163 74)'
                        : 'color: rgb(248 113 113)'
                    "
                  >
                    <i
                      :class="
                        selectedPriceFor(idx) !== null
                          ? 'pi pi-check-circle'
                          : 'pi pi-exclamation-triangle'
                      "
                    />
                    <template v-if="selectedPriceFor(idx) !== null">
                      Found: {{ selectedPriceFor(idx) }}
                      <span v-if="scanStates[idx]!.result!.warning" class="opacity-80">
                        · {{ scanStates[idx]!.result!.warning }}
                      </span>
                      <span
                        v-if="(scanStates[idx]!.result!.matches?.length ?? 0) > 1"
                        class="opacity-80"
                      >
                        · match #{{ src.matchIndex }}
                      </span>
                    </template>
                    <template v-else>
                      {{ scanStates[idx]!.result!.error ?? 'No value found' }}
                    </template>
                  </span>
                  <span
                    v-else-if="scanStates[idx]?.error"
                    class="text-[11px] flex items-center gap-1"
                    style="color: rgb(248 113 113)"
                  >
                    <i class="pi pi-exclamation-triangle" />
                    {{ scanStates[idx]!.error }}
                  </span>
                </div>

                <MatchPicker
                  v-if="(scanStates[idx]?.result?.matches?.length ?? 0) > 1"
                  v-model="src.matchIndex"
                  :matches="scanStates[idx]!.result!.matches!"
                  :id-prefix="`create-item-${idx}`"
                />

                <CurrencyScanWarning
                  :currency-warning="scanStates[idx]?.result?.currencyWarning"
                  :detected-currency="scanStates[idx]?.result?.detectedCurrency"
                  :selected-currency="src.currency"
                />
              </div>
            </div>
          </div>

          <!-- Warning toast for form-level issues -->
          <div
            v-if="warning"
            class="rounded-lg px-3 py-2 text-xs flex items-start gap-2"
            style="background: rgba(245,158,11,0.12); color: #F59E0B"
          >
            <i class="pi pi-exclamation-triangle mt-0.5" />
            <span>{{ warning }}</span>
          </div>
        </div>

        <footer class="flex items-center justify-end gap-2 px-6 py-4 border-t" :style="{ borderColor: 'var(--border)' }">
          <button
            type="button"
            class="px-4 h-10 rounded-lg border text-sm font-medium"
            :style="{ borderColor: 'var(--border)', color: 'var(--foreground)' }"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 h-10 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style="background: linear-gradient(135deg, #8B5CF6, #7C3AED)"
            :disabled="!canSubmit || submitting"
            @click="onSubmit"
          >
            <i v-if="submitting" class="pi pi-spin pi-spinner mr-1.5 text-xs" />
            {{ existing ? 'Save' : 'Create' }}
          </button>
        </footer>
      </div>
    </template>
  </Dialog>

  <CreateRecipeModal
    v-model:visible="createRecipeVisible"
    :url="recipeDraft?.url"
    :price-class="recipeDraft?.priceClass"
    :css-rule="recipeDraft?.cssRule"
    :father-class="recipeDraft?.fatherClass"
    @created="onRecipeCreated"
  />
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import type { Tag, Currency, SelectorRecipe } from '~/types/api.types'
import { ImageUploadResponseSchema } from '~/types/api.types'
import { CURRENCY_OPTIONS } from '~/utils/currencyOptions'
import type { TestScrapeResult } from '~/composables/useSources'

interface SourceDraft {
  id?: string
  url: string
  currency: Currency
  priceClass: string
  cssRule: string
  fatherClass: string
  isMain: boolean
  isDiscounted: boolean
  isUsed: boolean
  matchIndex: number
}

const props = defineProps<{
  visible: boolean
  tags: Tag[]
  existing?: {
    id: string
    name: string
    imageUrl: string | null
    tagIds: string[]
    sources?: Array<{
      id?: string
      url: string
      currency: Currency
      priceClass?: string | null
      cssRule?: string | null
      fatherClass?: string | null
      isMain: boolean
      isDiscounted?: boolean
      isUsed?: boolean
      matchIndex?: number
    }>
  } | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [
    payload: {
      name: string
      imageUrl: string | null
      tagIds: string[]
      sources: SourceDraft[]
    },
  ]
  uploadImage: [file: File]
}>()

const toast = useToast()
const { testScrape } = useSources()

const currencyOptions = CURRENCY_OPTIONS.map((c) => ({ label: c, value: c }))

const form = reactive<{ name: string; sources: SourceDraft[] }>({
  name: '',
  sources: [makeBlankSource(true)],
})

const imageUrl = ref<string>('')
const uploadedFile = ref<File | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedTagIds = ref<string[]>([])
const createTagVisible = ref(false)
const createRecipeVisible = ref(false)
const recipeSourceIdx = ref<number | null>(null)
const recipeListVersion = ref(0)
const warning = ref<string | null>(null)
const submitting = ref(false)

const errors = reactive<{ name: string }>({ name: '' })

interface ScanState {
  loading: boolean
  result: TestScrapeResult | null
  error: string | null
}

// Per-source-row scan state, keyed by source index.
const scanStates = ref<Record<number, ScanState>>({})

const recipeDraft = computed(() => {
  if (recipeSourceIdx.value === null) return null
  return form.sources[recipeSourceIdx.value] ?? null
})

function ensureScanState(idx: number): ScanState {
  if (!scanStates.value[idx]) {
    scanStates.value = {
      ...scanStates.value,
      [idx]: { loading: false, result: null, error: null },
    }
  }
  return scanStates.value[idx]!
}

function selectedPriceFor(idx: number): number | null {
  const state = scanStates.value[idx]
  const src = form.sources[idx]
  if (!state?.result) return null
  const matches = state.result.matches
  if (matches && matches.length > 0 && src) {
    const picked = matches.find((m) => m.index === src.matchIndex) ?? matches[0]
    if (picked && picked.price !== null) return picked.price
  }
  return state.result.price
}

async function runScan(idx: number): Promise<void> {
  const src = form.sources[idx]
  if (!src) return
  if (!src.url.trim()) {
    toast.add({ severity: 'warn', summary: 'Enter a URL first', life: 2500 })
    return
  }
  const state = ensureScanState(idx)
  scanStates.value = {
    ...scanStates.value,
    [idx]: { loading: true, result: null, error: null },
  }
  try {
    const result = await testScrape({
      url: src.url.trim(),
      priceClass: src.priceClass.trim() || null,
      cssRule: src.cssRule.trim() || null,
      fatherClass: src.fatherClass.trim() || null,
      currency: src.currency,
      matchIndex: src.matchIndex,
    })
    const nextIndex =
      result.matches && result.matches.length > 0
        ? (result.matches.find((m) => m.index === src.matchIndex)?.index ??
          result.matches[0]!.index)
        : src.matchIndex
    form.sources = form.sources.map((s, i) =>
      i === idx ? { ...s, matchIndex: nextIndex } : s,
    )
    scanStates.value = {
      ...scanStates.value,
      [idx]: { loading: false, result, error: null },
    }
  } catch (err) {
    scanStates.value = {
      ...scanStates.value,
      [idx]: {
        loading: false,
        result: null,
        error: err instanceof Error ? err.message : 'Scan request failed',
      },
    }
  }
}

const canSubmit = computed(() => {
  return (
    form.name.trim().length > 0 &&
    form.sources.length > 0 &&
    form.sources.every((s) => s.url.trim().length > 0)
  )
})

function makeBlankSource(isMain = false): SourceDraft {
  return {
    url: '',
    currency: 'USD',
    priceClass: '',
    cssRule: '',
    fatherClass: '',
    isMain,
    isDiscounted: false,
    isUsed: false,
    matchIndex: 0,
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) resetForm()
  },
)

function resetForm(): void {
  if (props.existing) {
    form.name = props.existing.name
    imageUrl.value = props.existing.imageUrl ?? ''
    selectedTagIds.value = [...props.existing.tagIds]
    const existingSources = props.existing.sources ?? []
    form.sources =
      existingSources.length > 0
        ? existingSources.map((s) => ({
            id: s.id,
            url: s.url,
            currency: s.currency,
            priceClass: s.priceClass ?? '',
            cssRule: s.cssRule ?? '',
            fatherClass: s.fatherClass ?? '',
            isMain: s.isMain,
            isDiscounted: s.isDiscounted ?? false,
            isUsed: s.isUsed ?? false,
            matchIndex: s.matchIndex ?? 0,
          }))
        : [makeBlankSource(true)]
  } else {
    form.name = ''
    imageUrl.value = ''
    uploadedFile.value = null
    selectedTagIds.value = []
    form.sources = [makeBlankSource(true)]
  }
  scanStates.value = {}
  warning.value = null
  errors.name = ''
  createRecipeVisible.value = false
  recipeSourceIdx.value = null
}

function addSource(): void {
  form.sources = [...form.sources, makeBlankSource()]
}

function removeSource(idx: number): void {
  const removed = form.sources[idx]
  if (!removed) return
  const next = form.sources.filter((_, i) => i !== idx)
  if (removed.isMain && next.length > 0) {
    form.sources = next.map((s, i) => ({ ...s, isMain: i === 0 }))
  } else {
    form.sources = next
  }
}

function onSetMain(idx: number): void {
  form.sources = form.sources.map((s, i) => ({ ...s, isMain: i === idx }))
}

function applyRecipe(idx: number, recipe: SelectorRecipe): void {
  form.sources = form.sources.map((s, i) =>
    i === idx
      ? {
          ...s,
          priceClass: recipe.priceClass ?? '',
          cssRule: recipe.cssRule ?? '',
          fatherClass: recipe.fatherClass ?? '',
        }
      : s,
  )
  toast.add({
    severity: 'info',
    summary: `Applied recipe “${recipe.name}”`,
    life: 2000,
  })
}

function openCreateRecipe(idx: number): void {
  recipeSourceIdx.value = idx
  createRecipeVisible.value = true
}

async function onRecipeCreated(): Promise<void> {
  // Remount RecipePicker instances so they re-fetch the updated list.
  recipeListVersion.value += 1
}

function onTagCreated(tag: Tag): void {
  // Auto-select the newly created tag on the item form.
  if (!selectedTagIds.value.includes(tag.id)) {
    selectedTagIds.value = [...selectedTagIds.value, tag.id]
  }
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) uploadedFile.value = file
}

function onDrop(event: DragEvent): void {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) uploadedFile.value = file
}

function close(): void {
  emit('update:visible', false)
}

async function onSubmit(): Promise<void> {
  errors.name = form.name.trim() ? '' : 'Name is required'
  if (errors.name) return
  submitting.value = true
  try {
    let resolvedImageUrl: string | null = imageUrl.value || null
    if (uploadedFile.value) {
      const fd = new FormData()
      fd.append('file', uploadedFile.value)
      const raw = await $fetch<unknown>(`${useApiUrl()}/images/upload`, {
        method: 'POST',
        body: fd,
      })
      const { url } = ImageUploadResponseSchema.parse(raw)
      resolvedImageUrl = url
    }
    emit('submit', {
      name: form.name.trim(),
      imageUrl: resolvedImageUrl,
      tagIds: [...selectedTagIds.value],
      sources: form.sources.map((s) => ({
        id: s.id,
        url: s.url.trim(),
        currency: s.currency,
        priceClass: s.priceClass.trim() || null,
        cssRule: s.cssRule.trim() || null,
        fatherClass: s.fatherClass.trim() || null,
        isMain: s.isMain,
        isDiscounted: s.isDiscounted,
        isUsed: s.isUsed,
        matchIndex: s.matchIndex,
      })),
    })
    void toast
  } catch (err) {
    warning.value = err instanceof Error ? err.message : 'Failed to create item'
  } finally {
    submitting.value = false
  }
}
</script>
