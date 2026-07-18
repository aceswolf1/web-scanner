<template>
  <Dialog
    :visible="visible"
    @update:visible="(v) => emit('update:visible', v)"
    modal
    :draggable="false"
    header="Add source"
    :style="{ width: '560px', maxWidth: '95vw' }"
    :pt="{ root: { class: 'rounded-2xl overflow-hidden' } }"
  >
    <div class="flex flex-col gap-4 py-1">
      <!-- Recipes -->
      <RecipePicker
        ref="recipePickerRef"
        :url="draft.url"
        :can-create="canSaveRecipe"
        @apply="applyRecipe"
        @create="createRecipeVisible = true"
      />

      <!-- URL -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color: var(--foreground)">
          URL <span style="color: rgb(248 113 113)">*</span>
        </label>
        <InputText
          v-model="draft.url"
          placeholder="https://store.com/product"
          class="w-full"
        />
      </div>

      <!-- CSS Rule + Price Class -->
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium" style="color: var(--foreground)">CSS Rule</label>
          <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
            Full CSS selector — use dots for classes, e.g.
            <code>.product .price-tag</code>
          </small>
          <InputText
            v-model="draft.cssRule"
            placeholder=".product-card .price-value"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium" style="color: var(--foreground)">Price Class</label>
          <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
            Class name only — no dot, e.g. <code>price-tag</code>
          </small>
          <InputText
            v-model="draft.priceClass"
            placeholder="price-value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Father Class -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color: var(--foreground)">Father Class</label>
        <small class="text-[10px] font-mono" style="color: var(--muted-foreground)">
          Narrows the search — class name only, no dot, e.g. <code>product-card</code>
        </small>
        <InputText
          v-model="draft.fatherClass"
          placeholder="product-card"
          class="w-full"
        />
      </div>

      <!-- Currency + Scan + isMain -->
      <div class="flex flex-wrap items-center gap-3 pt-1">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium" style="color: var(--foreground)">Currency</label>
          <Select
            v-model="draft.currency"
            :options="currencyOptions"
            option-label="label"
            option-value="value"
            class="w-32"
          />
        </div>

        <Button
          label="Scan"
          icon="pi pi-search"
          size="small"
          severity="secondary"
          :loading="scanState.loading"
          @click="runScan"
        />

        <div class="flex flex-wrap items-center gap-4 ml-auto">
          <div class="flex items-center gap-2">
            <Checkbox v-model="draft.isMain" binary input-id="add-source-is-main" />
            <label for="add-source-is-main" class="text-xs cursor-pointer" style="color: var(--foreground)">
              Set as main source
            </label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="draft.isDiscounted" binary input-id="add-source-is-discounted" />
            <label
              for="add-source-is-discounted"
              class="text-xs cursor-pointer"
              style="color: var(--foreground)"
            >
              Price is discounted
            </label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="draft.isUsed" binary input-id="add-source-is-used" />
            <label
              for="add-source-is-used"
              class="text-xs cursor-pointer"
              style="color: var(--foreground)"
            >
              Used
            </label>
          </div>
        </div>
      </div>

      <!-- Scan result feedback -->
      <div
        v-if="scanState.result"
        class="rounded-lg px-3 py-2 text-xs flex items-start gap-2"
        :style="
          selectedMatchPrice !== null
            ? 'background: rgba(34,197,94,0.12); color: rgb(22 163 74)'
            : 'background: rgba(248,113,113,0.12); color: rgb(248 113 113)'
        "
      >
        <i
          :class="
            selectedMatchPrice !== null
              ? 'pi pi-check-circle mt-0.5'
              : 'pi pi-exclamation-triangle mt-0.5'
          "
        />
        <div class="flex-1">
          <template v-if="selectedMatchPrice !== null">
            <span>Found: {{ selectedMatchPrice }}</span>
            <span v-if="scanState.result.warning" class="opacity-80">
              · {{ scanState.result.warning }}
            </span>
            <span v-if="(scanState.result.matches?.length ?? 0) > 1" class="opacity-80">
              · match #{{ draft.matchIndex }}
            </span>
          </template>
          <template v-else>
            <span>{{ scanState.result.error ?? 'No value found' }}</span>
          </template>
        </div>
      </div>

      <MatchPicker
        v-if="scanMatches.length > 1"
        v-model="draft.matchIndex"
        :matches="scanMatches"
        id-prefix="add-source"
      />

      <CurrencyScanWarning
        :currency-warning="scanState.result?.currencyWarning"
        :detected-currency="scanState.result?.detectedCurrency"
        :selected-currency="draft.currency"
      />

      <div
        v-if="scanState.error"
        class="rounded-lg px-3 py-2 text-xs flex items-start gap-2"
        style="background: rgba(248,113,113,0.12); color: rgb(248 113 113)"
      >
        <i class="pi pi-exclamation-triangle mt-0.5" />
        <span>{{ scanState.error }}</span>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        @click="emit('update:visible', false)"
      />
      <Button
        label="Add Source"
        icon="pi pi-plus"
        :loading="submitting"
        @click="save"
      />
    </template>
  </Dialog>

  <CreateRecipeModal
    v-model:visible="createRecipeVisible"
    :url="draft.url"
    :price-class="draft.priceClass"
    :css-rule="draft.cssRule"
    :father-class="draft.fatherClass"
    @created="onRecipeCreated"
  />
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import type { Currency, SelectorRecipe, ScrapeMatch } from '~/types/api.types'
import { CURRENCY_OPTIONS } from '~/utils/currencyOptions'
import type { TestScrapeResult } from '~/composables/useSources'

