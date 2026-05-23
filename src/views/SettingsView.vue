<template>
  <div class="page settings-page">
    <div class="settings-header">
      <h1 style="display: flex; align-items: center; gap: var(--space-2);">
        <span>{{ routeMeta.icon }}</span>
        <span>{{ routeMeta.title }}</span>
      </h1>
      <p class="muted">Customize your laboratory environment and engine parameters</p>
    </div>

    <div class="settings-container glass-sm">
      <aside class="settings-nav">
        <button v-for="tab in tabs" :key="tab.id"
          class="settings-tab-btn" :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </aside>

      <main class="settings-content">
        <Transition name="fade-slide" mode="out-in">
          <div :key="activeTab" class="tab-pane">
            
            <!-- GENERAL SETTINGS -->
            <SettingsGeneralTab 
              v-if="activeTab === 'general'"
              v-model:soundEnabled="settings.soundEnabled"
              v-model:animationSpeed="settings.animationSpeed"
            />

            <!-- BOARD SETTINGS -->
            <SettingsBoardTab 
              v-if="activeTab === 'board'"
              v-model:boardTheme="settings.boardTheme"
              v-model:pieceTheme="settings.pieceTheme"
              v-model:showBestMoveArrow="settings.showBestMoveArrow"
              v-model:showThreatArrow="settings.showThreatArrow"
              v-model:showCoordinates="settings.showCoordinates"
            />

            <!-- ENGINE SETTINGS -->
            <SettingsEngineTab 
              v-if="activeTab === 'engine'"
              v-model:engineMultiPv="settings.engineMultiPv"
              v-model:analysisDepth="settings.analysisDepth"
              v-model:coachPersonality="settings.coachPersonality"
            />

            <!-- IDENTITY & DNA SETTINGS -->
            <SettingsIdentityTab 
              v-if="activeTab === 'identity'"
              v-model:username="editUsername"
              v-model:location="editLocation"
              v-model:chesscomHandle="editChessComUser"
              v-model:lichessHandle="editLichessUser"
              :isSaving="isSaving"
              :isSyncing="isSyncing"
              :saveError="saveError"
              :saveSuccess="saveSuccess"
              @save="saveIdentity"
              @sync="syncAllIntelligence"
              @deleteAccount="deleteAccount"
              @signOut="handleSignOut"
              @signIn="handleSignIn"
            />

            <!-- MAINTENANCE & DATABASE INTEGRITY -->
            <SettingsMaintenanceTab 
              v-if="activeTab === 'maintenance'"
            />

          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { supabase } from '../api/supabaseClient'

const route = useRoute()
const routeMeta = computed(() => ({
  title: route?.meta?.title || 'Codex of Rites',
  icon: route?.meta?.icon || '🗝️'
}))

// Pillar Components
import SettingsGeneralTab from '../components/settings/SettingsGeneralTab.vue'
import SettingsBoardTab from '../components/settings/SettingsBoardTab.vue'
import SettingsEngineTab from '../components/settings/SettingsEngineTab.vue'
import SettingsIdentityTab from '../components/settings/SettingsIdentityTab.vue'
import SettingsMaintenanceTab from '../components/settings/SettingsMaintenanceTab.vue'

// Pillar Composables
import { useSettingsNavigation } from '../composables/settings/useSettingsNavigation'
import { useSettingsIdentity } from '../composables/settings/useSettingsIdentity'

const settings = useSettingsStore()
const router = useRouter()

// Initialize Pillar Logic
const { activeTab, tabs } = useSettingsNavigation()
const { 
  editUsername, editLocation, editChessComUser, editLichessUser,
  isSaving, isSyncing, saveError, saveSuccess,
  saveIdentity, syncAllIntelligence, deleteAccount
} = useSettingsIdentity()

/**
 * Global Session Actions
 */
async function handleSignOut() {
  await supabase.auth.signOut()
  window.location.reload()
  router.push('/')
}

function handleSignIn() {
  document.dispatchEvent(new CustomEvent('open-auth'))
}
</script>

<style scoped>
.settings-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.settings-header {
  margin-bottom: var(--space-10);
  text-align: left;
}
.settings-header h1 { font-size: 2.2rem; margin-bottom: var(--space-2); }

.settings-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 600px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border);
}

.settings-nav {
  background: rgba(0,0,0,0.2);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-right: 1px solid var(--border);
}

.settings-tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}
.settings-tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
.settings-tab-btn.active { background: var(--accent); color: white; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }

.settings-content {
  padding: var(--space-10);
  background: rgba(255,255,255,0.01);
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

@media (max-width: 800px) {
  .settings-container { grid-template-columns: 1fr; }
  .settings-nav { flex-direction: row; overflow-x: auto; padding: var(--space-4); }
  .settings-tab-btn { white-space: nowrap; }
}
</style>
