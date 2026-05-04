<script setup lang="ts">
/**
 * MORTAL PROBABILITY GRAPH
 * 
 * Visualizes the likelihood of different human archetypes playing the 
 * current candidate moves.
 */
import { computed, watch } from 'vue'
import { useMortalLogic } from '../../stores/engine/useMortalLogic'

const props = defineProps<{
  topMoves: any[] // Stockfish candidate moves
}>()

const { ARCHETYPES } = useMortalLogic()

/**
 * Mock probability calculation logic.
 * In a real run, this would be based on Stockfish eval vs Archetype sharpness.
 */
const moveProbabilities = computed(() => {
  return props.topMoves.map((move, index) => {
    return {
      san: move.moves?.[0] || '?',
      eval: (move.cp || 0) / 100,
      archetypes: Object.values(ARCHETYPES).map(arch => ({
        id: arch.id,
        icon: arch.icon,
        name: arch.name,
        // Heuristic: Probability is higher for simple moves, 
        // and influenced by archetype sharpness.
        probability: Math.max(10, Math.min(95, 
          100 - (index * 20) + (arch.sharpness * 15) - (Math.abs(move.cp || 0) > 300 ? 20 : 0)
        ))
      }))
    }
  })
})

watch(() => props.topMoves, (newMoves: any[]) => {
  console.log(`[MortalGraph] Received ${newMoves.length} candidate moves`, newMoves)
}, { immediate: true })
</script>

<template>
  <div class="mortal-graph glass-panel p-4">
    <div class="graph-header mb-4">
      <h4 class="text-accent">PSYCHOLOGICAL PROFILE</h4>
      <p class="muted text-xs">Human likelihood per candidate move</p>
    </div>

    <div v-if="moveProbabilities.length === 0" class="empty-graph-state py-8 text-center glass-xs">
      <div class="text-2xl mb-2">⏳</div>
      <div class="text-xs font-bold text-accent uppercase tracking-widest">Waiting for Engine</div>
      <div class="text-[10px] text-muted mt-1 px-4">The Oracle requires candidate moves to generate a psychological profile.</div>
    </div>

    <div v-else class="moves-container">
      <div v-for="move in moveProbabilities" :key="move.san" class="move-row mb-6">
        <div class="move-info flex justify-between items-center mb-2">
          <span class="move-badge">{{ move.san }}</span>
          <span class="eval-tag" :class="move.eval >= 0 ? 'plus' : 'minus'">
            {{ move.eval >= 0 ? '+' : '' }}{{ move.eval.toFixed(1) }}
          </span>
        </div>

        <div class="archetype-bars">
          <div v-for="arch in move.archetypes" :key="arch.id" class="arch-item">
            <div class="arch-meta">
              <span class="icon">{{ arch.icon }}</span>
              <span class="name">{{ arch.name }}</span>
            </div>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ width: arch.probability + '%', background: arch.id === 'aggressor' ? 'var(--rose)' : 'var(--accent-bright)' }"
              ></div>
              <span class="prob-label">{{ Math.round(arch.probability) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mortal-graph {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border-glass);
}

.graph-header h4 {
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.move-badge {
  background: var(--bg-card);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-weight: 700;
  border: 1px solid var(--border);
}

.eval-tag { font-size: 0.75rem; font-weight: 800; }
.eval-tag.plus { color: var(--accent-bright); }
.eval-tag.minus { color: var(--rose); }

.archetype-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.arch-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 12px;
}

.arch-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 700;
}

.bar-container {
  height: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.prob-label {
  position: absolute;
  right: -30px;
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
}
</style>
