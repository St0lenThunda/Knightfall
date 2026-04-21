<template>
  <div class="app-layout">
    <SideNav />
    <main class="main-content">
      <RouterView />
    </main>
    <ToastProvider />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideNav from './components/SideNav.vue'
import ToastProvider from './components/ToastProvider.vue'
import { useLibraryStore } from './stores/libraryStore'
import { useUserStore } from './stores/userStore'
import { useUiStore } from './stores/uiStore'
import { invoke } from '@tauri-apps/api/core'
import { useDatabase } from './composables/useDatabase'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const db = useDatabase()

const init = async () => {
  await userStore.fetchUserData()
  await libraryStore.loadGames()
  
  // TAURI TEST: Prove the Rust bridge works
  try {
    const response = await invoke('greet', { name: userStore.profile?.username || 'Pilot' })
    uiStore.addToast(response, 'info')

    // DUCKDB TEST: Initialize a dummy table locally
    await db.execute('CREATE TABLE IF NOT EXISTS system_log (event TEXT, timestamp TIMESTAMP)')
    await db.execute('INSERT INTO system_log VALUES (\'App Started\', now())')
    const queryTest = await db.execute('SELECT * FROM system_log')
    console.log('DuckDB Select Test:', queryTest)
  } catch (err) {
    console.error('Tauri invoke failed:', err)
  }
}

init()
</script>
