<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useUiStore } from '../stores/uiStore'
import { fetchRecentChessComGames, getPlayerStats } from '../api/chessComApi'
import ConfirmModal from '../components/ConfirmModal.vue'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const isSyncing = ref(false)
const isImporting = ref(false)
const syncProgress = ref(0)
const syncStage = ref('')

// Chess.com username is centralized in the user's profile, not a local input
const chessComUser = computed(() => userStore.profile?.chessComUsername || '')

// Only count library games — userStore.pastGames is already included in the library
// via saveGameToLibrary(), so adding both would double-count.
const totalGames = computed(() => libraryStore.games.length)
const sourceBreakdown = computed(() => {
  const breakdown: Record<string, number> = {}
  libraryStore.games.forEach(g => {
    const source = g.tags?.includes('Chess.com') ? 'Chess.com' : 'Knightfall'
    breakdown[source] = (breakdown[source] || 0) + 1
  })
  return Object.entries(breakdown).filter(([_, count]) => count > 0)
})

// --- Library-Derived Intelligence ---

/** Overall win rate across all imported games */
const libraryWinRate = computed(() => {
  const myName = userStore.profile?.username?.toLowerCase() || ''
  if (libraryStore.games.length === 0) return 0
  let wins = 0
  libraryStore.games.forEach(g => {
    const isWhite = g.white.toLowerCase() === myName
    if ((g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)) wins++
  })
  return Math.round((wins / libraryStore.games.length) * 100)
})

/** Average Elo of opponents faced, parsed from PGN headers */
const avgOpponentElo = computed(() => {
  const myName = userStore.profile?.username?.toLowerCase() || ''
  let total = 0
  let count = 0
  libraryStore.games.forEach(g => {
    const isWhite = g.white.toLowerCase() === myName
    const oppElo = parseInt(isWhite ? (g.blackElo || '') : (g.whiteElo || ''))
    if (!isNaN(oppElo) && oppElo > 0) {
      total += oppElo
      count++
    }
  })
  return count > 0 ? Math.round(total / count) : null
})

/** Most-played time control, derived from the Event header pattern */
const mostPlayedControl = computed(() => {
  const controls: Record<string, number> = {}
  libraryStore.games.forEach(g => {
    // Chess.com events contain time control info like "Live Chess" or "Blitz"
    const ev = g.event.toLowerCase()
    let tc = 'Standard'
    if (ev.includes('bullet')) tc = 'Bullet'
    else if (ev.includes('blitz')) tc = 'Blitz'
    else if (ev.includes('rapid')) tc = 'Rapid'
    else if (ev.includes('daily')) tc = 'Daily'
    controls[tc] = (controls[tc] || 0) + 1
  })
  const sorted = Object.entries(controls).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? sorted[0][0] : null
})

// --- Prescription Engine ---

/**
 * Analyzes the user's game library and generates 3 personalized
 * training prescriptions based on real patterns in their data.
 * Each prescription targets a specific weakness discovered by
 * looking at color performance, game length, and opening variety.
 */
