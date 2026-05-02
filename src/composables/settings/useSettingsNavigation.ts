import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Pillar Composable: useSettingsNavigation
 * 
 * Manages the active tab state and synchronizes it with the 
 * URL query parameters for deep-linking.
 */
export function useSettingsNavigation() {
  const route = useRoute()
  const activeTab = ref('general')

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'board', label: 'Board & Style', icon: '🎨' },
    { id: 'engine', label: 'Engine', icon: '🧠' },
    { id: 'identity', label: 'Identity & DNA', icon: '🧬' },
  ]

  onMounted(() => {
    if (route.query.tab) {
      activeTab.value = route.query.tab as string
    }
  })

  watch(() => route.query.tab, (newTab) => {
    if (newTab) activeTab.value = newTab as string
  })

  return {
    activeTab,
    tabs
  }
}
