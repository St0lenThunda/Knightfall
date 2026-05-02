<template>
  <div class="app-layout" :class="{ 'mobile-nav-open': mobileOpen }">
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
    <AdminHud v-if="!isTesting" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideNav from './components/SideNav.vue'
import ToastProvider from './components/ToastProvider.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ArchetypeModal from './components/profile/modals/ArchetypeModal.vue'
import AdminHud from './components/AdminHud.vue'
import { useLibraryStore } from './stores/libraryStore'
import { useUserStore } from './stores/userStore'
import { ref, onMounted } from 'vue'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
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
  await userStore.fetchUserData()
  await libraryStore.loadGames()
}

init()
</script>
