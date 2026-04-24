<template>
  <div class="page profile-page" :class="{ 'with-lab': activeTab === 'vault' }">
    <!-- Header: Navigation Tabs -->
    <div class="profile-nav-tabs glass-sm">
      <button class="profile-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        ⚡ War Room
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'dna' }" @click="activeTab = 'dna'">
        🧬 Soul Mapping
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'vault' }" @click="activeTab = 'vault'">
        🗄️ Archives
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
                  <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2);">
                    <h2 style="margin: 0;">{{ userStore.profile?.username || 'Player' }}</h2>
                    <span class="title-badge" :style="{ color: coachStore.achievements.title.color, borderColor: coachStore.achievements.title.color }">
                      {{ coachStore.achievements.title.symbol }} {{ coachStore.achievements.title.label }}
                    </span>
                    <button class="btn-edit-inline" @click="router.push('/settings?tab=identity')" title="Laboratory Settings">⚙️ Settings</button>
                  </div>
                  <p class="muted" style="font-size: 0.9rem; margin-bottom: var(--space-3);">
                    Joined {{ joinedDate }}<span v-if="userStore.profile?.location"> · {{ userStore.profile.location }}</span>
                  </p>
                  
                  <!-- External Connections Card -->
                  <div class="identity-connections mt-4">
                    <div v-if="userStore.profile?.chessComUsername" class="connection-pill chess-com">
                      <span class="icon">♟</span>
                      <span class="name">{{ userStore.profile.chessComUsername }}</span>
                      <span class="platform">Chess.com</span>
                    </div>
                    <div v-if="userStore.profile?.lichessUsername" class="connection-pill lichess">
                      <span class="icon">♘</span>
                      <span class="name">{{ userStore.profile.lichessUsername }}</span>
                      <span class="platform">Lichess</span>
                    </div>
                    <div v-if="!userStore.profile?.chessComUsername && !userStore.profile?.lichessUsername" class="muted-xs">
                      No external DNA sources linked.
                    </div>
                  </div>

                  <div class="profile-badges mt-6">
                    <span v-for="b in coachStore.achievements.badges.filter(x => x.earned).slice(0, 3)" :key="b.id" class="tag">
                      {{ b.icon }} {{ b.label }}
                    </span>
                    <button v-if="coachStore.achievements.badges.filter(x => x.earned).length > 3" class="tag btn-ghost" @click="showBadgeModal = true">
                      +{{ coachStore.achievements.badges.filter(x => x.earned).length - 3 }} More
                    </button>
                  </div>
                </div>

                <div class="profile-rating-showcase">
                  <div class="rating-big" title="A performance rating synthesized from all games in your vault using Knightfall intelligence algorithms.">
                    <div class="label">Knightfall Elo</div>
                    <div class="rating-num text-gradient">♔ {{ libraryStore.performanceRating }}</div>
                  </div>
                  <div class="rating-big" title="Your current live Rapid rating synchronized from external platforms.">
                    <div class="label">Rapid Rating</div>
                    <div class="rating-num" style="color: var(--teal);">{{ userStore.currentRating }}</div>
                  </div>
                  <div class="rating-big" title="Your estimated puzzle-solving proficiency based on processed tactical scenarios.">
                    <div class="label">Puzzle Rating</div>
                    <div class="rating-num" style="color: var(--gold);">{{ userStore.profile?.puzzle_rating ?? 1200 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dashboard-grid-v4">
              <!-- ROW 1: LIBRARY IQ (FULL WIDTH) -->
              <div class="library-iq-full glass mb-6">
                <div class="card-header">
                  <h4>🧠 Library Intelligence Quotient</h4>
                </div>
                <div class="library-iq-grid mt-6">
                  <div v-for="stat in vaultStats" :key="stat.label" class="meta-stat" :title="stat.desc">
                    <div class="label">{{ stat.label }}</div>
                    <div class="val" :style="{ color: stat.color || 'inherit' }">{{ stat.val }}</div>
                  </div>
                </div>
              </div>

              <!-- ROW 2: RECENT ACTIVITY (2 COL) & CLINIC (1 COL) -->
              <div class="glass card-v3 span-2">
                <div class="card-header">
                  <h4>Recent Activity</h4>
                  <button @click="activeTab = 'vault'" class="btn-cleanup-text">VIEW ALL →</button>
                </div>
                <div class="game-list-merged mt-4">
                  <div v-for="g in recentGames" :key="g.id" class="game-row-merged" @click="router.push('/analysis?id=' + g.id)">
                    <div class="game-result-dot" :class="g.result"></div>
                    <div class="game-info">
                      <span class="game-opponent">vs {{ g.opponent }}</span>
                      <span class="game-meta muted">{{ g.control }} · {{ g.opening }}</span>
                    </div>
                    <div class="game-score" :class="g.result">{{ g.score }}</div>
                  </div>
                </div>
              </div>

              <div v-if="miniRx.length > 0" class="glass card-v3">
                <div class="card-header">
                  <h4>📋 The Clinic</h4>
                </div>
                <div class="mini-prescriptions mt-4">
                  <div v-for="rx in miniRx" :key="rx.id" class="mini-rx-item" :class="rx.severity">
                    <span class="rx-icon">{{ rx.icon }}</span>
                    <div class="rx-info">
                      <div class="rx-title">{{ rx.title }}</div>
                      <button @click="router.push(rx.link)" class="btn btn-xs btn-primary mt-2">{{ rx.linkText }}</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ROW 3: PERFORMANCE RATIO (2 COL) & DNA SNAPSHOT (1 COL) -->
              <div class="glass card-v3 span-2">
                <div class="card-header">
                  <h4>Performance Ratio</h4>
                  <div class="wld-stats-summary">
                    <span class="wld-stat text-green">{{ libraryStore.libraryWldStats.win }}W</span>
                    <span class="wld-stat text-gold">{{ libraryStore.libraryWldStats.draw }}D</span>
                    <span class="wld-stat text-rose">{{ libraryStore.libraryWldStats.loss }}L</span>
                  </div>
                </div>
                <div class="wld-layout-v2 mt-6">
                  <div class="wld-ring-container-v2">
                    <svg viewBox="0 0 100 100" class="wld-ring">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12" :stroke-dasharray="`${(libraryStore.libraryWldStats.winPct / 100) * 251.3} 251.3`" stroke-dashoffset="251.3" stroke-linecap="round"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12" :stroke-dasharray="`${(libraryStore.libraryWldStats.lossPct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - (libraryStore.libraryWldStats.winPct / 100) * 251.3" stroke-linecap="round"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="12" :stroke-dasharray="`${(libraryStore.libraryWldStats.drawPct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - ((libraryStore.libraryWldStats.winPct + libraryStore.libraryWldStats.lossPct) / 100) * 251.3" stroke-linecap="round"/>
                    </svg>
                    <div class="wld-center">
                      <div class="wld-pct">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</div>
                      <div class="label">Accuracy</div>
                    </div>
                  </div>
                  <div class="wld-breakdown-v2">
                    <div class="breakdown-row" title="Total victories achieved in personal DNA games.">
                      <div class="dot bg-green"></div>
                      <span class="label">Wins</span>
                      <span class="val">{{ libraryStore.libraryWldStats.win }}</span>
                      <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</span>
                    </div>
                    <div class="breakdown-row" title="Total defeats sustained in personal DNA games.">
                      <div class="dot bg-rose"></div>
                      <span class="label">Losses</span>
                      <span class="val">{{ libraryStore.libraryWldStats.loss }}</span>
                      <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.lossPct) }}%</span>
                    </div>
                    <div class="breakdown-row" title="Games ending in a draw or stalemate.">
                      <div class="dot bg-gold"></div>
                      <span class="label">Draws</span>
                      <span class="val">{{ libraryStore.libraryWldStats.draw }}</span>
                      <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.drawPct) }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="glass card-v3">
                <div class="card-header">
                  <h4>🧬 Weakness DNA</h4>
                </div>
                <div class="weakness-items mt-4">
                  <div v-for="w in weaknesses" :key="w.label" class="weakness-item">
                    <div class="weakness-label">
                      <span>{{ w.icon }} {{ w.label }}</span>
                      <span class="muted">{{ w.pct }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-bar-fill" :style="{ width: w.pct + '%', background: w.color }"></div>
                    </div>
                  </div>
                </div>
                <button @click="activeTab = 'dna'" class="btn btn-ghost btn-xs w-full mt-4">Full Lab →</button>
              </div>

              <!-- ROW 4: PERFORMANCE HISTORY (2 COL) & TOP OPENINGS (1 COL) -->
              <div class="glass card-v3 span-2">
                <div class="card-header">
                  <h4>Performance History</h4>
                  <div class="chart-legend">
                    <span class="legend-item"><span class="dot bg-accent"></span> Rating</span>
                    <span class="legend-item"><span class="dot bg-teal"></span> Avg Elo</span>
                  </div>
                </div>
                <div class="perf-history-container mt-6">
                  <div class="y-axis">
                    <span>2400</span>
                    <span>2000</span>
                    <span>1600</span>
                    <span>1200</span>
                  </div>
                  <div class="chart-main">
                    <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="rating-svg-full" preserveAspectRatio="none">
                      <path :d="areaPath" fill="rgba(139,92,246,0.1)"/>
                      <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    <div class="x-axis">
                      <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="glass card-v3">
                <div class="card-header">
                  <h4>Top Openings</h4>
                </div>
                <div class="opening-list-merged mt-4">
                  <div v-for="o in openingStats.slice(0, 6)" :key="o.name" class="opening-row-merged">
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
                    </div>
                  </div>
                </div>
              </div>

              <!-- ROW 5: DATA INTEGRITY (FULL WIDTH) -->
              <div class="glass card-v3 span-3">
                <div class="card-header">
                  <h4>Data Integrity & Maintenance</h4>
                </div>
                <div class="integrity-actions mt-4 flex-col h-full justify-between">
                  <p class="muted" style="font-size: 0.85rem;">
                    Keep your local vault optimized by removing redundant entries or performing a complete system reset.
                  </p>
                  <div style="display: flex; gap: var(--space-4); justify-content: flex-end;">
                    <button class="btn btn-ghost btn-sm" @click="deduplicateVault">🧹 Clean Duplicates</button>
                    <button class="btn btn-ghost btn-sm text-rose" @click="showWipeConfirm = true">⚠️ Nuclear Reset</button>
                  </div>
                </div>
              </div>

              <!-- ADMINISTRATIVE TASKS: FULL WIDTH AT BOTTOM -->
              <div class="admin-full-row mt-10 mb-10">
                <div class="admin-separator">
                  <span class="admin-title">System Intelligence</span>
                  <div class="admin-line"></div>
                </div>

                <!-- BULK INTELLIGENCE WITH FULL TELEMETRY -->
                <div class="intel-center-bottom glass mt-6" :class="{ 'is-active': libraryStore.isBulkAnalyzing, 'is-finished': libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0 }">
                  <div class="intel-content">
                    <div class="intel-info">
                      <span class="intel-icon">{{ libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing ? '✅' : '🧠' }}</span>
                      <div class="intel-text">
                        <h3>{{ libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing ? 'Synthesis Complete' : 'Bulk Intelligence & Pattern Synthesis' }}</h3>
                        <p class="muted">{{ intelStatusText }}</p>
                      </div>
                    </div>
                    
                    <div class="intel-actions">
                      <!-- Active Telemetry -->
                      <div v-if="libraryStore.isBulkAnalyzing" class="intel-telemetry-active">
                        <div class="telemetry-item">
                          <span class="label">NPS</span>
                          <span class="val">{{ Math.round(libraryStore.engineNodesPerSecond / 1000) }}k</span>
                        </div>
                        <div class="telemetry-item">
                          <span class="label">ETA</span>
                          <span class="val text-accent">{{ libraryStore.estimatedTimeRemaining || '--' }}</span>
                        </div>
                        <div class="telemetry-item">
                          <span class="label text-rose">Blunders</span>
                          <span class="val">{{ libraryStore.blundersFound }}</span>
                        </div>
                        <div class="telemetry-item">
                          <span class="label text-teal">Brilliants</span>
                          <span class="val">{{ libraryStore.brilliantMovesFound }}</span>
                        </div>
                      </div>

                      <!-- Finished Summary -->
                      <div v-if="libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0" class="intel-summary-finish">
                        <div class="summary-stat">
                          <span class="val">{{ libraryStore.totalMovesProcessed }}</span>
                          <span class="label">Moves Processed</span>
                        </div>
                        <div class="summary-stat">
                          <span class="val text-rose">{{ libraryStore.blundersFound }}</span>
                          <span class="label">Weaknesses Found</span>
                        </div>
                      </div>

                      <!-- Progress & Toggle -->
                      <div class="intel-main-action">
                        <div v-if="libraryStore.isBulkAnalyzing" class="intel-progress-container-v2">
                          <div class="intel-progress-bar-v2">
                            <div class="intel-progress-fill-v2" :style="{ width: libraryStore.analysisProgress + '%' }"></div>
                          </div>
                          <span class="progress-pct-v2">{{ Math.round(libraryStore.analysisProgress) }}%</span>
                        </div>
                        <button @click="toggleIntel" class="btn" :class="libraryStore.isBulkAnalyzing ? 'btn-ghost' : 'btn-primary'">
                          {{ libraryStore.isBulkAnalyzing ? 'Pause' : (libraryStore.analysisProgress === 100 ? 'Restart' : 'Start Synthesis') }}
                        </button>
                      </div>
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

          <!-- TAB 4: DNA (Consolidated Intelligence) -->
          <div v-else-if="activeTab === 'dna'" class="dna-tab-content">
             <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Weakness DNA Lab</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Analyzed Snapshots</span>
                  <span class="badge badge-outline">App IQ: {{ libraryStore.performanceRating }}</span>
                </div>
              </div>
            </header>
            <DnaPanel />
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
    <!-- Badge Showcase Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBadgeModal" class="modal-overlay" @click.self="showBadgeModal = false">
          <div class="glass-lg badge-modal">
            <header class="modal-header">
              <div class="title-group">
                <h3>Badge Showcase</h3>
                <p class="muted">Your achievements and milestones</p>
              </div>
              <button class="btn-close" @click="showBadgeModal = false">✕</button>
            </header>
            <div class="modal-body">
              <div v-for="pillar in badgePillars" :key="pillar.id" class="badge-pillar">
                <div class="badge-pillar-label">{{ pillar.icon }} {{ pillar.label }}</div>
                <div class="badge-grid">
                  <div v-for="b in coachStore.achievements.badges.filter(x => x.pillar === pillar.id)" :key="b.id" 
                    class="badge-item" :class="b.earned ? 'badge-earned' : 'badge-locked'"
                    :title="b.description">
                    <span class="badge-icon">{{ b.icon }}</span>
                    <span class="badge-name">{{ b.label }}</span>
                    <div v-if="!b.earned && b.progress !== undefined" class="badge-progress-bar">
                      <div class="badge-progress-fill" :style="{ width: b.progress + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'
import { useUiStore } from '../stores/uiStore'

// Tab Components
import VaultPanel from '../components/library/VaultPanel.vue'
import ConstellationPanel from '../components/library/ConstellationPanel.vue'
import DnaPanel from '../components/library/DnaPanel.vue'
import LibraryLab from '../components/library/LibraryLab.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()
const uiStore = useUiStore()

const activeTab = ref<'overview' | 'dna' | 'vault' | 'constellation'>('overview')
const activePeriod = ref('1M')

const isWiping = ref(false)

const showLabModal = ref(false)
const showWipeConfirm = ref(false)
const showBadgeModal = ref(false)
const wipeCloudToo = ref(false)

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

const weaknesses = computed(() => {
  const report = coachStore.archetypeReport
  const base = [
    { label: report.label,  pct: report.missRate, icon: '🧬', color: 'var(--rose)' }
  ]
  
  const hasTimeIssues = coachStore.dnaPrescriptions.some(rx => rx.id === 'clock-management')
  if (hasTimeIssues) {
    base.push({ label: 'Time Management', pct: 22, icon: '⏱', color: 'var(--teal)' })
  } else {
    base.push({ label: 'Structural Gaps', pct: 14, icon: '🏗️', color: 'var(--teal)' })
  }

  const hasTacticalVuln = coachStore.dnaPrescriptions.some(rx => rx.id === 'opening-vuln')
  if (hasTacticalVuln) {
    base.push({ label: 'Tactical Traps', pct: 31, icon: '⚠️', color: 'var(--gold)' })
  } else {
    base.push({ label: 'Positioning', pct: 18, icon: '♟', color: 'var(--gold)' })
  }
  
  return base
})

const miniRx = computed(() => {
  const combined = [...coachStore.dnaPrescriptions, ...coachStore.openingPrescriptions]
  return combined
    .filter(rx => rx.severity === 'critical' || rx.severity === 'warning')
    .slice(0, 2)
})



const recentGames = computed(() => {
  return [...libraryStore.games].reverse().slice(0, 5).map(g => {
    const isWhite = userStore.isMe(g.white)
    const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
    const draw = g.result === '1/2-1/2'
    
    return {
      id: g.id,
      opponent: isWhite ? g.black : g.white,
      result: won ? 'win' : (draw ? 'draw' : 'loss'),
      control: g.event || 'Blitz',
      opening: g.eco || '---',
      score: g.result
    }
  })
})

const badgePillars = [
  { id: 'milestone', label: 'Milestones', icon: '🏅' },
  { id: 'mastery',   label: 'DNA Mastery', icon: '🧬' },
  { id: 'ritual',    label: 'Streaks & Rituals', icon: '🔥' },
]

const vaultStats = computed(() => {
  const totalGames = libraryStore.games.length
  const analyzedGames = libraryStore.games.filter(g => g.evals && g.evals.length > 0).length
  const totalMoves = libraryStore.games.reduce((acc, g) => acc + (g.movesCount || 0), 0)
  const insights = libraryStore.blundersFound + libraryStore.brilliantMovesFound
  
  return [
    { label: 'Total Vault Games', val: totalGames, desc: 'Aggregated database' },
    { label: 'Unique Openings', val: libraryStore.openingStats.length, desc: 'Structural breadth', color: 'var(--teal)' },
    { label: 'Analysis Coverage', val: `${totalGames > 0 ? Math.round((analyzedGames / totalGames) * 100) : 0}%`, desc: 'Engine synthesis level', color: 'var(--accent)' },
    { label: 'Theoretical Density', val: totalGames > 0 ? (totalMoves / totalGames).toFixed(1) : '0', desc: 'Avg moves per game' },
    { label: 'Intelligence Markers', val: insights, desc: 'Patterns recognized', color: 'var(--gold)' },
    { label: 'Engine Workload', val: libraryStore.totalMovesProcessed.toLocaleString(), desc: 'Total moves processed' }
  ]
})

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
  else if (route.query.tab === 'dna') activeTab.value = 'dna'
  
  // Trigger background maintenance
  libraryStore.repairVaultMetadata()
  libraryStore.syncCloudGames()
})

