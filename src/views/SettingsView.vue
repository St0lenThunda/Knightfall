<template>
  <div class="page settings-page">
    <div class="settings-header">
      <h1>Dashboard Settings</h1>
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
            <div v-if="activeTab === 'general'" class="settings-group">
              <h3>System</h3>
              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Sound Effects</div>
                  <div class="desc">Enable move sounds and notifications</div>
                </div>
                <div class="setting-action">
                  <input type="checkbox" v-model="settings.soundEnabled" class="toggle-switch" />
                </div>
              </div>

              <h3>Animations</h3>
              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Movement Speed</div>
                  <div class="desc">Control the velocity of pieces on the board</div>
                </div>
                <div class="setting-action">
                  <select v-model="settings.animationSpeed" class="custom-select">
                    <option value="instant">Instant</option>
                    <option value="fast">Fast</option>
                    <option value="normal">Standard</option>
                    <option value="slow">Cinematic</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- BOARD SETTINGS -->
            <div v-if="activeTab === 'board'" class="settings-group">
              <h3>Aesthetics</h3>
              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Board Theme</div>
                  <div class="desc">Select the visual material for the 64 squares</div>
                </div>
                <div class="setting-action">
                   <div class="theme-grid">
                      <div v-for="t in boardThemes" :key="t.id" 
                        class="theme-thumb" :class="{ active: settings.boardTheme === t.id }"
                        @click="settings.boardTheme = t.id as any">
                        <div class="thumb-preview" :style="{ background: t.color }"></div>
                        <span>{{ t.label }}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Piece Set</div>
                  <div class="desc">Classic uses fast unicode glyphs. Neo and Glass use high-res local image assets.</div>
                </div>
                <div class="setting-action">
                  <select v-model="settings.pieceTheme" class="custom-select">
                    <option value="classic">Classic (Unicode)</option>
                    <option value="neo">Neo-Obsidian (HD)</option>
                    <option value="glass">Holographic Glass (HD)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ENGINE SETTINGS -->
            <div v-if="activeTab === 'engine'" class="settings-group">
              <h3>Computational Power</h3>
              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Multi-PV Mode</div>
                  <div class="desc">Number of alternative lines Stockfish calculates simultaneously</div>
                </div>
                <div class="setting-action">
                  <div class="number-stepper">
                     <button @click="settings.engineMultiPv = Math.max(1, settings.engineMultiPv - 1)">-</button>
                     <span>{{ settings.engineMultiPv }}</span>
                     <button @click="settings.engineMultiPv = Math.min(5, settings.engineMultiPv + 1)">+</button>
                  </div>
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Target Analysis Depth</div>
                  <div class="desc">The default depth the AI Coach waits for before giving feedback</div>
                </div>
                <div class="setting-action">
                  <select v-model="settings.analysisDepth" class="custom-select">
                    <option :value="10">Depth 10 (Fastest)</option>
                    <option :value="15">Depth 15 (Balanced)</option>
                    <option :value="20">Depth 20 (Deep)</option>
                    <option :value="24">Depth 24 (Grandmaster)</option>
                  </select>
                </div>
              </div>

              <h3>AI Coaching Personality</h3>
              <div class="setting-row">
                <div class="setting-info">
                  <div class="label">Coach Archetype</div>
                  <div class="desc">Affects the tone and style of analysis feedback</div>
                </div>
                <div class="setting-action">
                  <select v-model="settings.coachPersonality" class="custom-select">
                    <option value="encouraging">Encouraging (Standard)</option>
                    <option value="strict">Strict (Direct)</option>
                    <option value="socratic">Socratic (Questioning)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ACCOUNT SETTINGS -->
            <div v-if="activeTab === 'account'" class="settings-group">
              <h3>Identity</h3>
              <div class="setting-row" v-if="userStore.profile">
                <div class="setting-info">
                  <div class="label">Connected as {{ userStore.profile.username }}</div>
                  <div class="desc">{{ userStore.profile.email }}</div>
                </div>
                <div class="setting-action">
                  <button class="btn btn-ghost btn-sm" @click="handleSignOut">Sign Out</button>
                </div>
              </div>
              <div class="setting-row" v-else>
                <div class="setting-info">
                  <div class="label">Guest Mode</div>
                  <div class="desc">Sign in to sync your library across devices</div>
                </div>
                <div class="setting-action">
                  <button class="btn btn-primary btn-sm" @click="handleSignIn">Create Account</button>
                </div>
              </div>
            </div>

          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

const settings = useSettingsStore()
const userStore = useUserStore()
const router = useRouter()

const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'board', label: 'Board & Style', icon: '🎨' },
  { id: 'engine', label: 'Engine', icon: '🧠' },
  { id: 'account', label: 'Account', icon: '👤' },
]

const boardThemes = [
  { id: 'classic', label: 'Classic', color: '#8ca2ad' },
  { id: 'wood', label: 'Wood', color: '#b58863' },
  { id: 'obsidian', label: 'Obsidian', color: '#2a2a2a' },
]

function handleSignOut() {
  userStore.signOut()
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

.settings-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

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

.custom-select {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  outline: none;
  min-width: 180px;
}

.toggle-switch {
  width: 44px;
  height: 22px;
  appearance: none;
  background: #3f3f46;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}
.toggle-switch:checked { background: var(--accent); }
.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}
.toggle-switch:checked::after { transform: translateX(22px); }

.number-stepper {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-elevated);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.number-stepper button {
  width: 24px; height: 24px;
  background: rgba(255,255,255,0.05);
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.number-stepper span { font-weight: 700; min-width: 20px; text-align: center; }

.theme-grid {
  display: flex;
  gap: var(--space-3);
}
.theme-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.thumb-preview {
  width: 60px; height: 40px;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.theme-thumb.active .thumb-preview { border-color: var(--accent); scale: 1.05; }
.theme-thumb span { font-size: 0.75rem; color: var(--text-muted); }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

@media (max-width: 800px) {
  .settings-container { grid-template-columns: 1fr; }
  .settings-nav { flex-direction: row; overflow-x: auto; padding: var(--space-4); }
  .settings-tab-btn { white-space: nowrap; }
}
</style>
