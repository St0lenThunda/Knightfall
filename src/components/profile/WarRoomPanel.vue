<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/userStore'
import { useLibraryStore } from '../../stores/libraryStore'
import { useCoachStore } from '../../stores/coachStore'

const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()

// Props to control modals from the parent if needed, or we can move them here
defineProps<{
  joinedDate: string
}>()

const emit = defineEmits(['showBadgeModal', 'showWipeConfirm', 'toggleIntel', 'deduplicateVault', 'switchTab'])

// Stats Helpers
/** Temporarily hidden with the Library IQ section
const vaultStats = computed(() => {
  const totalGames = libraryStore.games.length
  const analyzedGames = libraryStore.games.filter(g => g.evals && g.evals.length > 0)
  const analyzedCount = analyzedGames.length
  const insights = libraryStore.blundersFound + libraryStore.brilliantMovesFound + libraryStore.mistakesFound
  
  // THEORY WEIGHT: Should be based on how many moves we've actually verified in analyzed games
  const theoryWeight = analyzedCount > 0 
    ? (libraryStore.totalMovesProcessed / (analyzedCount * 40)) * 100 
    : 0

  return [
    { label: 'Total Vault Games', val: totalGames, desc: 'Aggregated database' },
    { label: 'Unique Openings', val: libraryStore.vaultOpeningStats.length, desc: 'Structural breadth', color: 'var(--teal)' },
    { label: 'Analysis Coverage', val: `${totalGames > 0 ? Math.round((analyzedCount / totalGames) * 100) : 0}%`, desc: 'Engine synthesis level', color: 'var(--accent)' },
    { label: 'Theoretical Accuracy', val: `${Math.min(100, Math.round(theoryWeight))}%`, desc: 'Alignment in analyzed games', color: 'var(--gold)' },
    { label: 'Intelligence Markers', val: insights, desc: 'Patterns recognized', color: 'var(--accent)' },
    { label: 'Engine Workload', val: libraryStore.totalMovesProcessed.toLocaleString(), desc: 'Total moves processed' }
  ]
})
*/

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

const miniRx = computed(() => coachStore.dnaPrescriptions.slice(0, 3))

const weaknesses = computed(() => {
  const report = coachStore.archetypeReport
  return [
    { label: 'Opening Accuracy', pct: Math.round(report.radarScores.opening * 100), icon: '📖', color: 'var(--teal)' },
    { label: 'Tactical Awareness', pct: Math.round(report.radarScores.tactics * 100), icon: '🧩', color: 'var(--accent)' },
    { label: 'Endgame Precision', pct: Math.round(report.radarScores.endgame * 100), icon: '🏁', color: 'var(--gold)' }
  ]
})

const intelStatusText = computed(() => {
  if (libraryStore.isBulkAnalyzing) return `Analyzing game ${libraryStore.analyzedGamesCount + 1} of ${libraryStore.games.length}...`
  if (libraryStore.analysisProgress === 100) return 'Vault intelligence fully synthesized.'
  return `${libraryStore.games.length - libraryStore.analyzedGamesCount} games awaiting deep synthesis.`
})

// Rating Chart Logic
const chartW = 500, chartH = 120

const chartFilter = ref('ALL')
const filteredRatingHistory = computed(() => {
  const full = libraryStore.performanceHistory
  if (chartFilter.value === 'ALL') return full
  
  const now = new Date()
  const limit = new Date()
  if (chartFilter.value === '1M') limit.setMonth(now.getMonth() - 1)
  else if (chartFilter.value === '3M') limit.setMonth(now.getMonth() - 3)
  else if (chartFilter.value === '1Y') limit.setFullYear(now.getFullYear() - 1)
  
  const filtered = full.filter(h => h.date && new Date(h.date) >= limit)
  
  // To avoid the chart "starting from nothing", we find the rating just before this period
  const before = full.filter(h => h.date && new Date(h.date) < limit)
  if (before.length > 0) {
    const startValue = before[before.length - 1].rating
    return [{ date: limit.toISOString(), rating: startValue }, ...filtered]
  }
  
  return filtered
})

const ratingData = computed(() => {
  const result = filteredRatingHistory.value.map(h => h.rating)
  if (result.length === 0) return [1200, 1200]
  if (result.length === 1) return [result[0], result[0]]
  return result
})

const minR = computed(() => {
  const min = Math.min(...ratingData.value)
  if (isNaN(min)) return 1100
  // Add a bit of padding so the line isn't touching the bottom
  return min - 50 
})

