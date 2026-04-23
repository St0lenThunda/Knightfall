<template>
  <div class="page profile-page" :class="{ 'with-lab': activeTab === 'vault' }">
    <!-- Header: Navigation Tabs -->
    <div class="profile-nav-tabs glass-sm">
      <button class="profile-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        👤 Overview
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'vault' }" @click="activeTab = 'vault'">
        🗄️ Vault
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'constellation' }" @click="activeTab = 'constellation'">
        ✨ Constellation
      </button>
    </div>

    <div class="profile-content-wrapper">
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeTab" class="profile-tab-content" :class="{ 'with-sidebar': activeTab === 'vault' }">
          
          <!-- TAB 1: OVERVIEW (The Original Profile Dashboard) -->
          <div v-if="activeTab === 'overview'" class="overview-content">
            <div class="profile-header">
              <div class="profile-hero glass">
                <div class="profile-avatar">{{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}</div>
                <div class="profile-info">
                  <!-- View Mode -->
                  <template v-if="!isEditing">
                    <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2);">
                      <h2 style="margin: 0;">{{ userStore.profile?.username || 'Player' }}</h2>
                      <span class="title-badge" :style="{ color: coachStore.achievements.title.color, borderColor: coachStore.achievements.title.color }">
                        {{ coachStore.achievements.title.symbol }} {{ coachStore.achievements.title.label }}
                      </span>
                      <button class="btn-edit-inline" @click="startEdit" title="Edit username">✎</button>
                    </div>
                    <p class="muted" style="font-size: 0.9rem; margin-bottom: var(--space-3);">
                      Joined {{ joinedDate }}<span v-if="userStore.profile?.location"> · {{ userStore.profile.location }}</span>
                      <span v-if="userStore.profile?.chessComUsername" class="chess-com-tag"> · ♟ {{ userStore.profile.chessComUsername }}</span>
                      <span v-if="userStore.profile?.lichessUsername" class="lichess-tag"> · ♘ {{ userStore.profile.lichessUsername }}</span>
                    </p>
                    <div class="profile-badges">
                      <span v-for="b in coachStore.achievements.badges.filter(x => x.earned).slice(0, 5)" :key="b.id" class="tag">
                        {{ b.icon }} {{ b.label }}
                      </span>
                      <span class="tag muted" v-if="coachStore.achievements.badges.filter(x => x.earned).length === 0">No badges yet — start playing!</span>
                    </div>
                  </template>

                  <!-- Edit Mode -->
                  <template v-else>
                    <div style="display:flex; align-items:center; gap: var(--space-3); margin-bottom: var(--space-3);">
                      <h2 style="margin: 0; opacity: 0.4;">{{ userStore.profile?.username }}</h2>
                      <span style="font-size:0.8rem; color: var(--accent); font-weight: 600;">← Editing</span>
                    </div>
                    <form @submit.prevent="saveProfile" style="display:flex; flex-direction: column; gap: var(--space-3); max-width: 280px;">
                      <div>
                        <label class="label">New Username</label>
                        <input type="text" class="input" v-model="editUsername" required autofocus />
                      </div>
                      <div>
                        <label class="label">Location</label>
                        <input type="text" class="input" v-model="editLocation" placeholder="e.g. London, UK" />
                      </div>
                      <div>
                        <label class="label">Chess.com Username</label>
                        <input type="text" class="input" v-model="editChessComUser" placeholder="e.g. hikaru" />
                      </div>
                      <div>
                        <label class="label">Lichess Username</label>
                        <input type="text" class="input" v-model="editLichessUser" placeholder="e.g. thibault" />
                      </div>
                      <div style="display: flex; gap: var(--space-2);">
                        <button type="submit" class="btn btn-primary btn-sm" :disabled="isSaving">
                          {{ isSaving ? 'Saving...' : '✓ Save Changes' }}
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm" @click="isEditing = false" :disabled="isSaving">Cancel</button>
                      </div>
                    </form>
                  </template>
                </div>

                <div class="profile-rating-showcase">
                  <div class="rating-big">
                    <div class="label">Rapid Rating</div>
                    <div class="rating-num text-gradient">{{ userStore.currentRating }}</div>
                  </div>
                  <div class="rating-big">
                    <div class="label">Puzzle Rating</div>
                    <div class="rating-num" style="color: var(--gold);">{{ userStore.profile?.puzzle_rating ?? 1200 }}</div>
                  </div>
                  <div class="rating-big">
                    <div class="label">Badges</div>
                    <div class="rating-num" style="color: var(--teal);">{{ coachStore.achievements.earnedCount }}<span style="font-size:1rem; opacity:0.5;">/{{ coachStore.achievements.totalCount }}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile-layout">
              <div class="profile-left">
                <!-- WLD -->
                <div class="glass wld-card">
                  <h4 style="margin-bottom: var(--space-4);">Win / Loss / Draw</h4>
                  <div class="wld-visual">
                    <div class="wld-ring-container">
                      <svg viewBox="0 0 100 100" class="wld-ring">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12"
                          :stroke-dasharray="`${(wldData[0].pct / 100) * 251.3} 251.3`" stroke-dashoffset="251.3" stroke-linecap="round"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12"
                          :stroke-dasharray="`${(wldData[1].pct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - (wldData[0].pct / 100) * 251.3" stroke-linecap="round"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="12"
                          :stroke-dasharray="`${(wldData[2].pct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - ((wldData[0].pct + wldData[1].pct) / 100) * 251.3" stroke-linecap="round"/>
                      </svg>
                      <div class="wld-center">
                        <div class="wld-pct">{{ wldData[0].pct }}%</div>
                        <div class="label">Win rate</div>
                      </div>
                    </div>
                    <div class="wld-legend">
                      <div class="wld-row" v-for="r in wldData" :key="r.label">
                        <div class="wld-dot" :style="{ background: r.color }"></div>
                        <span>{{ r.label }}</span>
                        <span class="wld-count">{{ r.count }}</span>
                        <span class="wld-pct-small muted">{{ r.pct }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Top Openings -->
                <div class="glass opening-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Top Openings Played</h4>
                  </div>
                  <div class="opening-list">
                    <div v-for="o in openingStats.slice(0, 4)" :key="o.name" class="opening-row">
                      <div class="opening-info">
                        <div class="opening-name">{{ o.name }}</div>
                        <div class="opening-meta muted">{{ o.games }} games</div>
                      </div>
                      <div class="opening-stats">
                        <div class="mini-wld">
                          <div class="mini-wld-bar" :style="{ width: o.winPct + '%', background: 'var(--green)' }"></div>
                          <div class="mini-wld-bar" :style="{ width: o.drawPct + '%', background: 'var(--gold)' }"></div>
                          <div class="mini-wld-bar" :style="{ width: o.lossPct + '%', background: 'var(--rose)' }"></div>
                        </div>
                        <span style="font-size:0.8rem; font-weight:700; color: var(--green);">{{ o.winPct }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Badge Collection -->
                <div class="glass badge-showcase-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Badge Showcase</h4>
                    <span class="muted" style="font-size:0.8rem;">{{ coachStore.achievements.earnedCount }} / {{ coachStore.achievements.totalCount }} earned</span>
                  </div>

                  <div v-for="pillar in badgePillars" :key="pillar.id" style="margin-bottom: var(--space-5);">
                    <div class="badge-pillar-label">{{ pillar.icon }} {{ pillar.label }}</div>
                    <div class="badge-grid">
                      <div
                        v-for="b in coachStore.achievements.badges.filter(x => x.pillar === pillar.id)"
                        :key="b.id"
                        class="badge-item"
                        :class="{ 'badge-earned': b.earned, 'badge-locked': !b.earned }"
                        :title="b.description"
                      >
                        <div class="badge-icon">{{ b.icon }}</div>
                        <div class="badge-name">{{ b.label }}</div>
                        <div v-if="!b.earned && b.progress !== undefined" class="badge-progress-bar">
                          <div class="badge-progress-fill" :style="{ width: (b.progress * 100) + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="profile-right">
                <!-- Rating History -->
                <div class="glass rating-chart-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Rating History</h4>
                    <div class="tabs-mini">
                      <button v-for="p in periods" :key="p" class="tab-mini" :class="{ active: activePeriod === p }" @click="activePeriod = p">{{ p }}</button>
                    </div>
                  </div>
                  <div class="chart-container">
                    <div class="y-axis">
                      <span v-for="g in gridLines" :key="g.rating" class="axis-label">{{ g.rating }}</span>
                    </div>
                    <div class="chart-area">
                      <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="rating-svg" preserveAspectRatio="none">
                        <!-- Horizontal Grid Lines -->
                        <line v-for="g in gridLines" :key="g.rating" :x1="0" :y1="g.y" :x2="chartW" :y2="g.y" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                        
                        <!-- Main Path -->
                        <path :d="areaPath" fill="rgba(139,92,246,0.2)"/>
                        <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <div class="x-axis muted">
                    <span>{{ activePeriod === 'All' ? 'Start' : 'Previous' }}</span>
                    <span>Now</span>
                  </div>
                </div>

                <!-- Activity Heatmap -->
                <div class="glass activity-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Activity — Last 12 Weeks</h4>
                    <div class="heatmap-legend">
                      <span class="muted">Less</span>
                      <div class="heat-cell" style="background: rgba(255,255,255,0.04)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,0.25)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,0.5)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,0.75)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,1)"></div>
                      <span class="muted">More</span>
                    </div>
                  </div>
                  <div class="heatmap-container">
                    <div class="day-labels muted">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                    </div>
                    <div class="heatmap">
                      <div v-for="(week, wi) in heatmapData" :key="wi" class="heatmap-col">
                        <div v-for="(day, di) in week" :key="di" class="heat-cell" :style="{ background: heatColor(day) }"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Data Maintenance -->
                <div class="glass activity-card maintenance-card">
                  <div class="card-header">
                    <h4>Data Integrity</h4>
                  </div>
                  <p class="muted" style="font-size: 0.75rem; margin-top: 4px;">
                    Ensure your stats reflect unique games. Knightfall automatically deduplicates new imports, but you can manually trigger a deep scan here.
                  </p>
                  <div class="maintenance-actions" style="display: flex; gap: var(--space-4); margin-top: var(--space-4);">
                    <button class="btn btn-ghost btn-xs" @click="deduplicateVault">
                      🧹 Deduplicate Vault
                    </button>
                    <button class="btn btn-ghost btn-xs text-rose" @click="showWipeConfirm = true">
                      ⚠️ Nuclear Reset
                    </button>
                  </div>
                </div>

                <!-- Bulk Intelligence Center (Migrated from Vault) -->
                <div v-if="libraryStore.games.length > 0" class="intel-center glass" :class="{ 'is-active': libraryStore.isBulkAnalyzing }">
                  <div class="intel-header">
                    <div class="intel-title">
                      <span class="icon">🧠</span>
                      <div>
                        <div class="label">Bulk Intelligence Engine</div>
                        <div class="status muted">{{ intelStatusText }}</div>
                      </div>
                    </div>
                    <button 
                      @click="toggleIntel" 
                      class="btn btn-sm" 
                      :class="libraryStore.isBulkAnalyzing ? 'btn-ghost' : 'btn-primary'"
                    >
                      {{ libraryStore.isBulkAnalyzing ? '⏸ Pause Engine' : '🚀 Start Intel Engine' }}
                    </button>
                  </div>

                  <div v-if="libraryStore.isBulkAnalyzing" class="intel-progress-container">
                    <div class="intel-progress-bar">
                      <div class="intel-progress-fill" :style="{ width: libraryStore.analysisProgress + '%' }"></div>
                    </div>
                    <div class="intel-progress-stats muted">
                      <span>{{ libraryStore.analysisProgress }}% Analyzed</span>
                      <span v-if="libraryStore.currentAnalyzingId" class="game-id">Game: {{ libraryStore.currentAnalyzingId.slice(0, 8) }}</span>
                    </div>
                  </div>

                  <div v-if="libraryStore.isBulkAnalyzing" class="intel-metrics glass-xs">
                    <div class="metric">
                      <div class="m-label">Speed</div>
                      <div class="m-value">{{ (libraryStore.engineNodesPerSecond / 1000).toFixed(1) }}k nps</div>
                    </div>
                    <div class="metric">
                      <div class="m-label">Processed</div>
                      <div class="m-value">{{ libraryStore.totalMovesProcessed }} plies</div>
                    </div>
                    <div class="metric highlight-brilliant">
                      <div class="m-label">Brilliant</div>
                      <div class="m-value">✨ {{ libraryStore.brilliantMovesFound }}</div>
                    </div>
                    <div class="metric highlight-blunder">
                      <div class="m-label">Blunders</div>
                      <div class="m-value">🔴 {{ libraryStore.blundersFound }}</div>
                    </div>
                    <div class="metric">
                      <div class="m-label">ETA</div>
                      <div class="m-value">{{ libraryStore.estimatedTimeRemaining || 'Calculating...' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: VAULT (Game Archive) -->
          <div v-else-if="activeTab === 'vault'" class="vault-tab-content">
            <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Game Archive</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Personal DNA</span>
                  <span v-if="libraryStore.games.length > libraryStore.personalGames.length" class="badge badge-outline">📚 {{ libraryStore.games.length - libraryStore.personalGames.length }} Library Assets</span>
                  <span class="badge badge-outline" title="Games played natively on Knightfall">♞ {{ libraryStore.sourceBreakdown.knightfall }} Native</span>
                  <span class="badge badge-outline" title="Imported from Chess.com/Lichess">🌍 {{ libraryStore.sourceBreakdown.chessCom + libraryStore.sourceBreakdown.lichess }} Imported</span>
                  <span v-if="libraryStore.sourceBreakdown.other > 0" class="badge badge-outline" title="Manually uploaded or untagged games">📦 {{ libraryStore.sourceBreakdown.other }} Other</span>
                  <span class="badge">{{ ECO_COUNT }} Openings</span>
                </div>
              </div>
              <div class="header-actions">
                <button class="btn btn-ghost btn-sm" @click="deduplicateVault" title="Remove Duplicates">
                  🧹 Clean
                </button>
                <button class="btn btn-secondary btn-sm" @click="showLabModal = true">
                  📥 Import & Sources
                </button>
              </div>
            </header>
            <VaultPanel />
          </div>

          <!-- TAB 3: CONSTELLATION (Opening Tree) -->
          <div v-else-if="activeTab === 'constellation'" class="constellation-tab-content">
             <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Opening Constellation</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Analyzed DNA</span>
                  <span class="badge">{{ ECO_COUNT }} Known Variations</span>
                </div>
              </div>
            </header>
            <ConstellationPanel />
          </div>

        </div>
      </Transition>
    </div>

    <!-- Laboratory Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLabModal" class="modal-overlay" @click.self="showLabModal = false">
          <div class="glass-lg lab-modal">
            <header class="modal-header">
              <div class="title-group">
                <h3>Intelligence Lab</h3>
                <p class="muted">Manage your master collections and PGN imports</p>
              </div>
              <button class="btn-close" @click="showLabModal = false">✕</button>
            </header>
            <div class="modal-body">
              <LibraryLab />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Nuclear Wipe Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showWipeConfirm" class="modal-overlay" @click.self="showWipeConfirm = false">
          <div class="lab-modal glass-lg animated slideInUp" style="max-width: 400px; text-align: center;">
            <header class="modal-header" style="justify-content: center; flex-direction: column; gap: var(--space-2); border: none;">
              <span class="icon" style="font-size: 3rem; margin-bottom: 10px;">💣</span>
              <h2 class="text-rose" style="margin: 0;">Nuclear Reset</h2>
            </header>
            <div class="modal-body" style="padding: var(--space-4) var(--space-8);">
              <p style="font-size: 0.95rem; line-height: 1.5;">This will permanently delete <strong class="text-rose">ALL</strong> games, tags, and analysis data in your local Vault.</p>
              <p class="muted" style="font-size: 0.75rem; margin-top: var(--space-6); background: rgba(244,63,94,0.05); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(244,63,94,0.1);">
                This action is irreversible. All local analysis and imported collections will be lost.
              </p>
              
              <div class="cloud-wipe-opt" style="margin-top: var(--space-6); display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;" @click="wipeCloudToo = !wipeCloudToo">
                <input type="checkbox" v-model="wipeCloudToo" style="cursor: pointer;" />
                <span style="font-size: 0.8rem; font-weight: 700;" :class="{ 'text-rose': wipeCloudToo }">Also wipe my Cloud History</span>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: var(--space-4); padding: var(--space-8);">
              <button class="btn btn-ghost flex-1" @click="showWipeConfirm = false" :disabled="isWiping">
                Cancel
              </button>
              <button class="btn btn-primary bg-rose flex-1" @click="handleNuclearReset" :disabled="isWiping">
                {{ isWiping ? 'Wiping...' : 'Destroy All Data' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'
import { useUiStore } from '../stores/uiStore'
import { supabase } from '../api/supabaseClient'

// Tab Components
import VaultPanel from '../components/library/VaultPanel.vue'
import ConstellationPanel from '../components/library/ConstellationPanel.vue'
import LibraryLab from '../components/library/LibraryLab.vue'

const route = useRoute()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()
const uiStore = useUiStore()

const activeTab = ref<'overview' | 'vault' | 'constellation'>('overview')
const activePeriod = ref('1M')
const periods = ['1W', '1M', '3M', 'All']

const isEditing = ref(false)
const editUsername = ref('')
const editLocation = ref('')
const editChessComUser = ref('')
const editLichessUser = ref('')
const isSaving = ref(false)
const showLabModal = ref(false)
const showWipeConfirm = ref(false)
const wipeCloudToo = ref(false)
const isWiping = ref(false)

function toggleIntel() {
  if (libraryStore.isBulkAnalyzing) libraryStore.stopBulkAnalysis()
  else libraryStore.startBulkAnalysis()
}

const intelStatusText = computed(() => {
  if (libraryStore.isBulkAnalyzing) return 'Synthesizing personal patterns and App IQ...'
  const personal = libraryStore.personalGames.length
  const analyzed = libraryStore.personalGames.filter(g => g.evals && g.evals.length > 0).length
  return `DNA Coverage: ${analyzed} / ${personal} Snapshots`
})

const badgePillars = [
  { id: 'milestone', label: 'Milestones', icon: '🏅' },
  { id: 'mastery',   label: 'DNA Mastery', icon: '🧬' },
  { id: 'ritual',    label: 'Streaks & Rituals', icon: '🔥' },
]

async function deduplicateVault() {
  const count = await libraryStore.purgeDuplicates()
  uiStore.addToast(`Cleanup complete. Removed ${count} duplicate games.`, 'success')
}

async function handleNuclearReset() {
  isWiping.value = true
  try {
    if (wipeCloudToo.value) {
      await libraryStore.purgeCloudLibrary()
    }
    await libraryStore.resetLibrary()
    uiStore.addToast(wipeCloudToo.value ? 'Local & Cloud vaults wiped clean.' : 'Local vault wiped clean.', 'warning')
  } catch (err) {
    uiStore.addToast('Partial wipe failure. Check connection.', 'error')
  } finally {
    isWiping.value = false
    showWipeConfirm.value = false
    wipeCloudToo.value = false
  }
}

onMounted(async () => {
  await userStore.fetchUserData()
  
  // Handle tab from query param
  if (route.query.tab === 'vault') activeTab.value = 'vault'
  else if (route.query.tab === 'constellation') activeTab.value = 'constellation'
  
  // Trigger background maintenance
  libraryStore.repairVaultMetadata()
  libraryStore.syncCloudGames()
})

watch(() => route.query.tab, (tab) => {
  if (tab === 'vault') activeTab.value = 'vault'
  else if (tab === 'constellation') activeTab.value = 'constellation'
  else activeTab.value = 'overview'
})

watch(activeTab, (tab) => {
  libraryStore.isConstellationActive = (tab === 'constellation')
})

const ECO_COUNT = computed(() => {
  const ecos = new Set(libraryStore.games.map(g => g.eco))
  return ecos.size
})

const joinedDate = computed(() => {
  const raw = (userStore.session as any)?.user?.created_at
  if (!raw) return 'recently'
  return new Date(raw).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function startEdit() {
  editUsername.value = userStore.profile?.username ?? ''
  editLocation.value = (userStore.profile as any)?.location ?? ''
  editChessComUser.value = userStore.profile?.chessComUsername ?? ''
  editLichessUser.value = userStore.profile?.lichessUsername ?? ''
  isEditing.value = true
}

async function saveProfile() {
  const trimmed = editUsername.value.trim()
  if (!trimmed) return
  isSaving.value = true
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      username: trimmed, 
      location: editLocation.value.trim() || null 
    })
    .eq('id', userStore.session?.user.id)
  
  if (!error) {
    // Save platform usernames to localStorage for telemetry
    if (editChessComUser.value.trim()) {
      localStorage.setItem('knightfall_chesscom_username', editChessComUser.value.trim())
    } else {
      localStorage.removeItem('knightfall_chesscom_username')
    }
    
    if (editLichessUser.value.trim()) {
      localStorage.setItem('knightfall_lichess_username', editLichessUser.value.trim())
    } else {
      localStorage.removeItem('knightfall_lichess_username')
    }

    isEditing.value = false
    uiStore.addToast('Profile updated!', 'success')
    await userStore.fetchUserData()
  }
  isSaving.value = false
}

// Stats Helpers Tied to Personal DNA
const wldData = computed(() => {
  const stats = libraryStore.libraryWldStats
  const total = stats.total || 1 // Avoid division by zero
  return [
    { label: 'Wins', count: stats.win, pct: Math.round((stats.win / total) * 100), color: 'var(--green)' },
    { label: 'Losses', count: stats.loss, pct: Math.round((stats.loss / total) * 100), color: 'var(--rose)' },
    { label: 'Draws', count: stats.draw, pct: Math.round((stats.draw / total) * 100), color: 'var(--gold)' }
  ]
})
const openingStats = computed(() => libraryStore.openingStats)
const heatmapData = computed(() => libraryStore.activityHeatmap)
function heatColor(count: number) {
  if (count === 0) return 'rgba(255,255,255,0.04)'
  return `rgba(139,92,246, ${Math.min(1, count / 8)})`
}

// Rating Chart Tied to Personal Data
const chartW = 500, chartH = 120
const ratingData = computed(() => {
  const full = userStore.ratingHistory
  if (activePeriod.value === 'All') return full.map(h => h.rating)
  
  const now = new Date()
  let limit = new Date()
  if (activePeriod.value === '1W') limit.setDate(now.getDate() - 7)
  else if (activePeriod.value === '1M') limit.setMonth(now.getMonth() - 1)
  else if (activePeriod.value === '3M') limit.setMonth(now.getMonth() - 3)
  
  const filtered = full.filter(h => new Date(h.date) >= limit)
  // If no games in period, show the most recent rating as a flat line
  if (filtered.length === 0) {
    const lastRating = full.length > 0 ? full[full.length - 1].rating : 1200
    return [lastRating, lastRating]
  }
  // Ensure we have at least 2 points for a line
  const result = filtered.map(h => h.rating)
  if (result.length === 1) result.push(result[0])
  return result
})

const minR = computed(() => {
  const min = Math.min(...ratingData.value)
  return isNaN(min) ? 1100 : min - 20
})
const maxR = computed(() => {
  const max = Math.max(...ratingData.value)
  return isNaN(max) ? 1300 : max + 20
})

const chartPoints = computed(() => ratingData.value.map((r, i) => ({
  x: (i / (Math.max(1, ratingData.value.length - 1))) * chartW,
  y: chartH - ((r - minR.value) / (Math.max(1, maxR.value - minR.value))) * chartH,
})))

const linePath = computed(() => chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return `${line} L${chartW},${chartH} L0,${chartH} Z`
})

const gridLines = computed(() => {
  const diff = maxR.value - minR.value
  const steps = [0.1, 0.5, 0.9]
  return steps.map(s => {
    const val = minR.value + diff * s
    return {
      rating: Math.round(val),
      y: chartH - ((val - minR.value) / (maxR.value - minR.value)) * chartH
    }
  })
})
</script>

<style scoped>
.profile-page { padding: var(--space-6); }

.profile-nav-tabs {
  display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
  padding: 4px; border-radius: var(--radius-lg); width: fit-content;
}
.profile-tab {
  padding: var(--space-3) var(--space-6); border-radius: var(--radius-md);
  border: none; background: transparent; color: var(--text-secondary);
  font-weight: 700; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.profile-tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
.badge-accent { background: var(--accent); color: white; border: none; }
.badge-outline { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); }
.badge-ghost { background: rgba(255, 255, 255, 0.05); color: white; border: none; }
.profile-content-wrapper { display: block; min-width: 0; width: 100%; }
.profile-tab-content { min-width: 0; width: 100%; }

.tab-header { padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg); margin-bottom: var(--space-6); display: flex; align-items: center; justify-content: space-between; }
.header-info { display: flex; align-items: center; gap: var(--space-6); }
.header-stats { display: flex; gap: var(--space-2); }

/* Lab Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.lab-modal {
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 32px 64px rgba(0,0,0,0.6);
  position: relative;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(20px);
}

.lab-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.lab-modal .modal-header h3 { margin: 0; color: var(--accent-bright); }
.lab-modal .modal-body { flex: 1; overflow-y: auto; }

.btn-close {
  background: rgba(255,255,255,0.05);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-close:hover { background: var(--rose); transform: rotate(90deg); }

/* Modal Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.modal-enter-active .lab-modal, .modal-leave-active .lab-modal { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from .lab-modal, .modal-leave-to .lab-modal { transform: scale(0.9) translateY(20px); }

/* Profile Overview Styles */
.profile-hero { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-6); margin-bottom: var(--space-6); border-radius: var(--radius-xl); }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 0 32px rgba(139,92,246,0.3); }
.profile-rating-showcase { display: flex; gap: var(--space-8); margin-left: auto; }
.rating-big { text-align: center; }
.rating-num { font-size: 2rem; font-weight: 800; }

.profile-layout { display: grid; grid-template-columns: 350px 1fr; gap: var(--space-6); }
.wld-card, .opening-card, .rating-chart-card, .activity-card { padding: var(--space-5); border-radius: var(--radius-lg); }

.wld-visual { display: flex; align-items: center; gap: var(--space-6); }
.wld-ring-container { position: relative; width: 100px; height: 100px; flex-shrink: 0; }
.wld-ring { transform: rotate(-90deg); }
.wld-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wld-pct { font-size: 1.2rem; font-weight: 800; }

.wld-legend { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); min-width: 140px; }
.wld-row { display: flex; align-items: center; gap: var(--space-3); width: 100%; }
.wld-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.wld-row span:nth-child(2) { flex: 1; font-weight: 600; font-size: 0.85rem; }
.wld-count { font-weight: 800; color: var(--text-primary); }
.wld-pct-small { font-size: 0.75rem; min-width: 35px; text-align: right; }

.opening-list { display: flex; flex-direction: column; gap: var(--space-3); }
.opening-row { display: flex; align-items: center; gap: var(--space-3); }
.mini-wld { display: flex; height: 6px; width: 80px; border-radius: 3px; overflow: hidden; }

.chart-container { display: flex; gap: var(--space-3); }
.y-axis { display: flex; flex-direction: column-reverse; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); height: 120px; padding-bottom: 4px; }
.chart-area { flex: 1; height: 120px; position: relative; }
.rating-svg { width: 100%; height: 100%; overflow: visible; }
.x-axis { display: flex; justify-content: space-between; font-size: 0.65rem; margin-top: var(--space-2); margin-left: 35px; }

