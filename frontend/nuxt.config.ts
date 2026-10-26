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
      meta: [{ name: 'theme-color', content: '#7C3AED' }],
      link: [
        // Brand mark (violet tile + bolt). SVG for modern browsers; .ico fallback.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    // Server-only: used during SSR / Nitro to reach the API on the Docker network.
    apiInternalUrl: process.env.API_INTERNAL_URL ?? 'http://api:4000',
    // Server-only: MinIO on the Docker network, used by the /storage image proxy.
    storageInternalUrl: process.env.STORAGE_INTERNAL_URL ?? 'http://storage:9000',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:4000',
      storageUrl: process.env.NUXT_PUBLIC_STORAGE_URL ?? 'http://localhost:9000',
    },
  },

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  typescript: { strict: true },
  compatibilityDate: '2024-11-01',

  // Avoid Vite "#app-manifest" resolution failures that break client hydration
  // (items then never load because fetch runs only in onMounted).
  experimental: {
    appManifest: false,
  },
})