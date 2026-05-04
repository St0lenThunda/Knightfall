<template>
  <div class="app-layout" :class="{ 'mobile-nav-open': mobileOpen }" :style="layoutStyle">
    <SideNav :mobile-open="mobileOpen" @close="mobileOpen = false" />
    
    <!-- Mobile Hamburger -->
    <button class="mobile-nav-toggle btn btn-icon glass-sm" @click="mobileOpen = !mobileOpen">
      <span v-if="!mobileOpen">☰</span>
      <span v-else>✕</span>
    </button>

    <main class="main-content" @click="mobileOpen = false">
      <RouterView />
    </main>
    <ToastProvider />
    <ConfirmModal />
    <ArchetypeModal />
    <AdminHud v-if="isDev || isTesting" />
    <TelemetryModal v-if="uiStore.isTelemetryOpen" :show="uiStore.isTelemetryOpen" @close="uiStore.isTelemetryOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideNav from './components/SideNav.vue'
import ToastProvider from './components/ToastProvider.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ArchetypeModal from './components/profile/modals/ArchetypeModal.vue'
import AdminHud from './components/AdminHud.vue'
import TelemetryModal from './components/TelemetryModal.vue'
import { useLibraryStore } from './stores/libraryStore'
import { useUserStore } from './stores/userStore'
import { useUiStore } from './stores/uiStore'
import { ref, onMounted, computed } from 'vue'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const isDev = import.meta.env.DEV
const isTesting = ref(false)
const mobileOpen = ref(false)

onMounted(() => {
  isTesting.value = !!(window as any).Playwright || navigator.userAgent.includes('Playwright')
  if (isTesting.value) {
    (window as any).store = userStore
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
    console.warn('[Knightfall] Initialization failed:', e)
  }
}

init()

const layoutStyle = computed(() => ({
  '--sidebar-width': uiStore.isSidebarCollapsed ? '72px' : '240px'
}))
</script>
