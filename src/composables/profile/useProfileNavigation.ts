import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Pillar Composable: useProfileNavigation
 * 
 * Manages the active tab state for the Profile view and synchronizes 
 * it with the URL query parameters for deep linking.
 */
export function useProfileNavigation() {
  const route = useRoute()
  const router = useRouter()

  const tabs = [
    { id: 'overview', label: '⚡ War Room' },
    { id: 'dna', label: '🧬 Soul Mapping' },
    { id: 'vault', label: '🗄️ Archives' },
    { id: 'constellation', label: '✨ Constellation' },
    { id: 'integrations', label: '🛰️ Integrations' }
  ]

  // Initialize from query param or default to overview
  const activeTab = ref((route.query.tab as string) || 'overview')

  // Sync tab changes to the URL
  watch(activeTab, (newTab) => {
    router.replace({ query: { ...route.query, tab: newTab } })
  })

  // Sync URL changes back to the tab state (e.g. browser back button)
  watch(() => route.query.tab, (newTab) => {
    if (newTab && typeof newTab === 'string') {
      activeTab.value = newTab
    }
  })

  return {
    activeTab,
    tabs
  }
}
