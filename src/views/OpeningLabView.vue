<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLibraryStore } from '../stores/libraryStore'
import { useUiStore } from '../stores/uiStore'
import { useCoachStore } from '../stores/coachStore'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const coachStore = useCoachStore()

const isLoading = ref(true)
const selectedCategory = ref('repertoire')
const loadingStage = ref('Preparing analysis engine...')

// Mock opening data for curated section
const curatedOpenings = [
  { id: 'italian', name: 'Italian Game', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4', difficulty: 'Beginner', popularity: 'High', icon: '🇮🇹' },
  { id: 'sicilian', name: 'Sicilian Defense', moves: '1. e4 c5', difficulty: 'Intermediate', popularity: 'Very High', icon: '🌋' },
  { id: 'queens-gambit', name: "Queen's Gambit", moves: '1. d4 d5 2. c4', difficulty: 'Beginner', popularity: 'High', icon: '👑' },
  { id: 'caro-kann', name: 'Caro-Kann Defense', moves: '1. e4 c6', difficulty: 'Intermediate', popularity: 'Medium', icon: '🛡️' },
]

const detectedOpenings = computed(() => {
  const stats = libraryStore.openingStats || []
  return stats.slice(0, 8).map(s => ({
    id: s.name.toLowerCase().replace(/\s+/g, '-'),
    name: s.name,
    games: s.games,
    winPct: s.winPct,
    lossPct: s.lossPct,
    drawPct: s.drawPct,
    description: s.description,
    icon: s.name.toLowerCase().includes('sicilian') ? '🦂' 
        : s.name.toLowerCase().includes('ruy lopez') ? '🏰'
        : s.name.toLowerCase().includes('italian') ? '🇮🇹'
        : s.name.toLowerCase().includes('french') ? '🇫🇷'
        : s.name.toLowerCase().includes('caro-kann') ? '🛡️'
        : '♟️'
  }))
})

/**
 * Opening-specific prescriptions derived from the repertoire stats.
 * Now centralized in coachStore.
 */
const openingRx = computed(() => coachStore.openingPrescriptions)

onMounted(async () => {
  isLoading.value = true
  
  // Phase 1: Load Games
  loadingStage.value = 'Mapping game library...'
  if (libraryStore.games.length === 0) {
    await libraryStore.loadGames()
  }
  
  // Phase 2: Analyze Openings (Simulate some work for UX if too fast)
  loadingStage.value = 'Synthesizing Repertoire DNA...'
  await new Promise(r => setTimeout(r, 800))
  
  // Phase 3: Finalize
  loadingStage.value = 'Finalizing Training Curriculum...'
  await new Promise(r => setTimeout(r, 600))
  
  isLoading.value = false
})

function startTraining(openingId: string) {
  uiStore.addToast(`Starting specialized training for ${openingId}...`, 'info')
}
</script>

<template>
  <div class="opening-lab container">
    <div class="lab-header">
      <div class="header-main">
        <h1 class="title-lg gradient-text">Stratagem Forge</h1>
        <p class="text-secondary">Master the first 10 moves. Build a bulletproof repertoire.</p>
      </div>
      
      <div class="tabs-pill">
        <button 
          :class="{ active: selectedCategory === 'repertoire' }" 
          @click="selectedCategory = 'repertoire'"
        >My Repertoire</button>
        <button 
          :class="{ active: selectedCategory === 'curated' }" 
          @click="selectedCategory = 'curated'"
        >Curated Study</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state glass-card">
      <div class="spinner-wrap">
        <div class="spinner"></div>
        <div class="spinner-center">{{ Math.max(10, Math.min(99, libraryStore.importProgress || 45)) }}%</div>
      </div>
      <div class="loading-info">
        <h3 class="title-sm">{{ loadingStage }}</h3>
        <p class="text-muted">Analyzing move history to identify your tactical fingerprints.</p>
      </div>
      <div class="progress-bar-loading">
        <div class="fill" :style="{ width: (libraryStore.importProgress || 45) + '%' }"></div>
      </div>
    </div>

    <div v-else class="lab-content">
      <!-- Opening Prescriptions — Coach's Notes -->
      <div v-if="openingRx.length > 0" class="rx-section mb-8">
        <h3 class="title-xs" style="margin-bottom: var(--space-4); color: var(--text-muted);">
          <span style="margin-right: 6px;">🩺</span> Coach's Notes
        </h3>
        <div class="rx-strip">
          <div 
            v-for="rx in openingRx" 
            :key="rx.title" 
            class="rx-card glass-card"
            :class="'rx-' + rx.severity"
          >
            <span class="rx-icon">{{ rx.icon }}</span>
            <div class="rx-body">
              <h5>{{ rx.title }}</h5>
              <p>{{ rx.desc }}</p>
              <router-link :to="rx.link" class="btn-text">{{ rx.linkText }}</router-link>
            </div>
            <div class="rx-severity-dot" :class="rx.severity"></div>
          </div>
        </div>
      </div>

      <!-- My Repertoire Section -->
      <div v-if="selectedCategory === 'repertoire'" class="repertoire-grid">
        <div v-if="detectedOpenings.length === 0" class="empty-state glass-card">
          <div class="icon">🔍</div>
          <h3>No Openings Detected</h3>
          <p>Import some games or play a few rounds to see your repertoire analysis here.</p>
          <router-link to="/dna" class="btn btn-primary mt-4">Sync with Chess.com</router-link>
        </div>

        <div v-else v-for="opening in detectedOpenings" :key="opening.id" class="opening-card glass-card">
          <div class="card-top">
            <span class="opening-icon">{{ opening.icon }}</span>
            <div class="opening-name-wrap">
              <h3 class="title-sm">{{ opening.name }}</h3>
              <p class="opening-desc">{{ opening.description }}</p>
              <p class="games-count">{{ opening.games }} games analyzed</p>
            </div>
          </div>
          
          <div class="performance-stats">
            <div class="stat-row">
              <label>Win Rate</label>
              <div class="progress-bar-sm">
                <div class="fill" :style="{ width: opening.winPct + '%', background: 'var(--green)' }"></div>
              </div>
              <span class="pct">{{ opening.winPct }}%</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-ghost btn-sm w-full" @click="startTraining(opening.id)">
              Train Tactics
            </button>
          </div>
        </div>
      </div>

      <!-- Curated Section -->
      <div v-else class="curated-grid">
        <div v-for="opening in curatedOpenings" :key="opening.id" class="study-card glass-card">
          <div class="study-header">
            <span class="study-icon">{{ opening.icon }}</span>
            <div class="badge-difficulty" :class="opening.difficulty.toLowerCase()">
              {{ opening.difficulty }}
            </div>
          </div>
          
          <h3 class="title-sm">{{ opening.name }}</h3>
          <p class="moves-text">{{ opening.moves }}</p>
          
          <div class="study-footer">
            <div class="pop-info">
              <span class="label">Popularity</span>
              <span class="val">{{ opening.popularity }}</span>
            </div>
            <button class="btn btn-primary btn-sm" @click="startTraining(opening.id)">
              Study Theory
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.opening-lab { padding-top: var(--space-8); padding-bottom: var(--space-12); }

.lab-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: var(--space-10); gap: var(--space-6);
  flex-wrap: wrap;
}

