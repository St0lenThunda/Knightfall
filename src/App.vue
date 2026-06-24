<template>
  <div class="app-layout" :class="{ 'mobile-nav-open': mobileOpen }" :style="layoutStyle">
    <SideNav v-if="!isMobile" :mobile-open="mobileOpen" @close="mobileOpen = false" />
    
    <!-- Mobile Hamburger (desktop only toggle fallback, hidden on mobile) -->
    <button v-if="!isMobile" class="mobile-nav-toggle btn btn-icon glass-sm" @click="mobileOpen = !mobileOpen">
      <span v-if="!mobileOpen">☰</span>
      <span v-else>✕</span>
    </button>

    <main class="main-content" @click="mobileOpen = false">
      <RouterView />
    </main>

    <!-- Mobile Bottom Tab Bar: Dynamic items matching auth state -->
    <nav v-if="isMobile" class="mobile-tab-bar">
      <template v-for="tab in mobileTabs" :key="tab.label">
        <RouterLink 
          v-if="tab.to"
          :to="tab.to" 
          class="tab-item" 
          :class="{ active: isTabActive(tab.to) }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </RouterLink>
        <button 
          v-else
          class="tab-item" 
          style="background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center;"
          @click="handleTabAction(tab.action!)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </template>
    </nav>

    <ToastProvider />
    <ConfirmModal />
    <ArchetypeModal />
    <AdminHud v-if="isDev || isTesting" />
    <TelemetryModal v-if="uiStore.isTelemetryOpen" :show="uiStore.isTelemetryOpen" @close="uiStore.isTelemetryOpen = false" />

    <!-- Mobile Authentication Portals -->
    <Teleport to="body">
      <AuthModal 
        v-if="showAuthModal" 
        :initialMode="authMode" 
        @close="showAuthModal = false"
      />
      <LogoutModal
        v-if="showLogoutModal"
        @close="showLogoutModal = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SideNav from './components/SideNav.vue'
import ToastProvider from './components/ToastProvider.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ArchetypeModal from './components/profile/modals/ArchetypeModal.vue'
import AdminHud from './components/AdminHud.vue'
import TelemetryModal from './components/TelemetryModal.vue'
import AuthModal from './components/AuthModal.vue'
import LogoutModal from './components/LogoutModal.vue'
import { logger } from './utils/logger'
import { useLibraryStore } from './stores/libraryStore'
import { useUserStore } from './stores/userStore'
import { useUiStore } from './stores/uiStore'
import { useMobileDetect } from './composables/useMobileDetect'
import { ref, onMounted, computed } from 'vue'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const route = useRoute()
const { isMobile } = useMobileDetect()
const isDev = import.meta.env.DEV
const isTesting = ref(false)
const mobileOpen = ref(false)

const showAuthModal = ref(false)
const showLogoutModal = ref(false)
const authMode = ref<'login' | 'signup'>('login')

interface MobileTab {
  to?: string
  action?: 'login' | 'logout'
  icon: string
  label: string
}

/**
 * Mobile bottom tab bar configuration.
 * Dynamically computes icons and destinations based on guest vs user authentication.
 */
const mobileTabs = computed<MobileTab[]>(() => {
  const base: MobileTab[] = [
    { to: '/', icon: '🏛️', label: 'Home' },
    { to: '/play', icon: '⚔️', label: 'Play' },
    { to: '/puzzles', icon: '🧩', label: 'Puzzles' }
  ]

  if (userStore.isAuthenticated) {
    return [
      ...base,
      { to: '/sanctum', icon: '📜', label: 'Sanctum' },
      { to: '/profile', icon: '👤', label: 'Profile' },
      { to: '/settings', icon: '⚙️', label: 'Settings' },
      { action: 'logout', icon: '🚪', label: 'Log Out' }
    ]
  } else {
    return [
      ...base,
      { action: 'login', icon: '🔑', label: 'Log In' }
    ]
  }
})

function handleTabAction(action: 'login' | 'logout') {
  if (action === 'login') {
    authMode.value = 'login'
    showAuthModal.value = true
  } else if (action === 'logout') {
    showLogoutModal.value = true
  }
}

/**
 * Determines if a tab is currently active.
 * Uses startsWith for nested routes (e.g. /profile/dna still highlights Profile).
 * Root path '/' requires an exact match to avoid always being active.
 */
function isTabActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}


onMounted(() => {
  isTesting.value = !!(window as any).Playwright || navigator.userAgent.includes('Playwright')
  if (isTesting.value || isDev) {
    (window as any).store = userStore
    (window as any).uiStore = uiStore
    // We'll also need the game store, but we'll grab it in PlayView or similar
  }
})

const init = async () => {
  try {
    // 1. Establish identity first
    // This is critical because libraryStore needs to know if it should load 
    // Curated (Guest) or Private (Scholar) games.
    await userStore.fetchUserData()
    
    // 2. Once identity is settled, load the tactical vault
    await libraryStore.loadGames()
  } catch (e) {
    logger.warn('[Knightfall] Initialization failed:', e)
  }
}

init()

const layoutStyle = computed(() => ({
  '--sidebar-width': uiStore.isSidebarCollapsed ? '72px' : '240px'
}))
</script>
