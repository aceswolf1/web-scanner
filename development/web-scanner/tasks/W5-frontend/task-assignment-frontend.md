# Task Assignment: W5-frontend

**Worker**: worker-frontend
**Role**: pt-frontend-eng
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: 5 — Nuxt 4 Frontend

---

## Objective

Build the complete Nuxt 4 frontend for the web-scanner Pricing Tracker. This is a greenfield Nuxt 4 app with Vue 3, TypeScript, Tailwind, and PrimeVue (Material theme, violet primary).

**Read these files BEFORE writing any code:**
1. `initial-requirements/web-scrapper-requirements.md` — product requirements
2. `initial-requirements/ProductCard.md` — exact ItemCard component spec (implement this precisely)
3. `.superdesign/design-system.md` — full design tokens and visual spec
4. `api/src/index.ts` + `api/src/controllers/` — understand the API shape
5. `api/package.json` — understand available deps (no need to read the full backend)

---

## Task IDs

- **T8** = your task. Call `TaskUpdate(taskId: "8", status: "in_progress", owner: "worker-frontend")` immediately.

---

## Target Directory Structure

```
frontend/
├── Dockerfile                   ← already exists, do NOT overwrite
├── package.json                 ← replace stub with full Nuxt 4 package.json
├── nuxt.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env                         ← (already in root .env, not needed here)
├── app.vue
├── assets/
│   └── css/
│       └── main.css             ← global CSS vars + theme tokens
├── components/
│   ├── layout/
│   │   ├── AppSidenav.vue       ← left sidenav with module list
│   │   └── AppTopbar.vue        ← top bar with theme toggle
│   ├── pricing/
│   │   ├── ItemCard.vue         ← implement ProductCard.md EXACTLY
│   │   ├── ItemList.vue         ← 3-column grid + search + tag filters
│   │   ├── ItemDetail.vue       ← detail view: comparison chart + sources grid
│   │   ├── CreateItemModal.vue  ← modal with source repeater
│   │   ├── SourceCard.vue       ← individual source card in detail view
│   │   ├── PriceHistoryChart.vue← multi-line comparison chart component
│   │   └── TagBadge.vue         ← colored tag pill
│   └── ui/
│       └── ThemeToggle.vue      ← sun/moon toggle button
├── composables/
│   ├── useTheme.ts              ← dark/light toggle + system preference
│   ├── useItems.ts              ← item CRUD composable
│   ├── useSources.ts            ← source CRUD composable
│   ├── useTags.ts               ← tag composable
│   └── useCurrencies.ts         ← frankfurter rate fetching
├── stores/
│   ├── items.store.ts           ← Pinia store for items
│   ├── tags.store.ts            ← Pinia store for tags
│   └── theme.store.ts           ← Pinia store for theme preference
├── pages/
│   ├── index.vue                ← redirects to /pricing
│   └── pricing/
│       ├── index.vue            ← Pricing Tracker item list
│       ├── favorites.vue        ← Favorites section (same grid, isFavorite=true)
│       └── [id].vue             ← Item detail page
├── types/
│   ├── item.types.ts
│   ├── source.types.ts
│   └── api.types.ts
└── utils/
    ├── currency.ts              ← format price with currency symbol
    └── time.ts                  ← relative time (Just now, 2m ago, 3h ago)
```

---

## Key Implementation Requirements

### 1. `package.json` — full Nuxt 4 dependencies

```json
{
  "name": "web-scanner-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "nuxt": "^3.13.2",
    "vue": "^3.5.11",
    "vue-router": "^4.4.5",
    "@pinia/nuxt": "^0.5.5",
    "pinia": "^2.2.4",
    "primevue": "^4.2.1",
    "@primevue/nuxt-module": "^4.2.1",
    "@primevue/themes": "^4.2.1",
    "primeicons": "^7.0.0",
    "chart.js": "^4.4.5",
    "vue-chartjs": "^5.3.1",
    "zod": "^3.23.8",
    "@vueuse/core": "^11.1.0",
    "@vueuse/nuxt": "^11.1.0"
  },
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.12.1",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "autoprefixer": "^10.4.20"
  }
}
```

