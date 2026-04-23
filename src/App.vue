<template>
  <div class="app-layout">
    <SideNav />
    <main class="main-content">
      <RouterView />
    </main>
    <ToastProvider />
    <AdminHud />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideNav from './components/SideNav.vue'
import ToastProvider from './components/ToastProvider.vue'
import AdminHud from './components/AdminHud.vue'
import { useLibraryStore } from './stores/libraryStore'
import { useUserStore } from './stores/userStore'

const userStore = useUserStore()
const libraryStore = useLibraryStore()

const init = async () => {
  await userStore.fetchUserData()
  await libraryStore.loadGames()
}

init()
</script>