.tabs-pill {
  display: flex; background: var(--bg-elevated); padding: 4px;
  border-radius: var(--radius-full); border: 1px solid var(--border);
}
.tabs-pill button {
  padding: 8px 20px; border-radius: var(--radius-full); border: none;
  background: transparent; color: var(--text-muted); font-weight: 700;
  font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.tabs-pill button.active { background: var(--accent); color: white; box-shadow: 0 4px 12px var(--accent-dim); }

/* Repertoire Grid */
.repertoire-grid, .curated-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-6);
}

.opening-card { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-5); }
.card-top { display: flex; gap: var(--space-4); align-items: center; }
.opening-icon { font-size: 2rem; }
.opening-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; margin: 2px 0 6px 0; font-style: italic; }
.games-count { font-size: 0.7rem; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

.performance-stats { display: flex; flex-direction: column; gap: var(--space-3); }
.stat-row { display: flex; align-items: center; gap: var(--space-3); font-size: 0.75rem; }
.stat-row label { min-width: 60px; color: var(--text-muted); font-weight: 600; }
.progress-bar-sm { flex: 1; height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; }
.progress-bar-sm .fill { height: 100%; transition: width 1s ease; }
.stat-row .pct { font-weight: 700; min-width: 35px; text-align: right; }

/* Study Card */
.study-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.study-header { display: flex; justify-content: space-between; align-items: flex-start; }
.study-icon { font-size: 2.5rem; }
.badge-difficulty {
  font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: var(--radius-full);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.badge-difficulty.beginner { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-difficulty.intermediate { background: rgba(234, 179, 8, 0.15); color: #fbbf24; border: 1px solid rgba(234, 179, 8, 0.3); }

.moves-text { font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-bright); background: rgba(0,0,0,0.2); padding: 8px; border-radius: var(--radius-sm); }

.study-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--space-4); border-top: 1px solid var(--border); }
.pop-info { display: flex; flex-direction: column; }
.pop-info .label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; }
.pop-info .val { font-size: 0.85rem; font-weight: 700; }

.empty-state { grid-column: 1 / -1; text-align: center; padding: var(--space-12); }
.empty-state .icon { font-size: 4rem; margin-bottom: var(--space-4); }

/* Coach's Notes Prescriptions */
.rx-section { margin-bottom: var(--space-8); }
.rx-strip { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.rx-card {
  flex: 1; min-width: 240px; padding: var(--space-4);
  display: flex; gap: var(--space-3); align-items: flex-start;
  transition: transform 0.2s;
}
.rx-card:hover { transform: translateY(-2px); }
.rx-card.rx-critical { border-left: 3px solid var(--rose); }
.rx-card.rx-warning  { border-left: 3px solid var(--gold); }
.rx-card.rx-good     { border-left: 3px solid var(--green); }
.rx-card.rx-info     { border-left: 3px solid var(--accent); }
.rx-icon { font-size: 1.3rem; flex-shrink: 0; margin-top: 2px; }
.rx-body h5 { font-weight: 700; font-size: 0.85rem; margin-bottom: 2px; }
.rx-body p { font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; }

/* Loading State Enhancements */
.loading-state {
  max-width: 600px; margin: var(--space-12) auto; padding: var(--space-12);
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-8);
}
.spinner-wrap { position: relative; width: 80px; height: 80px; }
.spinner {
  width: 100%; height: 100%; border: 4px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 1s linear infinite;
}
.spinner-center {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-family: var(--font-mono); font-size: 1.1rem; color: var(--accent-bright);
}

.progress-bar-loading { width: 100%; height: 6px; background: var(--bg-elevated); border-radius: 99px; overflow: hidden; }
.progress-bar-loading .fill { height: 100%; background: var(--accent-gradient); transition: width 0.4s ease; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
