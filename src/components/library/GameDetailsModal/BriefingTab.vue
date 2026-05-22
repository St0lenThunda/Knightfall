<template>
  <div class="briefing-tab">
    <!-- Intelligence Briefing (DNA Metrics) -->
    <div class="intel-briefing glass-xs" v-if="hasEvals && !isSynthesizing">
      <header class="intel-header">
        <span class="icon">🧬</span>
        <span class="title">Intelligence Briefing</span>
      </header>
      <div class="intel-grid">
        <div class="intel-stat" title="Average Centipawn Loss">
          <span class="val">{{ game.acpl }}</span>
          <span class="label">ACPL</span>
        </div>
        <div class="intel-stat" title="Theoretical Knowledge">
          <span class="val">{{ game.theoreticalAccuracy }}%</span>
          <span class="label">Book</span>
        </div>
        <div class="intel-stat text-rose" v-if="game.blunderCount">
          <span class="val">{{ game.blunderCount }}</span>
          <span class="label">Blunders</span>
        </div>
        <div class="intel-stat text-gold" v-if="game.mistakeCount">
          <span class="val">{{ game.mistakeCount }}</span>
          <span class="label">Mistakes</span>
        </div>
        <div class="intel-stat text-orange" v-if="game.inaccuracyCount">
          <span class="val">{{ game.inaccuracyCount }}</span>
          <span class="label">Inaccuracies</span>
        </div>
        <div class="intel-stat text-cyan" v-if="game.brilliantCount">
          <span class="val">{{ game.brilliantCount }}</span>
          <span class="label">Brilliant</span>
        </div>
      </div>
    </div>
    <!-- Synthesis Progress (already handled in parent) -->
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * BriefingTab – sub‑component for the "Intelligence" tab of GameDetailsModal.
 * It receives the same props as the parent to keep it simple and avoid circular imports.
 */
import { defineProps } from 'vue'

const props = defineProps<{
  game: any
  libraryStore: any
  hasEvals: boolean
  isSynthesizing: boolean
  progressPercent: number
  formattedAddedAt: string
  rawHeaders: Record<string, any>
  avgThinkingTime: number
  timeScarcity: number
}>()
</script>

<style scoped>
.briefing-tab { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
