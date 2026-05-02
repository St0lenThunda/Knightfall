<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'
import { useLibraryStore } from '../../../stores/libraryStore'
import ProfileTabHeader from '../ProfileTabHeader.vue'
import ConstellationPanel from '../../library/ConstellationPanel.vue'

/**
 * Pillar Component: ProfileConstellationTab
 * 
 * Displays the opening repertoire visualization.
 */
const userStore = useUserStore()
const libraryStore = useLibraryStore()

const ECO_COUNT = computed(() => libraryStore.ecoStats?.length || 0)
</script>

<template>
  <div class="constellation-tab-content">
    <ProfileTabHeader title="Opening Constellation">
      <template #stats>
        <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
        <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Analyzed DNA</span>
        <span class="badge">{{ ECO_COUNT }} Variations</span>
      </template>
    </ProfileTabHeader>
    
    <ConstellationPanel />
  </div>
</template>

<style scoped>
.constellation-tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}
</style>