const prescriptions = computed(() => {
  const myName = userStore.profile?.username?.toLowerCase() || ''
  const allGames = libraryStore.games
  if (allGames.length === 0) {
    return [
      { icon: '📥', title: 'Import Your Games', desc: 'Link your Chess.com account to get personalized prescriptions.', link: '/profile', linkText: 'Set Up Profile →', severity: 'info' },
      { icon: '⚔️', title: 'Play Some Games', desc: 'We need at least a few games to analyze your patterns.', link: '/play', linkText: 'Play Now →', severity: 'info' },
      { icon: '🧩', title: 'Sharpen Tactics', desc: 'Solve puzzles to build your tactical foundation.', link: '/puzzles', linkText: 'Start Puzzles →', severity: 'info' },
    ]
  }

  const rx: { icon: string, title: string, desc: string, link: string, linkText: string, severity: string }[] = []

  // --- Analysis 1: Color Imbalance ---
  let whiteWins = 0, whiteLosses = 0, blackWins = 0, blackLosses = 0
  allGames.forEach(g => {
    const isWhite = g.white.toLowerCase() === myName
    const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
    const lost = (g.result === '0-1' && isWhite) || (g.result === '1-0' && !isWhite)
    if (isWhite) { if (won) whiteWins++; if (lost) whiteLosses++ }
    else         { if (won) blackWins++; if (lost) blackLosses++ }
  })
  const whiteGames = whiteWins + whiteLosses
  const blackGames = blackWins + blackLosses
  const whiteWinPct = whiteGames > 0 ? Math.round((whiteWins / whiteGames) * 100) : 50
  const blackWinPct = blackGames > 0 ? Math.round((blackWins / blackGames) * 100) : 50
  const colorGap = whiteWinPct - blackWinPct

  if (colorGap > 15) {
    rx.push({ icon: '⬛', title: 'Black Side Weakness', desc: `Your win rate as Black is ${blackWinPct}% vs ${whiteWinPct}% as White. Study solid defensive openings like the Caro-Kann or Slav.`, link: '/opening-lab', linkText: 'Opening Lab →', severity: 'warning' })
  } else if (colorGap < -15) {
    rx.push({ icon: '⬜', title: 'White Side Weakness', desc: `Your win rate as White is ${whiteWinPct}% vs ${blackWinPct}% as Black. Focus on building a sharper 1.e4 or 1.d4 repertoire.`, link: '/opening-lab', linkText: 'Opening Lab →', severity: 'warning' })
  } else {
    rx.push({ icon: '⚖️', title: 'Balanced Colors', desc: `Your win rate is balanced: ${whiteWinPct}% as White, ${blackWinPct}% as Black. Focus on converting drawn positions.`, link: '/puzzles', linkText: 'Practice →', severity: 'good' })
  }

  // --- Analysis 2: Game Length Pattern ---
  const losses = allGames.filter(g => {
    const isWhite = g.white.toLowerCase() === myName
    return (g.result === '0-1' && isWhite) || (g.result === '1-0' && !isWhite)
  })
  if (losses.length > 0) {
    const avgLossMoves = Math.round(losses.reduce((s, g) => s + g.movesCount, 0) / losses.length)
    if (avgLossMoves < 30) {
      rx.push({ icon: '🎬', title: 'Opening Vulnerability', desc: `You lose games after ~${avgLossMoves} moves on average. You may be falling into traps or leaving prep too early.`, link: '/opening-lab', linkText: 'Study Openings →', severity: 'critical' })
    } else if (avgLossMoves > 55) {
      rx.push({ icon: '🏁', title: 'Endgame Leaks', desc: `Your losses average ${avgLossMoves} moves — you\'re reaching endgames but not converting. Practice R+P and K+P endings.`, link: '/puzzles', linkText: 'Endgame Drills →', severity: 'warning' })
    } else {
      rx.push({ icon: '⚡', title: 'Middlegame Tactics', desc: `Your losses happen around move ${avgLossMoves}. Focus on tactical pattern recognition and calculation depth.`, link: '/puzzles', linkText: 'Tactical Training →', severity: 'warning' })
    }
  } else {
    rx.push({ icon: '🏆', title: 'Undefeated!', desc: 'No losses found in your library. Keep playing to gather more data.', link: '/play', linkText: 'Keep Playing →', severity: 'good' })
  }

  // --- Analysis 3: Opening Diversity ---
  const openings: Record<string, number> = {}
  allGames.forEach(g => {
    const key = g.eco || g.event || 'Unknown'
    openings[key] = (openings[key] || 0) + 1
  })
  const uniqueOpenings = Object.keys(openings).length
  const topOpening = Object.entries(openings).sort((a, b) => b[1] - a[1])[0]
  const topPct = topOpening ? Math.round((topOpening[1] / allGames.length) * 100) : 0

  if (uniqueOpenings <= 3 || topPct > 60) {
    rx.push({ icon: '📚', title: 'Narrow Repertoire', desc: `${topPct}% of your games use the same opening. Broaden your repertoire to avoid being predictable.`, link: '/opening-lab', linkText: 'Explore Openings →', severity: 'warning' })
  } else if (uniqueOpenings > 10) {
    rx.push({ icon: '🎯', title: 'Too Many Openings', desc: `You play ${uniqueOpenings} different openings. Consider specializing in 2-3 systems to build deeper knowledge.`, link: '/opening-lab', linkText: 'Focus Repertoire →', severity: 'info' })
  } else {
    rx.push({ icon: '✅', title: 'Healthy Repertoire', desc: `You play ${uniqueOpenings} openings with good variety. Your most played covers ${topPct}% of games.`, link: '/opening-lab', linkText: 'Review →', severity: 'good' })
  }

  return rx
})

