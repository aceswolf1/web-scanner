<template>
  <button
    type="button"
    class="relative w-12 h-7 rounded-full border transition-colors flex items-center px-0.5"
    :style="{
      background: theme.isDark.value ? 'var(--primary)' : 'rgb(226 232 240)',
      borderColor: 'var(--border)',
    }"
    :aria-pressed="theme.isDark.value"
    :aria-label="theme.isDark.value ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="theme.toggle"
  >
    <span
      class="w-5.5 h-5.5 w-[22px] h-[22px] rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-150"
      :style="{ transform: theme.isDark.value ? 'translateX(20px)' : 'translateX(0)' }"
    >
      <i
        :class="theme.isDark.value ? 'pi pi-moon text-violet-600' : 'pi pi-sun text-amber-500'"
        class="text-[11px]"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
const theme = useTheme()
</script>