watch(() => route.query.tab, (tab) => {
  if (tab === 'vault') activeTab.value = 'vault'
  else if (tab === 'constellation') activeTab.value = 'constellation'
  else if (tab === 'dna') activeTab.value = 'dna'
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

// Stats Helpers Tied to Personal DNA
const openingStats = computed(() => libraryStore.openingStats)

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
  if (filtered.length === 0) {
    const lastRating = full.length > 0 ? full[full.length - 1].rating : 1200
    return [lastRating, lastRating]
  }
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

/* Identity & Connections */
.identity-connections {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.connection-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  transition: all 0.2s;
}
.connection-pill:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}
.connection-pill .icon { font-size: 1rem; opacity: 0.7; }
.connection-pill .name { font-weight: 700; color: var(--text-primary); }
.connection-pill .platform { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-left: 4px; }

.connection-pill.chess-com .icon { color: var(--teal); }
.connection-pill.lichess .icon { color: var(--accent-bright); }

.identity-edit-form {
  background: rgba(255, 255, 255, 0.02);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 600px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
}
.form-section h4 {
  margin: 0 0 var(--space-4) 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
}

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
/* Dashboard Grid v4 (3-Column Base) */
.dashboard-grid-v4 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  animation: fadeIn 0.4s ease;
}

.card-v3 {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 220px;
}