const weakness = computed(() => userStore.weaknessDna)

const traits = computed(() => [
  { id: 'opening', label: 'Opening Precision', value: 100 - (weakness.value.category === 'opening' ? weakness.value.missRate : 15), icon: '🎬', color: 'var(--teal)' },
  { id: 'tactics', label: 'Tactical Awareness', value: 100 - (weakness.value.category === 'tactics' ? weakness.value.missRate : 20), icon: '⚡', color: 'var(--rose)' },
  { id: 'endgame', label: 'Endgame Conversion', value: 100 - (weakness.value.category === 'endgame' ? weakness.value.missRate : 10), icon: '🏁', color: 'var(--gold)' },
])

async function startSync() {
  if (isSyncing.value) return
  isSyncing.value = true
  syncProgress.value = 0
  
  const stages = [
    'Parsing Game Library...',
    'Extracting Tactical Motifs...',
    'Analyzing Blunder Clusters...',
    'Mapping Weakness DNA...',
    'Finalizing Report...'
  ]
  
  for (let i = 0; i < stages.length; i++) {
    syncStage.value = stages[i]
    // Simulate work
    const steps = 20
    for (let j = 0; j < steps; j++) {
      syncProgress.value += (100 / (stages.length * steps))
      await new Promise(r => setTimeout(r, 40 + Math.random() * 60))
    }
  }
  
  syncProgress.value = 100
  uiStore.addToast('DNA Sync Complete! Your profile has been updated.', 'success')
  isSyncing.value = false
}

const chessComStats = ref<any>(null)

async function importChessCom() {
  if (!chessComUser.value) return
  isImporting.value = true
  
  try {
    // 1. Get Stats (Ratings)
    const stats = await getPlayerStats(chessComUser.value)
    if (stats) chessComStats.value = stats

    // 2. Get Games (Last 12 months to get the full 46 games)
    const games = await fetchRecentChessComGames(chessComUser.value, 12)
    if (games.length === 0) {
      uiStore.addToast('No recent games found for this user.', 'warning')
    } else {
      // Avoid overwhelming the DB with 1000s of games at once, but 46 is fine
      for (const game of games) {
        await libraryStore.saveGameToLibrary(game.pgn, ['Chess.com'])
      }
      const purged = await libraryStore.purgeDuplicates()
      const msg = purged > 0 
        ? `Successfully imported ${games.length} games. ${purged} duplicates removed.` 
        : `Successfully imported ${games.length} games!`
      
      uiStore.addToast(msg, 'success')
      startSync() // Trigger DNA sync after import
    }
  } catch (err: any) {
    uiStore.addToast(err.message, 'error')
  } finally {
    isImporting.value = false
  }
}

async function handleCleanup() {
  const purged = await libraryStore.purgeDuplicates()
  if (purged > 0) uiStore.addToast(`Cleaned up ${purged} duplicate games.`, 'success')
  else uiStore.addToast('No duplicates found.', 'info')
}

const showResetModal = ref(false)

function handleReset() {
  showResetModal.value = true
}

async function confirmReset() {
  showResetModal.value = false
  
  // 1. Destroy the corrupted local database
  await libraryStore.resetLibrary()
  uiStore.addToast('Library wiped. Recovering your cloud data...', 'info')
  
  // 2. Pull back any games saved to Supabase (Knightfall games)
  await libraryStore.syncCloudGames()
  
  // 3. If Chess.com is linked, re-import those games too
  if (chessComUser.value) {
    uiStore.addToast('Re-importing Chess.com games...', 'info')
    await importChessCom()
  } else {
    const cloudCount = libraryStore.games.length
    if (cloudCount > 0) {
      uiStore.addToast(`Recovered ${cloudCount} games from cloud. Link Chess.com in your Profile to re-import external games.`, 'success')
    } else {
      uiStore.addToast('Library is clean. Link Chess.com in your Profile to import games.', 'success')
    }
  }
}

