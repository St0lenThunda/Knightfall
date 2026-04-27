<script setup lang="ts">
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()

defineEmits(['deduplicateVault', 'showWipeConfirm'])
</script>

<template>
  <div class="glass card-v3 mt-6">
    <div class="card-header">
      <h4>Data Integrity & Maintenance</h4>
    </div>
    <div class="integrity-grid mt-6">
      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="libraryStore.syncCloudGames()">🔄 Refresh Cloud DNA</button>
        <p class="muted">Synchronize your local library with the cloud to download games played on other devices.</p>
      </div>
      
      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="libraryStore.pushLocalGamesToCloud()">☁️ Push Vault to Cloud</button>
        <p class="muted">Back up your local collection to Supabase for cross-device access and permanent safety.</p>
      </div>

      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="$emit('deduplicateVault')">🧹 Clean Duplicates</button>
        <p class="muted">Scan your entire vault for redundant entries and upgrade legacy games to high-precision IDs.</p>
      </div>

      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm text-rose" @click="$emit('showWipeConfirm')">⚠️ Nuclear Reset</button>
        <p class="muted">Wipe your entire local and cloud library. <strong class="text-rose">This action is permanent.</strong> Use with caution.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.integrity-grid { display: flex; flex-direction: column; gap: var(--space-4); }
.integrity-item { 
  display: grid; grid-template-columns: 200px 1fr; align-items: center; gap: var(--space-6); 
  padding: var(--space-4); background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); 
}
.integrity-item p { margin: 0; font-size: 0.85rem; }
.text-rose { color: var(--rose); }
</style>