.heatmap-container { display: flex; gap: var(--space-3); align-items: flex-start; }
.day-labels { display: flex; flex-direction: column; justify-content: space-between; height: 90px; font-size: 0.6rem; padding: 4px 0; }
.heatmap-legend { display: flex; align-items: center; gap: 4px; font-size: 0.65rem; }
.heatmap-legend .heat-cell { width: 10px; height: 10px; border-radius: 2px; }

.heatmap { display: flex; gap: 4px; flex: 1; }
.heatmap-col { display: flex; flex-direction: column; gap: 4px; }
.heat-cell { width: 12px; height: 12px; border-radius: 2px; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

.chess-com-tag { color: var(--teal); font-weight: 600; }
.lichess-tag { color: var(--accent); font-weight: 600; }
.title-badge { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border: 1px solid currentColor; border-radius: 99px; }
.text-rose { color: var(--rose); }

/* Mini Tabs / Period Switcher */
.tabs-mini {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.tab-mini {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tab-mini:hover { color: white; background: rgba(255, 255, 255, 0.05); }
.tab-mini.active { background: var(--accent); color: white; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4); }

/* Badge Showcase Styles */
.badge-showcase-card { padding: var(--space-5); margin-top: var(--space-4); }
.badge-pillar-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.35);
  margin-bottom: var(--space-3);
}
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-3);
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-md);
  gap: var(--space-1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}
.badge-item:hover { transform: translateY(-2px); }
.badge-earned {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.badge-locked {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  opacity: 0.5;
  filter: grayscale(0.6);
}
.badge-icon { font-size: 1.4rem; line-height: 1; }
.badge-name {
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.8);
}
.badge-progress-bar {
  width: 100%;
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 1px;
  margin-top: 4px;
  overflow: hidden;
}
.badge-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.6s ease;
}

/* Intel Center Styles */
.intel-center {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-left: 4px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  margin-top: var(--space-4);
}
.intel-center.is-active {
  border-left-color: var(--accent);
  background: rgba(139, 92, 246, 0.05);
}
.intel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.intel-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.intel-title .icon { font-size: 1.5rem; }
.intel-title .label { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
.intel-title .status { font-size: 0.75rem; }

.intel-progress-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.intel-progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}
.intel-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.4s ease;
}
.intel-progress-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.game-id { opacity: 0.5; font-family: var(--font-mono); }

.intel-metrics {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.2);
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.metric .m-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
}
.metric .m-value {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-mono);
}
.metric.highlight-brilliant .m-value {
  color: var(--gold);
}
.metric.highlight-blunder .m-value {
  color: #f87171;
}
</style>