.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }

.card-v3 h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Performance Ratio V2 */
.wld-stats-summary { display: flex; gap: var(--space-4); }
.wld-stat { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 800; }

.wld-layout-v2 {
  display: flex;
  align-items: center;
  gap: var(--space-10);
  padding: var(--space-4) 0;
}

.wld-ring-container-v2 {
  position: relative;
  width: 120px;
  height: 120px;
}

.wld-breakdown-v2 {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: 0.9rem;
}

.breakdown-row .dot { width: 8px; height: 8px; border-radius: 50%; }
.breakdown-row .label { flex: 1; font-weight: 600; }
.breakdown-row .val { font-family: var(--font-mono); font-weight: 800; }
.breakdown-row .pct { font-size: 0.75rem; width: 40px; text-align: right; }

/* Performance History V2 (Axes & Legend) */
.chart-legend { display: flex; gap: var(--space-4); }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.legend-item .dot { width: 6px; height: 6px; border-radius: 50%; }

.perf-history-container {
  display: flex;
  gap: var(--space-4);
  height: 160px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-muted);
  padding: 10px 0 25px 0;
}

.chart-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rating-svg-full { flex: 1; width: 100%; min-height: 120px; overflow: visible; }

.x-axis {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 10px;
  padding: 0 10px;
}

