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
import { useUserStore } from './stores/userStore'

const userStore = useUserStore()
userStore.fetchUserData()
</script>
