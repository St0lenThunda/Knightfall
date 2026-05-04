import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'

/**
 * Shared interfaces for the navigation system.
 */
export interface NavItem {
  path: string
  icon: string
  label: string
  auth: boolean
  badge?: string | null
}

export interface NavSection {
  title: string
  showTitle: boolean
  items: NavItem[]
}

/**
 * Composable to manage the state and logic of the side navigation.
 * Centralizes route matching, section toggling, and dynamic link generation.
 */
export function useNavigation() {
  const route = useRoute()
  const userStore = useUserStore()
  const libraryStore = useLibraryStore()
  const coachStore = useCoachStore()

  // --- SECTION TOGGLING ---
  const collapsedSections = ref(new Set<string>())

  /**
   * Toggles the visibility of a navigation section.
   */
  function toggleSection(title: string) {
    if (collapsedSections.value.has(title)) {
      collapsedSections.value.delete(title)
    } else {
      collapsedSections.value.add(title)
    }
  }

  /**
   * Ensures the section containing the active route is expanded on load.
   */
  const ensureSectionExpanded = () => {
    const activeSection = navSections.value.find(s => 
      s.items.some(i => i.path === route.path)
    )
    if (activeSection) {
      collapsedSections.value.delete(activeSection.title)
    }
  }

  onMounted(() => {
    ensureSectionExpanded()
  })

  // --- ROUTE MATCHING ---
  
  /**
   * Complex link active state detection.
   * Handles sub-routes (lessons) and specific query parameters (Soul Mapping).
   */
  function isLinkActive(path: string) {
    const currentPath = route.path
    
    // Normalize path for comparison (strip query for base checks)
    const [basePath, queryStr] = path.split('?')
    
    // 1. Academy sub-route mapping (Lessons are part of the Academy context)
    if (basePath === '/academy' && currentPath.startsWith('/lesson')) return true
    
    // 2. Query Parameter logic (Soul Mapping vs War Room)
    if (queryStr === 'tab=dna') {
      return currentPath === '/profile' && route.query.tab === 'dna'
    }
    
    // 3. War Room (Profile) should only be active if NOT on the DNA tab
    if (path === '/profile') {
      return currentPath === '/profile' && route.query.tab !== 'dna'
    }

    // 4. Standard path matching
    return currentPath === basePath
  }

  // --- DYNAMIC NAV SECTIONS ---

  /**
   * Generates the navigation structure based on user state and coach prescriptions.
   */
  const navSections = computed<NavSection[]>(() => {
    // We pull in "Soul Mapping" badges (Severity based)
    const dnaRx = coachStore.dnaPrescriptions || []
    const openingRx = coachStore.openingPrescriptions || []

    const critRx = dnaRx.filter((r: any) => r.severity === 'critical').length +
                   openingRx.filter((r: any) => r.severity === 'critical').length
    
    const warnRx = dnaRx.filter((r: any) => r.severity === 'warning').length +
                   openingRx.filter((r: any) => r.severity === 'warning').length

    return [
      {
        title: 'Mission',
        showTitle: true,
        items: [
          { path: '/', icon: '📡', label: 'Strategic Briefing', auth: false },
        ].filter(() => !userStore.session)
      },
      {
        title: 'Command',
        showTitle: true,
        items: [
          { path: '/', icon: '📡', label: 'Strategic Briefing', auth: true },
          { path: '/profile', icon: '⬡', label: 'War Room', badge: (libraryStore.personalGames?.length || 0) > 0 ? `🧬 ${libraryStore.personalGames?.length}` : null, auth: true },
          { path: '/profile?tab=dna', icon: '🧬', label: 'Soul Mapping', badge: critRx > 0 ? 'CRITICAL' : (warnRx > 0 ? 'ACTIVE' : null), auth: true },
        ].filter(i => !i.auth || !!userStore.session)
      },
      {
        title: 'Training',
        showTitle: true,
        items: [
          { path: '/academy', icon: '⚔️', label: "Knight's Path", badge: 'ACTIVE', auth: true },
          { path: '/puzzles', icon: '⚡', label: 'Siege Trials', badge: 'NEW', auth: false },
          { path: '/gauntlet', icon: '🔥', label: 'The Great Gauntlet', badge: null, auth: true },
        ].filter(i => !i.auth || !!userStore.session)
      },
      {
        title: 'Combat',
        showTitle: true,
        items: [
          { path: '/play', icon: '♟', label: 'Direct Combat', badge: 'LIVE', auth: false },
        ].filter(i => !i.auth || !!userStore.session)
      },
      {
        title: 'Intelligence',
        showTitle: true,
        items: [
          { path: '/analysis', icon: '🔬', label: "Oracle's Review", badge: null, auth: true },
          { path: '/opening-lab', icon: '📖', label: 'Stratagem Forge', badge: null, auth: true },
          { path: '/settings', icon: '⚙️', label: 'Codex of Rites', badge: null, auth: false },
        ].filter(i => !i.auth || !!userStore.session)
      }
    ].filter(section => section.items.length > 0) // Final pass: Purge empty sections
  })

  return {
    collapsedSections,
    toggleSection,
    isLinkActive,
    navSections
  }
}