/* Library IQ Header */
.library-iq-full {
  grid-column: span 3;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(139, 92, 246, 0.1);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent);
}

.library-iq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-8);
}

/* Admin Grid Fix */
.admin-full-row { grid-column: span 3; }

.integrity-actions {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Bulk Intel Bottom Styles */
.intel-center-bottom {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(45, 212, 191, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.intel-center-bottom.is-active {
  border-color: var(--accent);
  box-shadow: 0 0 32px rgba(139, 92, 246, 0.2);
}

.intel-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-8);
}

.intel-info { display: flex; align-items: center; gap: var(--space-5); }
.intel-icon { font-size: 3rem; filter: drop-shadow(0 0 12px var(--accent)); }
.intel-text h3 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 800; }

.intel-actions { display: flex; align-items: center; gap: var(--space-8); flex: 1; justify-content: flex-end; }

/* Active Telemetry Bar */
.intel-telemetry-active {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-6);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.telemetry-item .label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; opacity: 0.6; }
.telemetry-item .val { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 800; }

/* Finished Summary */
.intel-summary-finish {
  display: flex;
  gap: var(--space-8);
  padding: var(--space-4) var(--space-8);
  background: rgba(45, 212, 191, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(45, 212, 191, 0.1);
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-stat .val { font-size: 1.2rem; font-weight: 900; }
.summary-stat .label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); }