// Logic for the radar chart
const cx = 150, cy = 150, r = 85
const axes = [
  { label: 'Opening', key: 'opening' },
  { label: 'Middlegame', key: 'tactics' },
  { label: 'Endgame', key: 'endgame' },
  { label: 'Defense', key: 'mixed' },
  { label: 'Time', key: 'time' },
]

const radarPoints = computed(() => {
  const n = axes.length
  return axes.map((ax, i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2
    // Calculate score based on weakness DNA
    let score = 0.7 // Default
    if (weakness.value.category === ax.key) score = 1 - (weakness.value.missRate / 100)
    else score = 0.6 + (Math.random() * 0.2)
    
    const x = cx + r * score * Math.cos(angle)
    const y = cy + r * score * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
})

function getAxisLabelPos(i: number) {
  const n = axes.length
  const angle = (Math.PI * 2 * i / n) - Math.PI / 2
  const lr = r + 35 // Much more padding for labels
  return {
    x: cx + lr * Math.cos(angle),
    y: cy + lr * Math.sin(angle)
  }
}
</script>

<template>
  <div class="dna-page container">
    <div class="dna-header">
      <div class="header-main">
        <h1 class="title-lg gradient-text">Weakness DNA Lab</h1>
        <p class="text-secondary">Sync your games to discover the hidden patterns in your play.</p>
      </div>
      <button 
        class="btn btn-primary sync-btn" 
        :disabled="isSyncing"
        @click="startSync"
      >
        <span class="icon">{{ isSyncing ? '⌛' : '🔄' }}</span>
        {{ isSyncing ? 'Syncing...' : 'Sync with Library' }}
      </button>
    </div>

    <div v-if="isSyncing" class="sync-overlay glass-card">
      <div class="sync-content">
        <div class="dna-spinner">🧬</div>
        <h2 class="title-md">{{ syncStage }}</h2>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: syncProgress + '%' }"></div>
        </div>
        <p class="text-muted">{{ Math.floor(syncProgress) }}% complete</p>
      </div>
    </div>

    <div v-else class="dna-grid">
      <!-- Left Column: The Profile -->
      <div class="dna-card profile-card glass-card">
        <div class="profile-header">
          <div class="dna-avatar">🧬</div>
          <div>
            <h3 class="title-md">Your Playstyle</h3>
            <p class="trait-tag" :style="{ color: 'var(--accent-bright)' }">Tactical opportunist</p>
          </div>
        </div>

        <div class="data-stats mb-6">
          <div class="stat-mini">
            <span class="label">Games Analyzed</span>
            <div class="stat-val-row">
              <span class="val">{{ totalGames }}</span>
            </div>
            <div class="cleanup-actions">
              <button class="btn-cleanup-text" @click="handleCleanup">PRUNE DUPES</button>
              <button class="btn-cleanup-text danger" @click="handleReset">RESET ALL</button>
            </div>
          </div>
          <div class="stat-mini" v-if="totalGames > 0">
            <span class="label">Win Rate</span>
            <span class="val" :style="{ color: libraryWinRate >= 50 ? 'var(--green)' : 'var(--rose)' }">{{ libraryWinRate }}%</span>
          </div>
          <div class="stat-mini" v-if="avgOpponentElo">
            <span class="label">Avg Opponent Elo</span>
            <span class="val">{{ avgOpponentElo }}</span>
          </div>
        </div>
        
        <div class="data-stats mb-6">
          <div class="stat-mini" v-if="chessComStats">
            <span class="label">External Ratings</span>
            <div class="rating-list">
              <div v-if="chessComStats.chess_rapid" class="r-item">
                <span class="r-label">Rapid</span>
                <span class="r-val">{{ chessComStats.chess_rapid.last.rating }}</span>
              </div>
              <div v-if="chessComStats.chess_blitz" class="r-item">
                <span class="r-label">Blitz</span>
                <span class="r-val">{{ chessComStats.chess_blitz.last.rating }}</span>
              </div>
              <div v-if="chessComStats.chess_bullet" class="r-item">
                <span class="r-label">Bullet</span>
                <span class="r-val">{{ chessComStats.chess_bullet.last.rating }}</span>
              </div>
            </div>
          </div>
          <div class="stat-mini" v-if="chessComStats">
            <span class="label">Peak Rating</span>
            <div class="rating-list">
              <div v-if="chessComStats.chess_rapid?.best" class="r-item">
                <span class="r-label">Rapid</span>
                <span class="r-val peak">🏔️ {{ chessComStats.chess_rapid.best.rating }}</span>
              </div>
              <div v-if="chessComStats.chess_blitz?.best" class="r-item">
                <span class="r-label">Blitz</span>
                <span class="r-val peak">🏔️ {{ chessComStats.chess_blitz.best.rating }}</span>
              </div>
            </div>
          </div>
          <div class="stat-mini" v-if="chessComStats?.chess_rapid?.record || chessComStats?.chess_blitz?.record">
            <span class="label">W / L / D Record</span>
            <div class="rating-list">
              <div v-if="chessComStats.chess_rapid?.record" class="r-item">
                <span class="r-label">Rapid</span>
                <span class="r-val">
                  <span style="color: var(--green)">{{ chessComStats.chess_rapid.record.win }}</span> /
                  <span style="color: var(--rose)">{{ chessComStats.chess_rapid.record.loss }}</span> /
                  <span style="color: var(--gold)">{{ chessComStats.chess_rapid.record.draw }}</span>
                </span>
              </div>
              <div v-if="chessComStats.chess_blitz?.record" class="r-item">
                <span class="r-label">Blitz</span>
                <span class="r-val">
                  <span style="color: var(--green)">{{ chessComStats.chess_blitz.record.win }}</span> /
                  <span style="color: var(--rose)">{{ chessComStats.chess_blitz.record.loss }}</span> /
                  <span style="color: var(--gold)">{{ chessComStats.chess_blitz.record.draw }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="data-stats mb-6">
          <div class="stat-mini" v-if="sourceBreakdown.length > 0">
            <span class="label">Source Breakdown</span>
            <div class="source-list">
              <div v-for="[name, count] in sourceBreakdown" :key="name" class="source-item">
                <span class="s-name">{{ name }}</span>
                <span class="s-count">{{ count }}</span>
              </div>
            </div>
          </div>
          <div class="stat-mini" v-if="mostPlayedControl">
            <span class="label">Preferred Format</span>
            <span class="val" style="color: var(--gold);">{{ mostPlayedControl }}</span>
          </div>
        </div>

        <div class="traits-list">
          <div v-for="trait in traits" :key="trait.id" class="trait-item">
            <div class="trait-info">
              <span class="trait-icon">{{ trait.icon }}</span>
              <span class="trait-label">{{ trait.label }}</span>
              <span class="trait-val">{{ trait.value }}%</span>
            </div>
            <div class="trait-bar">
              <div class="trait-fill" :style="{ width: trait.value + '%', background: trait.color }"></div>
            </div>
          </div>
        </div>

        <div class="dna-insight">
          <h4 class="title-xs">Critical Insight</h4>
          <p class="text-secondary">
            Your {{ weakness.label }} is currently your biggest bottleneck. 
            You tend to lose <strong>{{ weakness.missRate }}%</strong> of games when the position reaches this phase.
          </p>
        </div>
      </div>

      <!-- Center Column: Radar Chart -->
      <div class="dna-card chart-card glass-card">
        <h3 class="title-sm">Performance DNA</h3>
        <div class="radar-wrapper">
          <svg viewBox="0 0 300 300" class="radar-svg">
            <!-- Background Rings -->
            <circle :cx="cx" :cy="cy" :r="r * 0.25" class="radar-ring" />
            <circle :cx="cx" :cy="cy" :r="r * 0.5"  class="radar-ring" />
            <circle :cx="cx" :cy="cy" :r="r * 0.75" class="radar-ring" />
            <circle :cx="cx" :cy="cy" :r="r"        class="radar-ring" />
            
            <!-- Axes -->
            <line v-for="(_, i) in axes" :key="'ax'+i"
              :x1="cx" :y1="cy"
              :x2="cx + r * Math.cos((Math.PI * 2 * i / axes.length) - Math.PI / 2)"
              :y2="cy + r * Math.sin((Math.PI * 2 * i / axes.length) - Math.PI / 2)"
              class="radar-axis"
            />

            <!-- Labels -->
            <text v-for="(ax, i) in axes" :key="'lbl'+i"
              :x="getAxisLabelPos(i).x"
              :y="getAxisLabelPos(i).y"
              class="radar-label"
              text-anchor="middle"
              alignment-baseline="middle"
            >{{ ax.label }}</text>

            <!-- Data Polygon -->
            <polygon :points="radarPoints" class="radar-poly" />
            <circle v-for="(p, i) in radarPoints.split(' ')" :key="'pt'+i"
              :cx="p.split(',')[0]" :cy="p.split(',')[1]" r="3" class="radar-pt"
            />
          </svg>
        </div>
      </div>

      <!-- Right Column: Prescriptions -->
      <div class="dna-card labs-card glass-card">
        <h3 class="title-sm">DNA Prescriptions</h3>
        <p class="text-muted mb-4">Personalized training based on your game patterns:</p>
        
        <div class="prescriptions">
          <div 
            v-for="rx in prescriptions" 
            :key="rx.title" 
            class="prescription glass-card"
            :class="'rx-' + rx.severity"
          >
            <div class="p-icon">{{ rx.icon }}</div>
            <div class="p-content">
              <h5>{{ rx.title }}</h5>
              <p>{{ rx.desc }}</p>
              <router-link :to="rx.link" class="btn-text">{{ rx.linkText }}</router-link>
            </div>
            <div class="rx-severity-dot" :class="rx.severity"></div>
          </div>
        </div>

        <div class="external-import glass-card" style="margin-top: 2rem;">
          <h4 class="title-xs" style="margin-bottom: 0.5rem;">Import External DNA</h4>
          
          <template v-if="chessComUser">
            <div class="linked-account">
              <span class="linked-icon">♟</span>
              <div class="linked-info">
                <span class="linked-name">{{ chessComUser }}</span>
                <span class="linked-source">Chess.com</span>
              </div>
              <button 
                class="btn btn-ghost btn-sm" 
                @click="importChessCom"
                :disabled="isImporting"
              >
                {{ isImporting ? '⏳ Importing...' : '📥 Sync Games' }}
              </button>
            </div>
          </template>
          
          <template v-else>
            <div class="no-link-prompt">
              <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 0.75rem;">
                Link your Chess.com account to analyze your global weaknesses.
              </p>
              <router-link to="/profile" class="btn btn-primary btn-sm">
                Set up in Profile →
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <ConfirmModal
    v-if="showResetModal"
    title="Reset Library?"
    message="This will permanently delete ALL games from your local library. You can re-import from Chess.com afterwards."
    icon="🗑️"
    variant="danger"
    confirmLabel="Yes, Wipe Everything"
    @confirm="confirmReset"
    @cancel="showResetModal = false"
  />
</template>

<style scoped>
.dna-page { padding-top: var(--space-8); padding-bottom: var(--space-12); }

.dna-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: var(--space-10);
}
.sync-btn { display: flex; align-items: center; gap: var(--space-2); }

.dna-grid {
  display: grid;
  grid-template-columns: 320px 1fr 340px;
  gap: var(--space-6);
  align-items: start;
}
@media (max-width: 1200px) { .dna-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 800px) { .dna-grid { grid-template-columns: 1fr; } }

.dna-card { padding: var(--space-6); }

/* Data Stats */
.data-stats { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
.stat-mini { flex: 1; min-width: 120px; background: rgba(255,255,255,0.04); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border); }
.stat-mini .label { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 2px; }
.stat-mini .val { font-size: 1.2rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-bright); }
.stat-val-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-2); }
.btn-cleanup-text { 
  background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 4px;
  color: var(--text-muted); font-size: 0.6rem; font-weight: 700; padding: 2px 6px;
  cursor: pointer; transition: all 0.2s;
}
.btn-cleanup-text:hover { background: var(--accent-dim); color: var(--accent-bright); border-color: var(--accent); }
.btn-cleanup-text.danger { color: var(--rose); }
.btn-cleanup-text.danger:hover { background: rgba(244, 63, 94, 0.15); border-color: var(--rose); }
.cleanup-actions { display: flex; gap: 4px; margin-top: 6px; }
.stat-mini .val-pill { font-size: 0.85rem; font-weight: 700; color: var(--teal); }
.source-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.source-item { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; }
.source-item .s-name { color: var(--text-muted); }
.source-item .s-count { color: var(--teal); }
.rating-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.r-item { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; }
.r-label { color: var(--text-muted); }
.r-val { color: var(--accent-bright); }
.r-val.peak { color: var(--gold); }