const maxR = computed(() => {
  const max = Math.max(...ratingData.value)
  if (isNaN(max)) return 1300
  // Add a bit of padding so the line isn't touching the top
  return max + 50
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

const openingStats = computed(() => libraryStore.openingStats)

</script>

<template>
  <div class="overview-content">
    <div class="profile-header">
      <div class="profile-hero glass">
        <div class="profile-avatar">{{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}</div>
        <div class="profile-info">
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
            <button v-if="coachStore.achievements.badges.filter(x => x.earned).length > 3" class="tag btn-ghost" @click="emit('showBadgeModal')">
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
      <!-- Temporarily hidden to focus on personal DNA -->
      <!-- <div class="library-iq-full glass mb-6">
        <div class="card-header">
          <h4>🧠 Library Intelligence Quotient</h4>
        </div>
        <div class="library-iq-grid mt-6">
          <div v-for="stat in vaultStats" :key="stat.label" class="meta-stat" :title="stat.desc">
            <div class="label">{{ stat.label }}</div>
            <div class="val" :style="{ color: stat.color || 'inherit' }">{{ stat.val }}</div>
          </div>
        </div>
      </div> -->

      <div class="glass card-v3 span-2">
        <div class="card-header">
          <h4>Recent Activity</h4>
          <button @click="$emit('switchTab', 'vault')" class="btn-cleanup-text">VIEW ALL →</button>
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

      <div class="glass card-v3 span-2">
        <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 4px;">
          <h4 style="margin: 0;">Performance Ratio</h4>
          <div class="wld-stats-summary" style="opacity: 0.6; font-size: 0.8rem;">
            Total DNA Games: {{ libraryStore.libraryWldStats.total }}
          </div>
        </div>
        <div class="wld-layout-v2 mt-4">
          <div class="wld-ring-container-v2">
            <svg viewBox="0 0 100 100" class="wld-ring">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
              <!-- Wins (Green) -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12" 
                      :stroke-dasharray="`${(libraryStore.libraryWldStats.winPct / 100) * 251.3} 251.3`" 
                      stroke-dashoffset="0" />
              <!-- Losses (Rose) -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12" 
                      :stroke-dasharray="`${(libraryStore.libraryWldStats.lossPct / 100) * 251.3} 251.3`" 
                      :stroke-dashoffset="-((libraryStore.libraryWldStats.winPct / 100) * 251.3)" />
              <!-- Draws (Gold) -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="12" 
                      :stroke-dasharray="`${(libraryStore.libraryWldStats.drawPct / 100) * 251.3} 251.3`" 
                      :stroke-dashoffset="-(((libraryStore.libraryWldStats.winPct + libraryStore.libraryWldStats.lossPct) / 100) * 251.3)" />
            </svg>
            <div class="wld-center">
              <div class="wld-pct">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</div>
              <div class="label">Win Rate</div>
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
        <button @click="$emit('switchTab', 'dna')" class="btn btn-ghost btn-xs w-full mt-4">Full Lab →</button>
      </div>

      <div class="glass card-v3 span-2" style="align-self: flex-start;">
        <div class="card-header">
          <h4>Performance History</h4>
          <div class="chart-filters-container">
            <div class="chart-legend-mini">
              <span class="dot bg-accent"></span>
              <span class="muted">Rating DNA</span>
            </div>
            <div class="chart-filters">
              <button v-for="f in ['1M', '3M', '1Y', 'ALL']" :key="f" 
                      @click="chartFilter = f" 
                      class="btn-filter" :class="{ active: chartFilter === f }">
                {{ f }}
              </button>
            </div>
          </div>
        </div>
        <div class="perf-history-container mt-4">
          <div class="y-axis">
            <span>{{ maxR }}</span>
            <span>{{ Math.round((maxR + minR) / 2) }}</span>
            <span>{{ minR }}</span>
          </div>
          <div class="chart-main">
            <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="rating-svg-full" preserveAspectRatio="none">
              <path :d="areaPath" fill="rgba(139,92,246,0.1)"/>
              <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <div class="x-axis" style="margin-top: var(--space-4);">
              <span>{{ chartFilter === 'ALL' ? 'Vault Start' : new Date(filteredRatingHistory[0]?.date).toLocaleDateString() }}</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      <div class="glass card-v3">
        <div class="card-header">
          <h4>Top Openings</h4>
          <div class="opening-legend-mini">
            <span class="legend-item"><span class="dot-xs bg-green"></span> W</span>
            <span class="legend-item"><span class="dot-xs bg-rose"></span> L</span>
            <span class="legend-item"><span class="dot-xs bg-gold"></span> D</span>
          </div>
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

      <div class="glass card-v3 span-3">
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
            <button class="btn btn-ghost btn-sm" @click="emit('deduplicateVault')">🧹 Clean Duplicates</button>
            <p class="muted">Scan your entire vault for redundant entries and upgrade legacy games to high-precision IDs.</p>
          </div>

          <div class="integrity-item">
            <button class="btn btn-ghost btn-sm text-rose" @click="emit('showWipeConfirm')">⚠️ Nuclear Reset</button>
            <p class="muted">Wipe your entire local and cloud library. <strong class="text-rose">This action is permanent.</strong> Use with caution.</p>
          </div>
        </div>
      </div>

      <div class="admin-full-row mt-10 mb-10">
        <div class="admin-separator">
          <span class="admin-title">System Intelligence</span>
          <div class="admin-line"></div>
        </div>

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
              <div v-if="libraryStore.isBulkAnalyzing" class="intel-telemetry-active">
                <div class="telemetry-item">
                  <span class="label">NPS</span>
                  <span class="val">{{ Math.round(libraryStore.engineNodesPerSecond / 1000) }}k</span>
                </div>
                <div class="telemetry-item">
                  <span class="label text-rose">Blunders</span>
                  <span class="val">{{ libraryStore.blundersFound }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="label" style="color: #fb923c;">Mistakes</span>
                  <span class="val">{{ libraryStore.mistakesFound }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="label text-gold">Inaccuracy</span>
                  <span class="val">{{ libraryStore.inaccuraciesFound }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="label text-teal">Brilliant</span>
                  <span class="val">{{ libraryStore.brilliantMovesFound }}</span>
                </div>
              </div>

              <div v-if="libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0" class="intel-summary-finish">
                <div class="summary-stat">
                  <span class="val">{{ libraryStore.totalMovesProcessed }}</span>
                  <span class="label">Moves Processed</span>
                </div>
                <div class="summary-stat">
                  <span class="val text-rose">{{ libraryStore.blundersFound }}</span>
                  <span class="label">Blunders</span>
                </div>
                <div class="summary-stat">
                  <span class="val" style="color: #fb923c;">{{ libraryStore.mistakesFound }}</span>
                  <span class="label">Mistakes</span>
                </div>
                <div class="summary-stat">
                  <span class="val text-gold">{{ libraryStore.inaccuraciesFound }}</span>
                  <span class="label">Inaccuracies</span>
                </div>
              </div>

              <div class="intel-main-action">
                <div v-if="libraryStore.isBulkAnalyzing" class="intel-progress-container-v2" style="width: 100%;">
                  <div class="intel-progress-bar-v2">
                    <div class="intel-progress-fill-v2" :style="{ width: libraryStore.analysisProgress + '%' }"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; font-family: monospace;">
                    <span class="muted">{{ Math.round(libraryStore.analysisProgress) }}% Complete</span>
                    <span class="text-accent">Rem: {{ libraryStore.estimatedTimeRemaining || '--' }}</span>
                  </div>
                </div>
                <button @click="emit('toggleIntel')" class="btn" :class="libraryStore.isBulkAnalyzing ? 'btn-ghost' : 'btn-primary'">
                  {{ libraryStore.isBulkAnalyzing ? 'Pause' : (libraryStore.analysisProgress === 100 ? 'Restart' : 'Start Synthesis') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Profile Overview Styles */
.profile-hero { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-6); margin-bottom: var(--space-6); border-radius: var(--radius-xl); }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 0 32px rgba(139,92,246,0.3); }
.profile-rating-showcase { display: flex; gap: var(--space-8); margin-left: auto; }
.rating-big { text-align: center; }
.rating-num { font-size: 2rem; font-weight: 800; }

.dashboard-grid-v4 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

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

.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }

.card-v3 {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.game-list-merged { display: flex; flex-direction: column; gap: 4px; }
.game-row-merged {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s;
}
.game-row-merged:hover { background: rgba(255, 255, 255, 0.05); }
.game-result-dot { width: 8px; height: 8px; border-radius: 50%; }
.game-result-dot.win { background: var(--green); box-shadow: 0 0 8px var(--green); }
.game-result-dot.loss { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.game-result-dot.draw { background: var(--gold); box-shadow: 0 0 8px var(--gold); }

.game-info { flex: 1; display: flex; flex-direction: column; }
.game-opponent { font-weight: 700; font-size: 0.95rem; }
.game-score { font-family: var(--font-mono); font-weight: 800; }

.mini-rx-item {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: var(--space-3);
  border-left: 4px solid var(--accent);
}
.mini-rx-item.critical { border-left-color: var(--rose); }
.mini-rx-item.warning { border-left-color: var(--gold); }

.wld-layout-v2 { display: flex; align-items: center; gap: var(--space-10); }
.wld-ring-container-v2 { position: relative; width: 120px; height: 120px; }
.wld-ring { transform: rotate(-90deg); }
.wld-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wld-pct { font-size: 1.5rem; font-weight: 900; margin-bottom: 4px; }

.wld-breakdown-v2 { flex: 1; display: flex; flex-direction: column; gap: var(--space-3); }
.breakdown-row { 
  display: grid; 
  grid-template-columns: 8px 1fr 40px 45px; 
  align-items: center; 
  gap: var(--space-4); 
  padding: var(--space-2) var(--space-4); 
  background: rgba(255, 255, 255, 0.02); 
  border-radius: var(--radius-md); 
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.bg-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
.bg-rose { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.bg-gold { background: var(--gold); box-shadow: 0 0 8px var(--gold); }
.bg-accent { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.breakdown-row .label { font-weight: 600; font-size: 0.85rem; }
.breakdown-row .val { font-weight: 800; text-align: right; }
.breakdown-row .pct { font-size: 0.75rem; text-align: right; }

.weakness-items { display: flex; flex-direction: column; gap: var(--space-4); }
.weakness-label { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
.progress-bar { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
.progress-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

.chart-filters-container { display: flex; align-items: center; gap: var(--space-6); }
.chart-legend-mini { display: flex; align-items: center; gap: var(--space-2); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.chart-filters { display: flex; gap: 4px; background: rgba(255,255,255,0.03); padding: 2px; border-radius: var(--radius-md); }
.btn-filter { padding: 4px 10px; font-size: 0.65rem; font-weight: 800; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
.btn-filter.active { background: var(--accent); color: white; box-shadow: 0 0 8px var(--accent); }
.btn-filter:hover:not(.active) { background: rgba(255,255,255,0.05); }

.perf-history-container { display: flex; gap: var(--space-4); height: 140px; margin-bottom: var(--space-8); padding: 0 var(--space-4); }
.y-axis { display: flex; flex-direction: column; justify-content: space-between; color: var(--text-muted); font-size: 0.65rem; font-family: var(--font-mono); padding: 4px 0; }
.chart-main { flex: 1; position: relative; display: flex; flex-direction: column; }
.rating-svg-full { flex: 1; width: 100%; overflow: visible; }
.x-axis { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.65rem; margin-top: var(--space-4); }

.opening-legend-mini { display: flex; gap: var(--space-4); font-size: 0.65rem; font-weight: 800; opacity: 0.6; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot-xs { width: 6px; height: 6px; border-radius: 50%; }

.opening-list-merged { display: flex; flex-direction: column; gap: 4px; }
.opening-row-merged { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); }
.opening-name { font-weight: 700; font-size: 0.85rem; }
.mini-wld { display: flex; width: 60px; height: 4px; border-radius: 2px; overflow: hidden; }

.admin-full-row { grid-column: span 3; }
.admin-separator { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6); }
.admin-title { position: absolute; background: var(--bg-surface); padding: 0 var(--space-4); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); z-index: 2; }
.admin-line { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }

.intel-center-bottom {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(45, 212, 191, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.intel-center-bottom.is-active { border-color: var(--accent); box-shadow: 0 0 32px rgba(139, 92, 246, 0.2); }
.intel-content { display: flex; justify-content: space-between; align-items: center; gap: var(--space-8); }
.intel-info { display: flex; align-items: center; gap: var(--space-5); }
.intel-icon { font-size: 3rem; }
.intel-text h3 { margin: 0; }
.intel-actions { display: flex; align-items: center; gap: var(--space-8); flex: 1; justify-content: flex-end; }
.intel-telemetry-active { display: flex; gap: var(--space-6); padding: var(--space-3) var(--space-6); background: rgba(0,0,0,0.2); border-radius: var(--radius-md); }
.telemetry-item { display: flex; flex-direction: column; align-items: center; }
.telemetry-item .label { font-size: 0.55rem; font-weight: 800; opacity: 0.6; }
.telemetry-item .val { font-family: var(--font-mono); font-weight: 800; }

.summary-stat { display: flex; flex-direction: column; align-items: center; }
.wld-center .label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }

.intel-main-action { display: flex; align-items: center; gap: var(--space-4); min-width: 240px; }
.intel-progress-container-v2 { flex: 1; display: flex; align-items: center; gap: 10px; }
.intel-progress-bar-v2 { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
.intel-progress-fill-v2 { height: 100%; background: var(--accent-gradient); transition: width 0.4s ease; }
.progress-pct-v2 { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 800; color: var(--accent-bright); }

.integrity-grid { display: flex; flex-direction: column; gap: var(--space-4); }
.integrity-item { display: grid; grid-template-columns: 200px 1fr; align-items: center; gap: var(--space-6); padding: var(--space-4); background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
.integrity-item p { margin: 0; font-size: 0.85rem; }
.integrity-item .btn { justify-content: flex-start; }

.meta-stat { padding: var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.05); }
.meta-stat .label { font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 4px; }
.meta-stat .val { font-size: 1.4rem; font-weight: 800; }

.identity-connections { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.connection-pill { display: flex; align-items: center; gap: var(--space-2); padding: 4px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); font-size: 0.85rem; }

@media (max-width: 1200px) {
  .dashboard-grid-v4 { grid-template-columns: 1fr 1fr; }
  .library-iq-full, .span-3, .admin-full-row { grid-column: span 2; }
}
</style>