/* Progress V2 (Compact) */
.intel-main-action {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 200px;
}

.intel-progress-container-v2 { flex: 1; display: flex; align-items: center; gap: 10px; }
.intel-progress-bar-v2 { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
.intel-progress-fill-v2 { height: 100%; background: var(--accent-gradient); transition: width 0.4s ease; }
.progress-pct-v2 { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 800; color: var(--accent-bright); }

/* Card Finish State */
.intel-center-bottom.is-finished {
  border-color: rgba(45, 212, 191, 0.3);
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.1), transparent);
}

/* Shared Overrides */
.weakness-items { display: flex; flex-direction: column; gap: var(--space-4); }
.weakness-label { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
.progress-bar { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
.progress-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

.game-list-merged { display: flex; flex-direction: column; gap: 4px; }
.game-row-merged {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.01);
}

/* Personal DNA KPI Grid */
.personal-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-3);
}
.kpi-mini-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.kpi-mini-item .icon { font-size: 1.2rem; opacity: 0.8; }
.kpi-mini-item .kpi-content { display: flex; flex-direction: column; }
.kpi-mini-item .val { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.kpi-mini-item .label { font-size: 0.55rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.05em; margin-top: 4px; }

.card-separator {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
}

.meta-stat { padding: var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.05); }
.meta-stat .label { font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 4px; }
.meta-stat .val { font-size: 1.4rem; font-weight: 800; }

.admin-separator { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6); }
.admin-title { position: absolute; background: var(--bg-surface); padding: 0 var(--space-4); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); z-index: 2; }
.admin-line { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }

@media (max-width: 1400px) {
  .dashboard-grid-v4 { grid-template-columns: repeat(2, 1fr); }
  .library-iq-full, .span-2, .span-3, .admin-full-row { grid-column: span 2; }
}

@media (max-width: 900px) {
  .dashboard-grid-v4 { grid-template-columns: 1fr; }
  .library-iq-full, .span-2, .span-3, .admin-full-row { grid-column: span 1; }
  .intel-content { flex-direction: column; align-items: flex-start; }
  .intel-actions { width: 100%; min-width: 0; }
  .wld-layout-v2 { flex-direction: column; gap: var(--space-6); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
