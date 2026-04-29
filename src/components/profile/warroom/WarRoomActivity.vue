<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../../stores/userStore'
import { useLibraryStore } from '../../../stores/libraryStore'

const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()

const recentGames = computed(() => {
  // --- ROBUST SORTING: Ensure newest games are always first ---
  const sorted = [...libraryStore.personalGames].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
  
  return sorted.slice(0, 5).map(g => {
    const isWhite = userStore.isMe(g.white)
    const isBlack = userStore.isMe(g.black)
    
    // Safety check: Ensure we are actually on one of the sides
    if (!isWhite && !isBlack) return null

    const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && isBlack)
    const draw = g.result === '1/2-1/2' || g.result.includes('1/2')
    
    return {
      id: g.id,
      opponent: isWhite ? g.black : g.white,
      result: won ? 'win' : (draw ? 'draw' : 'loss'),
      control: g.event || 'Blitz',
      opening: g.eco || '---',
      score: g.result
    }
  }).filter(Boolean) as any[]
})

defineEmits(['switchTab'])
</script>

<template>
  <div class="glass card-v3 mb-6">
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
      <div v-if="recentGames.length === 0" class="muted p-4 italic">
        No games analyzed in this vault yet.
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.game-list-merged { display: flex; flex-direction: column; gap: 4px; }
.game-row-merged {
  display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.02); cursor: pointer; transition: all 0.2s;
}
.game-row-merged:hover { background: rgba(255, 255, 255, 0.05); }
.game-result-dot { width: 8px; height: 8px; border-radius: 50%; }
.game-result-dot.win { background: var(--green); box-shadow: 0 0 8px var(--green); }
.game-result-dot.loss { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.game-result-dot.draw { background: var(--gold); box-shadow: 0 0 8px var(--gold); }

.game-info { flex: 1; display: flex; flex-direction: column; }
.game-opponent { font-weight: 700; font-size: 0.95rem; }
.game-score { font-family: var(--font-mono); font-weight: 800; }
.game-score.win { color: var(--green); }
.game-score.loss { color: var(--rose); }
.game-score.draw { color: var(--gold); }

.btn-cleanup-text {
  background: none; border: none; color: var(--accent); font-size: 0.75rem; font-weight: 800; cursor: pointer; letter-spacing: 0.05em;
}
.btn-cleanup-text:hover { color: var(--accent-bright); }
</style>
