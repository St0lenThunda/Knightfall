<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useUserStore } from '../stores/userStore'
import ScholarDashboard from '../components/home/ScholarDashboard.vue'

// Lazy load the landing sandbox since logged-in users don't need it
const LandingSandbox = defineAsyncComponent(() => import('../components/home/LandingSandbox.vue'))

const userStore = useUserStore()
</script>

<template>
  <div class="page home-page">
    <template v-if="userStore.session && userStore.profile">
      <ScholarDashboard />
    </template>
    <template v-else>
      <LandingSandbox />
    </template>
  </div>
</template>

<style scoped>
.home-page {
  padding: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}
</style>
