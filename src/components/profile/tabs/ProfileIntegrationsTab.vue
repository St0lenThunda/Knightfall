<script setup lang="ts">
import { computed } from 'vue'
import { Storage, StorageKey } from '../../../utils/storage'
import ProfileTabHeader from '../ProfileTabHeader.vue'
import IntegrationsPanel from '../IntegrationsPanel.vue'

/**
 * Pillar Component: ProfileIntegrationsTab
 * 
 * Manages external connections like Lichess or Chess.com.
 */
const isLichessLinked = computed(() => !!Storage.get(StorageKey.LICHESS_TOKEN, ''))
</script>

<template>
  <div class="integrations-tab-content">
    <ProfileTabHeader title="System Integrations">
      <template #stats>
        <span class="badge" :class="isLichessLinked ? 'badge-primary' : 'badge-outline'">
          Lichess: {{ isLichessLinked ? 'LINKED' : 'UNLINKED' }}
        </span>
      </template>
    </ProfileTabHeader>
    
    <IntegrationsPanel />
  </div>
</template>

<style scoped>
.integrations-tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}
</style>