### 2. `nuxt.config.ts`

```typescript
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: false,
        },
      },
    },
  },

  app: {
    head: {
      title: 'Web Scanner',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:4000',
      storageUrl: process.env.NUXT_PUBLIC_STORAGE_URL ?? 'http://localhost:9000',
    },
  },

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  typescript: { strict: true },
  compatibilityDate: '2024-11-01',
})
```

### 3. `assets/css/main.css` — CSS custom properties

Define all design tokens from `.superdesign/design-system.md` as CSS variables:

```css
:root {
  --font-sans: 'Inter', sans-serif;
  --font-brand: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

:root, [data-theme="light"] {
  --background: #FAF8FF;
  --foreground: #1A0A3C;
  --card: #FFFFFF;
  --card-foreground: #1A0A3C;
  --border: rgba(124, 58, 237, 0.15);
  --primary: #7C3AED;
  --primary-foreground: #FFFFFF;
  --accent: #A855F7;
  --muted: #F3EEFF;
  --muted-foreground: #6B5FA0;
  --secondary: #EDE9FE;
  --secondary-foreground: #4C1D95;
  --sidebar-bg: #F0EBFF;
  --topbar-bg: rgba(250, 248, 255, 0.85);
}

[data-theme="dark"] {
  --background: #08050F;
  --foreground: #F0EEFF;
  --card: #0F0B1E;
  --card-foreground: #F0EEFF;
  --border: rgba(139, 92, 246, 0.18);
  --primary: #8B5CF6;
  --primary-foreground: #FFFFFF;
  --accent: #A855F7;
  --muted: #150F2A;
  --muted-foreground: #7C6FA0;
  --secondary: #1A1330;
  --secondary-foreground: #C4B5FD;
  --sidebar-bg: #0B0B14;
  --topbar-bg: rgba(8, 5, 15, 0.85);
}

* { font-family: var(--font-sans); }
body { background: var(--background); color: var(--foreground); }
.font-mono { font-family: var(--font-mono) !important; }
.font-brand { font-family: var(--font-brand) !important; }
```

### 4. `tailwind.config.ts`

```typescript
export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.ts',
    './app.vue',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        border: 'var(--border)',
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        brand: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 5. `stores/theme.store.ts`

```typescript
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)

  function init() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, init, toggle }
})
```

### 6. `app.vue`

```vue
<template>
  <div class="flex h-screen overflow-hidden" :data-theme="themeStore.isDark ? 'dark' : 'light'">
    <AppSidenav />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppTopbar />
      <main class="flex-1 overflow-auto p-6">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const themeStore = useThemeStore()
