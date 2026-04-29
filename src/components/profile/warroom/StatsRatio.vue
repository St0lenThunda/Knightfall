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
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12" 
                  :stroke-dasharray="`${(libraryStore.libraryWldStats.winPct / 100) * 251.3} 251.3`" 
                  stroke-dashoffset="0" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12" 
                  :stroke-dasharray="`${(libraryStore.libraryWldStats.lossPct / 100) * 251.3} 251.3`" 
                  :stroke-dashoffset="-((libraryStore.libraryWldStats.winPct / 100) * 251.3)" />
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
        <div class="breakdown-row">
          <div class="dot bg-green"></div>
          <span class="label">Wins</span>
          <span class="val">{{ libraryStore.libraryWldStats.win }}</span>
          <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</span>
        </div>
        <div class="breakdown-row">
          <div class="dot bg-rose"></div>
          <span class="label">Losses</span>
          <span class="val">{{ libraryStore.libraryWldStats.loss }}</span>
          <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.lossPct) }}%</span>
        </div>
        <div class="breakdown-row">
          <div class="dot bg-gold"></div>
          <span class="label">Draws</span>
          <span class="val">{{ libraryStore.libraryWldStats.draw }}</span>
          <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.drawPct) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.wld-layout-v2 { display: flex; align-items: center; gap: var(--space-10); }
.wld-ring-container-v2 { position: relative; width: 120px; height: 120px; }
.wld-ring { transform: rotate(-90deg); }
.wld-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wld-center .label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
.wld-pct { font-size: 1.5rem; font-weight: 900; margin-bottom: 4px; }

.wld-breakdown-v2 { flex: 1; display: flex; flex-direction: column; gap: var(--space-3); }
.breakdown-row { 
  display: grid; grid-template-columns: 8px 1fr 40px 45px; align-items: center; gap: var(--space-4); 
  padding: var(--space-2) var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); 
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.bg-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
.bg-rose { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.bg-gold { background: var(--gold); box-shadow: 0 0 8px var(--gold); }
</style>
