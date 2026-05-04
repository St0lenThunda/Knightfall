<script setup lang="ts">
import { computed } from 'vue'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUserStore } from '../../../stores/userStore'
import ProfileTabHeader from '../ProfileTabHeader.vue'
import VaultPanel from '../../library/VaultPanel.vue'

const libraryStore = useLibraryStore()
const userStore = useUserStore()

const emit = defineEmits(['openLab'])

// ECO stats computed property
const ECO_COUNT = computed(() => libraryStore.ecoStats?.length || 0)

/**
 * Applies a quick filter to the library store.
 */
function applyQuickFilter(type: string) {
  libraryStore.setFilter(type)
}

/**
 * Triggers the global auth modal.
 */
function openAuth() {
  document.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }))
}
</script>

<template>
  <div class="vault-tab-content">
    <ProfileTabHeader title="Game Archive">
      <template #stats>
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
    
    <!-- Guest View Banner -->
    <div v-if="!userStore.session" class="guest-banner glass-sm mb-4">
      <div class="banner-icon">🕵️</div>
      <div class="banner-content">
        <h4>Curated View Active</h4>
        <p>You are viewing the <strong>Knightfall Intelligence Vault</strong>. Log in to sync your personal archive and analyze your performance DNA.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openAuth">Identify Yourself</button>
    </div>

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

/* Guest Banner Styles */
.guest-banner {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-8);
  border-radius: var(--radius-lg);
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  margin-bottom: var(--space-4);
  animation: slideDown 0.4s var(--ease);
}

.banner-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4));
}

.banner-content {
  flex: 1;
}

.banner-content h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: var(--accent-bright);
}

.banner-content p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
