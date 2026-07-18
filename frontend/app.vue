<template>
  <div
    class="flex h-screen overflow-hidden"
    :data-theme="themeStore.isDark ? 'dark' : 'light'"
  >
    <AppSidenav />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppTopbar />
      <main class="flex-1 overflow-auto p-6">
        <NuxtPage />
      </main>
    </div>
    <Toast position="top-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const themeStore = useThemeStore()
onMounted(() => themeStore.init())
</script>