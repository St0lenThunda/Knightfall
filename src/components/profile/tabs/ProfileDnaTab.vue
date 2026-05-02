<script setup lang="ts">
import { useUserStore } from '../../../stores/userStore'
import { useLibraryStore } from '../../../stores/libraryStore'
import ProfileTabHeader from '../ProfileTabHeader.vue'
import DnaPanel from '../../library/DnaPanel.vue'

/**
 * Pillar Component: ProfileDnaTab
 * 
 * Displays the user's weakness patterns and performance ratings.
 */
const userStore = useUserStore()
const libraryStore = useLibraryStore()
</script>

<template>
  <div class="dna-tab-content">
    <ProfileTabHeader title="Weakness DNA Lab">
      <template #stats>
        <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
        <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Snapshots</span>
        <span class="badge badge-outline">App IQ: {{ libraryStore.performanceRating }}</span>
      </template>
    </ProfileTabHeader>
    
    <DnaPanel />
  </div>
</template>

<style scoped>
.dna-tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}
</style>
