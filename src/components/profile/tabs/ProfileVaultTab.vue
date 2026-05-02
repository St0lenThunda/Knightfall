<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'
import { useLibraryStore } from '../../../stores/libraryStore'
import ProfileTabHeader from '../ProfileTabHeader.vue'
import VaultPanel from '../../library/VaultPanel.vue'

/**
 * Pillar Component: ProfileVaultTab
 * 
 * Manages the archive view of the user's games, providing quick filters
 * and access to the Intelligence Lab.
 */
const userStore = useUserStore()
const libraryStore = useLibraryStore()

const emit = defineEmits(['openLab'])

// ECO stats computed property
const ECO_COUNT = computed(() => libraryStore.ecoStats?.length || 0)

/**
 * Applies a quick filter to the library store.
 */
function applyQuickFilter(type: string) {
  libraryStore.setFilter(type)
}
</script>

<template>
  <div class="vault-tab-content">
    <ProfileTabHeader title="Game Archive">
      <template #stats>
        <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
        <span class="badge badge-accent filter-badge" @click="applyQuickFilter('My Games')">
          {{ libraryStore.personalGames.length }} Personal DNA
        </span>
        <span class="badge badge-outline filter-badge" @click="applyQuickFilter('native')">
          ♞ {{ libraryStore.sourceBreakdown.knightfall }} Native
        </span>
        <span class="badge">{{ ECO_COUNT }} Openings</span>
      </template>
      <template #actions>
        <button class="btn btn-ghost btn-sm" @click="libraryStore.loadGames">🔄 Refresh</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('openLab')">📥 Import & Sources</button>
      </template>
    </ProfileTabHeader>
    
    <VaultPanel />
  </div>
</template>

<style scoped>
.vault-tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}

.filter-badge {
  cursor: pointer;
  transition: transform 0.2s;
}

.filter-badge:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
}
</style>