onMounted(() => themeStore.init())
</script>
```

### 7. `ItemCard.vue` — implement ProductCard.md EXACTLY

This is the most critical component. Implement the spec from `initial-requirements/ProductCard.md` precisely:

- **Zone 1 (Header)**: `px-4 pt-4 pb-3`, flex row, 44×44px thumbnail (`rounded-xl`), name + tags column (`flex-1 min-w-0 pr-7`), absolute star button (`top-3.5 right-3.5`, 28×28px)
- **Zone 2 (Sparkline)**: trend label row with `px-4 mb-1`, then SVG sparkline with **ZERO horizontal padding** (`width: 100%`, `preserveAspectRatio="none"`, 56px tall). Card has `overflow-hidden` — SVG bleeds edge-to-edge.
- **Zone 3 (Footer)**: `px-4 pt-2.5 pb-3.5 border-t`, price in `font-mono text-lg font-bold text-primary`, source hostname + relative time, source count badge
- Colors: emerald for positive trend, red-400 for negative
- Hover: `hover:border-primary/50 hover:shadow-[0_0_28px_rgba(139,92,246,0.2)]`

### 8. `PriceHistoryChart.vue` — comparison chart

Use `vue-chartjs` + Chart.js. Multi-line chart matching the reference screenshot:
- X-axis: dates in `MM-DD` format
- Y-axis: prices with `$` prefix (or currency symbol)
- One line per source, different colors (violet, cyan, amber)
- Gradient area fill under each line
- Hover tooltip showing date + price
- "Display in" currency dropdown (uses `useCurrencies` to fetch rates and convert)
- Dark background card: `bg-card border border-border rounded-2xl p-6`

### 9. `CreateItemModal.vue`

PrimeVue Dialog with:
- Name field (InputText, required)
- Image section: two tabs (URL input / file upload with drag-drop)
- Tags: MultiSelect with option to create new tag inline
- Source repeater: dynamic list of source rows, each row has:
  - URL (InputText, wide)
  - Currency (Select from USD/EUR/GBP/JPY/CAD/MXN/COP)
  - Price Class (InputText, placeholder ".price")
  - CSS Rule (InputText, optional)
  - Father Class (InputText, optional)
  - Main price radio (only one selectable across all rows)
  - Delete row button
- "+ Add Source" button
- Warning toast if API returns warning about multiple matches
- Footer: Cancel + OK (violet filled)

### 10. Pages

**`pages/pricing/index.vue`**: Renders `<ItemList>` with search input, tag filter chips, 3-column `<ItemCard>` grid, "+ Add Product" button that opens `<CreateItemModal>`

**`pages/pricing/favorites.vue`**: Same as index but passes `?favorite=true` filter to the items store

**`pages/pricing/[id].vue`**: Renders `<ItemDetail>` — fetches item by ID, shows header (image, name, tags, main price, action buttons: favorite, edit, Scrape All, delete), `<PriceHistoryChart>`, then sources grid of `<SourceCard>` components in 2-col layout

### 11. API composable pattern

```typescript
// composables/useItems.ts
export function useItems() {
  const config = useRuntimeConfig()
  const store = useItemsStore()

  async function fetchItems(params?: { search?: string; favorite?: boolean }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.favorite !== undefined) query.set('favorite', String(params.favorite))
    const data = await $fetch(`${config.public.apiUrl}/items?${query}`)
    // Zod validate response
    store.setItems(data.items)
    return data
  }

  // ... createItem, updateItem, deleteItem, toggleFavorite, scrapeItem
  return { fetchItems, ... }
}
```

Validate all API responses with Zod before storing in Pinia.

---

## Acceptance Criteria

- [ ] `nuxt.config.ts` has PrimeVue (Aura preset), Pinia, Tailwind, VueUse modules
- [ ] Dark/light theme toggled via `data-theme` attribute, persisted in localStorage, defaults to system preference
- [ ] `ItemCard.vue` matches ProductCard.md spec exactly: 3 zones, full-width SVG sparkline (no horizontal padding on SVG), hover glow, emerald/red trend colors
- [ ] Item list shows 3-column grid, search filters by name/URL/tag
- [ ] Create item modal has source repeater with all required fields; only one source can be main
- [ ] Item detail shows comparison chart with axes and hover tooltip, then sources grid with MAIN badge, URL, price+currency dropdown, CSS selector chip
- [ ] Favorites page filters to isFavorite=true items
- [ ] All API calls use `$fetch` with Zod validation
- [ ] TypeScript strict mode — no `any`
- [ ] Currency conversion uses frankfurter.dev rates from `/currencies/rates`
- [ ] `font-feature-settings: 'tnum'` on all price displays

---

## Reporting

1. Write `development/web-scanner/tasks/W5-frontend/progress-report.md` after each major section
2. Write `development/web-scanner/tasks/W5-frontend/completion-report.md`
3. `TaskUpdate(taskId: "8", status: "completed")`
4. Send: `COMPLETE: Frontend done. Nuxt 4 app fully implemented.`
