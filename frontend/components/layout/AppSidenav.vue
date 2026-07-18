<template>
  <aside
    class="w-60 shrink-0 flex flex-col border-r"
    :style="{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border)' }"
    aria-label="Primary navigation"
  >
    <!-- Gradient accent line -->
    <div class="sidenav-accent h-px" />

    <!-- Brand -->
    <div class="px-5 py-5 border-b" :style="{ borderColor: 'var(--border)' }">
      <NuxtLink to="/pricing" class="flex items-center gap-2.5">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center"
          style="background: linear-gradient(135deg, #A78BFA, #7C3AED, #5B21B6)"
        >
          <i class="pi pi-bolt text-white text-lg" />
        </div>
        <div>
          <div class="font-brand font-bold text-base leading-none tracking-tight" style="color: var(--foreground)">
            Web Scanner
          </div>
          <div class="text-[10px] uppercase tracking-wider font-mono mt-1" style="color: var(--muted-foreground)">
            v0.1 · modular
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Module list -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <div class="text-[10px] uppercase tracking-wider font-mono px-3 mb-2" style="color: var(--muted-foreground)">
        Modules
      </div>
      <ul class="space-y-1">
        <li v-for="m in modules" :key="m.id">
          <NuxtLink
            :to="m.to"
            class="flex items-center gap-3 h-11 px-4 mx-0 rounded-lg text-sm font-medium transition-colors relative"
            :class="[
              m.active
                ? 'text-violet-400'
                : 'hover:bg-muted/40',
              m.disabled ? 'opacity-50 pointer-events-none' : '',
            ]"
            :style="{ color: m.active ? undefined : 'var(--muted-foreground)' }"
          >
            <span
              v-if="m.active"
              class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full"
              style="background: var(--primary); box-shadow: 0 0 8px var(--primary)"
            />
            <i :class="['pi', m.icon, 'text-base']" />
            <span>{{ m.name }}</span>
            <span
              v-if="m.badge"
              class="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              :style="{ background: 'var(--muted)', color: 'var(--muted-foreground)' }"
            >
              {{ m.badge }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div class="px-5 py-4 border-t text-[10px] font-mono" :style="{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }">
      <div class="flex items-center justify-between">
        <span>API</span>
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          connected
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const modules = computed(() => [
  {
    id: 'pricing',
    name: 'Pricing Tracker',
    icon: 'pi-tag',
    to: '/pricing',
    active: route.path.startsWith('/pricing'),
    badge: null,
    disabled: false,
  },
  { id: 'seo', name: 'SEO', icon: 'pi-search', to: '#', active: false, badge: 'soon', disabled: true },
  { id: 'analytics', name: 'Analytics', icon: 'pi-chart-bar', to: '#', active: false, badge: 'soon', disabled: true },
  { id: 'monitoring', name: 'Monitoring', icon: 'pi-shield', to: '#', active: false, badge: 'soon', disabled: true },
])
</script>