interface SourceDraft {
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
  itemId: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const { addSource, scrapeOne, testScrape } = useSources()
const toast = useToast()

const currencyOptions = CURRENCY_OPTIONS.map((c) => ({ label: c, value: c }))
const createRecipeVisible = ref(false)
const recipePickerRef = ref<{ reload: () => Promise<void> } | null>(null)

async function onRecipeCreated(): Promise<void> {
  await recipePickerRef.value?.reload()
}

function blankDraft(): SourceDraft {
  return {
    url: '',
    currency: 'USD',
    priceClass: '',
    cssRule: '',
    fatherClass: '',
    isMain: false,
    isDiscounted: false,
    isUsed: false,
    matchIndex: 0,
  }
}

const draft = ref<SourceDraft>(blankDraft())
const submitting = ref(false)
const scanState = ref<{
  loading: boolean
  result: TestScrapeResult | null
  error: string | null
}>({
  loading: false,
  result: null,
  error: null,
})

const scanMatches = computed<ScrapeMatch[]>(() => scanState.value.result?.matches ?? [])

const selectedMatchPrice = computed<number | null>(() => {
  const result = scanState.value.result
  if (!result) return null
  const matches = result.matches
  if (matches && matches.length > 0) {
    const picked = matches.find((m) => m.index === draft.value.matchIndex) ?? matches[0]
    if (picked && picked.price !== null) return picked.price
  }
  return result.price
})

const canSaveRecipe = computed(() => {
  return Boolean(
    draft.value.cssRule.trim() ||
      draft.value.priceClass.trim() ||
      draft.value.fatherClass.trim(),
  )
})

// Reset draft whenever the modal becomes visible.
watch(
  () => props.visible,
  (v) => {
    if (v) {
      draft.value = blankDraft()
      scanState.value = { loading: false, result: null, error: null }
      createRecipeVisible.value = false
    }
  },
)

function applyRecipe(recipe: SelectorRecipe): void {
  draft.value = {
    ...draft.value,
    priceClass: recipe.priceClass ?? '',
    cssRule: recipe.cssRule ?? '',
    fatherClass: recipe.fatherClass ?? '',
  }
  toast.add({
    severity: 'info',
    summary: `Applied recipe “${recipe.name}”`,
    life: 2000,
  })
}

async function runScan(): Promise<void> {
  if (!draft.value.url) {
    toast.add({ severity: 'warn', summary: 'Enter a URL first', life: 2500 })
    return
  }
  scanState.value = { loading: true, result: null, error: null }
  try {
    const result = await testScrape({
      url: draft.value.url,
      priceClass: draft.value.priceClass.trim() || null,
      cssRule: draft.value.cssRule.trim() || null,
      fatherClass: draft.value.fatherClass.trim() || null,
      currency: draft.value.currency,
      matchIndex: draft.value.matchIndex,
    })
    const nextIndex =
      result.matches && result.matches.length > 0
        ? (result.matches.find((m) => m.index === draft.value.matchIndex)?.index ??
          result.matches[0]!.index)
        : 0
    draft.value = { ...draft.value, matchIndex: nextIndex }
    scanState.value = { loading: false, result, error: null }
  } catch (err) {
    scanState.value = {
      loading: false,
      result: null,
      error: err instanceof Error ? err.message : 'Scan request failed',
    }
  }
}

async function save(): Promise<void> {
  if (!draft.value.url.trim()) {
    toast.add({ severity: 'warn', summary: 'URL required', life: 3000 })
    return
  }
  submitting.value = true
  try {
    const newSource = await addSource(props.itemId, {
      url: draft.value.url.trim(),
      currency: draft.value.currency,
      priceClass: draft.value.priceClass.trim() || null,
      cssRule: draft.value.cssRule.trim() || null,
      fatherClass: draft.value.fatherClass.trim() || null,
      isMain: draft.value.isMain,
      isDiscounted: draft.value.isDiscounted,
      isUsed: draft.value.isUsed,
      matchIndex: draft.value.matchIndex,
    })
    // Scrape immediately so the price appears without a manual refresh
    await scrapeOne(newSource.id)
    toast.add({ severity: 'success', summary: 'Source added', life: 2500 })
    emit('saved')
    emit('update:visible', false)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to add source',
      detail: err instanceof Error ? err.message : '',
      life: 4000,
    })
  } finally {
    submitting.value = false
  }
}
</script>
