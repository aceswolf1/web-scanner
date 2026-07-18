<template>
  <header
    class="h-16 shrink-0 flex items-center justify-between px-6 border-b backdrop-blur-md z-10"
    :style="{
      backgroundColor: 'var(--topbar-bg)',
      borderColor: 'var(--border)',
    }"
  >
    <div class="flex items-center gap-4">
      <h1 class="text-base font-semibold" style="color: var(--foreground)">
        {{ pageTitle }}
      </h1>
      <span
        class="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider"
        :style="{ background: 'var(--muted)', color: 'var(--muted-foreground)' }"
      >
        {{ pageBadge }}
      </span>
    </div>

    <div class="flex items-center gap-3">
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener"
        class="hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md transition-colors"
        :style="{ color: 'var(--muted-foreground)' }"
      >
        <i class="pi pi-github text-base" />
        <span>docs</span>
      </a>
      <ThemeToggle />
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const pageTitle = computed(() => {
  if (route.path.startsWith('/pricing/favorites')) return 'Favorites'
  if (route.path.startsWith('/pricing/')) return 'Item Detail'
  if (route.path.startsWith('/pricing')) return 'Pricing Tracker'
  return 'Web Scanner'
})
const pageBadge = computed(() => {
  if (route.path.startsWith('/pricing/favorites')) return 'pinned'
  if (route.path.startsWith('/pricing/')) return 'detail'
  if (route.path.startsWith('/pricing')) return 'module · pricing'
  return 'overview'
})
</script>