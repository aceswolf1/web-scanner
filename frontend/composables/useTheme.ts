import { useThemeStore } from '~/stores/theme.store'

/**
 * Thin wrapper around the theme Pinia store. Components should prefer
 * `useTheme()` over `useThemeStore()` directly so we have one place to
 * add feature-detection / SSR safety later.
 */
export function useTheme() {
  const store = useThemeStore()
  return {
    isDark: computed(() => store.isDark),
    init: store.init,
    toggle: store.toggle,
  }
}