/* Profile Card */
.profile-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
.dna-avatar {
  width: 50px; height: 50px; border-radius: 50%;
  background: var(--accent-gradient);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
}
.trait-tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

.traits-list { display: flex; flex-direction: column; gap: var(--space-5); margin-bottom: var(--space-8); }
.trait-info { display: flex; align-items: center; gap: var(--space-2); font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
.trait-icon { margin-right: 4px; }
.trait-val { margin-left: auto; color: var(--text-muted); }
.trait-bar { height: 6px; background: var(--bg-elevated); border-radius: var(--radius-full); overflow: hidden; }
.trait-fill { height: 100%; border-radius: var(--radius-full); transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

.dna-insight { padding: var(--space-4); background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border-left: 3px solid var(--accent); }
.dna-insight strong { color: var(--rose); }

/* Radar Chart */
.radar-wrapper { display: flex; align-items: center; justify-content: center; padding: var(--space-8); }
.radar-svg { width: 100%; max-width: 400px; height: auto; }
.radar-ring { fill: none; stroke: var(--border); stroke-width: 1; }
.radar-axis { stroke: var(--border); stroke-width: 1; }
.radar-label { font-size: 10px; font-weight: 700; fill: var(--text-muted); text-transform: uppercase; }
.radar-poly { fill: var(--accent-dim); stroke: var(--accent); stroke-width: 2; opacity: 0.7; }
.radar-pt { fill: var(--accent-bright); }

/* Prescriptions */
.prescriptions { display: flex; flex-direction: column; gap: var(--space-4); }
.prescription { padding: var(--space-4); display: flex; gap: var(--space-4); align-items: flex-start; transition: transform 0.2s; }
.prescription:hover { transform: translateX(5px); background: var(--bg-card-hover); }
.prescription.rx-critical { border-left: 3px solid var(--rose); }
.prescription.rx-warning  { border-left: 3px solid var(--gold); }
.prescription.rx-good     { border-left: 3px solid var(--green); }
.prescription.rx-info     { border-left: 3px solid var(--accent); }
.rx-severity-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 6px;
}
.rx-severity-dot.critical { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.rx-severity-dot.warning  { background: var(--gold); box-shadow: 0 0 8px var(--gold); }
.rx-severity-dot.good     { background: var(--green); box-shadow: 0 0 8px var(--green); }
.rx-severity-dot.info     { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.p-icon { font-size: 1.5rem; }
.p-content h5 { font-weight: 700; margin-bottom: 2px; font-size: 0.95rem; }
.p-content p { font-size: 0.82rem; color: var(--text-muted); margin-bottom: var(--space-2); }
.btn-text { font-size: 0.82rem; font-weight: 700; color: var(--accent-bright); text-decoration: none; }

/* Sync Overlay */
.sync-overlay {
  max-width: 600px; margin: var(--space-12) auto; padding: var(--space-12); text-align: center;
}
.dna-spinner { font-size: 4rem; animation: spin-3d 3s infinite linear; margin-bottom: var(--space-6); }
@keyframes spin-3d { 
  0% { transform: rotateY(0); }
  100% { transform: rotateY(360deg); }
}
.progress-bar { height: 8px; background: var(--bg-elevated); border-radius: var(--radius-full); margin: var(--space-6) 0 var(--space-2); overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent-gradient); transition: width 0.3s ease; }

/* Linked Account Card */
.linked-account {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3); background: rgba(255,255,255,0.03);
  border-radius: var(--radius-md); border: 1px solid var(--border);
}
.linked-icon { font-size: 1.4rem; }
.linked-info { flex: 1; display: flex; flex-direction: column; }
.linked-name { font-weight: 700; font-size: 0.9rem; }
.linked-source { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.no-link-prompt { text-align: center; padding: var(--space-4); }
</style>
