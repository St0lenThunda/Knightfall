<script setup lang="ts">
/**
 * StatsRatio: Renders the Win/Loss/Draw performance ring and breakdown.
 * Part of the modular WarRoomStats decomposition.
 */
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()
</script>

<template>
  <div class="glass card-v3 mb-6">
    <div class="card-header">
      <div class="header-main">
        <h4 class="text-glow">Performance Ratio</h4>
        <div class="wld-stats-summary muted">
          {{ libraryStore.libraryWldStats.total }} Games Analyzed
        </div>
      </div>
      <span class="stat-info-trigger" data-tooltip="Your overall combat efficiency. Measures how consistently you convert positions into results.">ⓘ</span>
    </div>
    
    <div class="wld-layout-v2 mt-4">
      <div class="wld-ring-container-v2">
        <svg viewBox="0 0 100 100" class="wld-ring">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="10"/>
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--green)" stroke-width="10" 
                  :stroke-dasharray="`${(libraryStore.libraryWldStats.winPct / 100) * 263.9} 263.9`" 
                  stroke-dashoffset="0" 
                  class="glow-win" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--rose)" stroke-width="10" 
                  :stroke-dasharray="`${(libraryStore.libraryWldStats.lossPct / 100) * 263.9} 263.9`" 
                  :stroke-dashoffset="-((libraryStore.libraryWldStats.winPct / 100) * 263.9)"
                  class="glow-loss" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" stroke-width="10" 
                  :stroke-dasharray="`${(libraryStore.libraryWldStats.drawPct / 100) * 263.9} 263.9`" 
                  :stroke-dashoffset="-(((libraryStore.libraryWldStats.winPct + libraryStore.libraryWldStats.lossPct) / 100) * 263.9)"
                  class="glow-draw" />
        </svg>
        <div class="wld-center">
          <div class="wld-pct text-glow">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</div>
          <div class="label">Win Rate</div>
        </div>
      </div>
      <div class="wld-breakdown-v2">
        <div class="breakdown-row">
          <div class="dot glow-green"></div>
          <span class="label">Wins</span>
          <span class="val">{{ libraryStore.libraryWldStats.win }}</span>
          <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</span>
        </div>
        <div class="breakdown-row">
          <div class="dot glow-rose"></div>
          <span class="label">Losses</span>
          <span class="val">{{ libraryStore.libraryWldStats.loss }}</span>
          <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.lossPct) }}%</span>
        </div>
        <div class="breakdown-row">
          <div class="dot glow-gold"></div>
          <span class="label">Draws</span>
          <span class="val">{{ libraryStore.libraryWldStats.draw }}</span>
          <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.drawPct) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { 
  padding: var(--space-6); 
  border-radius: var(--radius-xl); 
  position: relative;
  overflow: hidden;
}
.card-v3:hover { transform: translateY(-2px); border-color: rgba(139, 92, 246, 0.2); }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
.header-main h4 { margin: 0; font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
.wld-stats-summary { font-size: 0.75rem; font-weight: 600; opacity: 0.6; margin-top: 2px; }

.wld-layout-v2 { display: flex; align-items: center; gap: var(--space-8); }
.wld-ring-container-v2 { position: relative; width: 140px; height: 140px; }
.wld-ring { transform: rotate(-90deg); filter: drop-shadow(0 0 10px rgba(0,0,0,0.5)); }

.glow-win { filter: drop-shadow(0 0 5px var(--green)); }
.glow-loss { filter: drop-shadow(0 0 5px var(--rose)); }
.glow-draw { filter: drop-shadow(0 0 5px var(--gold)); }

.wld-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wld-center .label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; opacity: 0.5; }
.wld-pct { font-size: 2rem; font-weight: 900; margin-bottom: 2px; letter-spacing: -0.02em; }

.wld-breakdown-v2 { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.breakdown-row { 
  display: grid; grid-template-columns: 12px 1fr 30px 45px; align-items: center; gap: var(--space-4); 
  padding: var(--space-3) var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); 
  transition: background 0.2s;
}
.breakdown-row:hover { background: rgba(255,255,255,0.04); }

.dot { width: 8px; height: 8px; border-radius: 50%; }
.glow-green { background: var(--green); box-shadow: var(--glow-green); }
.glow-rose { background: var(--rose); box-shadow: var(--glow-rose); }
.glow-gold { background: var(--gold); box-shadow: var(--glow-gold); }

.label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
.val { font-size: 0.9rem; font-weight: 800; color: var(--text-primary); text-align: right; }
.pct { font-size: 0.75rem; font-family: var(--font-mono); font-weight: 600; text-align: right; }

@media (max-width: 500px) {
  .wld-layout-v2 { flex-direction: column; gap: var(--space-8); }
}
</style>
