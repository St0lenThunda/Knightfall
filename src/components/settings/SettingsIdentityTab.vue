<script setup lang="ts">
/**
 * Settings Identity Tab
 * 
 * Manages user profile data and external account integrations.
 */
import { useUserStore } from '../../stores/userStore'

const userStore = useUserStore()

defineProps<{
  username: string
  location: string
  chesscomHandle: string
  lichessHandle: string
  isSaving: boolean
  isSyncing: boolean
  saveError: string
  saveSuccess: boolean
}>()

const emit = defineEmits([
  'update:username', 
  'update:location', 
  'update:chesscomHandle', 
  'update:lichessHandle',
  'save',
  'sync',
  'signOut',
  'signIn'
])
</script>

<template>
  <div class="settings-group">
    <h3>Knightfall Identity</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Public Username</div>
        <div class="desc">How you appear in the global laboratory rankings and DNA profiles</div>
      </div>
      <div class="setting-action">
        <input 
          type="text" 
          :value="username" 
          @input="emit('update:username', ($event.target as HTMLInputElement).value)"
          class="custom-input" 
          placeholder="Enter username..." 
        />
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Geographic Location</div>
        <div class="desc">Displayed on your profile coordinates and local mapping</div>
      </div>
      <div class="setting-action">
        <input 
          type="text" 
          :value="location" 
          @input="emit('update:location', ($event.target as HTMLInputElement).value)"
          class="custom-input" 
          placeholder="City, Country..." 
        />
      </div>
    </div>

    <h3>External DNA Sources</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Chess.com Integration</div>
        <div class="desc">External handle for PGN intelligence ingestion</div>
      </div>
      <div class="setting-action">
        <input 
          type="text" 
          :value="chesscomHandle" 
          @input="emit('update:chesscomHandle', ($event.target as HTMLInputElement).value)"
          class="custom-input" 
          placeholder="Chess.com username" 
        />
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Lichess Integration</div>
        <div class="desc">External handle for open-source DNA synchronization</div>
      </div>
      <div class="setting-action">
        <input 
          type="text" 
          :value="lichessHandle" 
          @input="emit('update:lichessHandle', ($event.target as HTMLInputElement).value)"
          class="custom-input" 
          placeholder="Lichess username" 
        />
      </div>
    </div>

    <div class="settings-actions mt-6">
      <button @click="emit('save')" class="btn btn-primary" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Changes' }}
      </button>
      <button @click="emit('sync')" class="btn btn-ghost" :disabled="isSyncing">
        {{ isSyncing ? 'Synchronizing DNA...' : '⚡ Manual DNA Sync' }}
      </button>
      <div v-if="saveError" class="text-danger" style="width: 100%; margin-top: 8px; font-size: 0.85rem;">
        {{ saveError }}
      </div>
    </div>

    <h3>Authentication & Session</h3>
    <div class="setting-row" v-if="userStore.profile">
      <div class="setting-info">
        <div class="label">Connected as {{ userStore.profile.username }}</div>
        <div class="desc">{{ userStore.session?.user?.email }}</div>
      </div>
      <div class="setting-action">
        <button class="btn btn-ghost btn-sm" @click="emit('signOut')">Sign Out</button>
      </div>
    </div>
    <div class="setting-row" v-else>
      <div class="setting-info">
        <div class="label">Guest Mode</div>
        <div class="desc">Sign in to sync your library across devices</div>
      </div>
      <div class="setting-action">
        <button class="btn btn-primary btn-sm" @click="emit('signIn')">Create Account</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-group { display: flex; flex-direction: column; gap: var(--space-6); }

.settings-group h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
  margin-bottom: var(--space-2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-10);
}

.setting-info { flex: 1; }
.setting-info .label { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.setting-info .desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

.custom-input {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  outline: none;
  min-width: 220px;
  transition: all 0.2s;
}
.custom-input:focus { border-color: var(--accent); background: rgba(255,255,255,0.05); }

.settings-actions {
  display: flex;
  gap: var(--space-4);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255,255,255,0.05);
  flex-wrap: wrap;
}
</style>
