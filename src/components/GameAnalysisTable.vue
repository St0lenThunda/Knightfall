<template>
  <div class="game-analysis-table glass-sm animated-fade-in">
    <table class="analysis-table">
      <thead>
        <!-- Avatar Row -->
        <tr>
          <th class="player-col white">
            <div class="avatar-wrap">
              <img :src="whitePlayer.avatar || '/avatars/default.png'" class="avatar" />
            </div>
          </th>
          <th class="icon-col"></th>
          <th class="player-col black">
            <div class="avatar-wrap">
              <img :src="blackPlayer.avatar || '/avatars/default.png'" class="avatar" />
            </div>
          </th>
        </tr>
        <!-- Name Row -->
        <tr>
          <th class="player-col white name">{{ whitePlayer.name }}</th>
          <th class="icon-col"></th>
          <th class="player-col black name">{{ blackPlayer.name }}</th>
        </tr>
        <!-- Rating Row -->
        <tr>
          <th class="player-col white rating">Rating: {{ whitePlayer.rating || '?' }}</th>
          <th class="icon-col"></th>
          <th class="player-col black rating">Rating: {{ blackPlayer.rating || '?' }}</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="q in QUALITIES" :key="q.id" class="quality-row">
          <td class="count white">{{ stats.white[q.id] }}</td>
          <td class="quality-icon" :style="{ color: q.color }">
            <span class="icon">{{ q.icon }}</span>
            <span class="quality-label-text">{{ q.label }}</span>
          </td>
          <td class="count black">{{ stats.black[q.id] }}</td>
        </tr>
      </tbody>

      <tfoot>
        <tr class="summary-row">
          <td class="summary white">
            <div class="main-accuracy">{{ accuracies.white.total }}% Accuracy</div>
            <div class="phase-breakdown">
              <span title="Opening">O: {{ accuracies.white.opening }}%</span>
              <span title="Middlegame">M: {{ accuracies.white.middle }}%</span>
              <span title="Endgame">E: {{ accuracies.white.endgame }}%</span>
            </div>
            <div class="elo">Played like: {{ accuracies.white.perfRating }}</div>
          </td>
          <td class="quality-icon">SUMMARY</td>
          <td class="summary black">
            <div class="main-accuracy">{{ accuracies.black.total }}% Accuracy</div>
            <div class="phase-breakdown">
              <span title="Opening">O: {{ accuracies.black.opening }}%</span>
              <span title="Middlegame">M: {{ accuracies.black.middle }}%</span>
              <span title="Endgame">E: {{ accuracies.black.endgame }}%</span>
            </div>
            <div class="elo">Played like: {{ accuracies.black.perfRating }}</div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QUALITIES, getMoveQuality } from '../utils/analysisUtils'

interface Player {
  name: string
  avatar?: string
  rating?: string | number
}

const props = defineProps<{
  moves: any[]
  whitePlayer: Player
  blackPlayer: Player
  gameSeed: number
}>()

/**
 * Calculates move quality counts for both players.
 */
const stats = computed(() => {
  const white: Record<string, number> = {}
  const black: Record<string, number> = {}
  
  QUALITIES.forEach(q => {
    white[q.id] = 0
    black[q.id] = 0
  })

  props.moves.forEach((move, idx) => {
    const quality = getMoveQuality(move, idx, props.gameSeed)
    if (idx % 2 === 0) {
      white[quality.id]++
    } else {
      black[quality.id]++
    }
  })

  return { white, black }
})

const accuracies = computed(() => {
  const calculatePhaseAcc = (playerMoves: any[]) => {
    if (playerMoves.length === 0) return 100
    let score = 0
    playerMoves.forEach((m, idx) => {
      const q = getMoveQuality(m, idx, props.gameSeed)
      if (['brilliant', 'great', 'best', 'book'].includes(q.id)) score += 100
      else if (q.id === 'excellent') score += 95
      else if (q.id === 'good') score += 85
      else if (q.id === 'inaccuracy') score += 60
      else if (q.id === 'mistake') score += 30
      else if (q.id === 'blunder') score += 0
    })
    return Math.round(score / playerMoves.length)
  }

  const wMoves = props.moves.filter((_, i) => i % 2 === 0)
  const bMoves = props.moves.filter((_, i) => i % 2 !== 0)

  // Phases: Opening (1-10), Middle (11-30), Endgame (31+)
  const getPhaseMoves = (moves: any[], phase: 'o' | 'm' | 'e') => {
    if (phase === 'o') return moves.filter(m => m.moveNumber <= 10)
    if (phase === 'm') return moves.filter(m => m.moveNumber > 10 && m.moveNumber <= 30)
    return moves.filter(m => m.moveNumber > 30)
  }

  return {
    white: {
      total: calculatePhaseAcc(wMoves),
      opening: calculatePhaseAcc(getPhaseMoves(wMoves, 'o')),
      middle: calculatePhaseAcc(getPhaseMoves(wMoves, 'm')),
      endgame: calculatePhaseAcc(getPhaseMoves(wMoves, 'e')),
      perfRating: accuracyToRating(calculatePhaseAcc(wMoves))
    },
    black: {
      total: calculatePhaseAcc(bMoves),
      opening: calculatePhaseAcc(getPhaseMoves(bMoves, 'o')),
      middle: calculatePhaseAcc(getPhaseMoves(bMoves, 'm')),
      endgame: calculatePhaseAcc(getPhaseMoves(bMoves, 'e')),
      perfRating: accuracyToRating(calculatePhaseAcc(bMoves))
    }
  }
})

function accuracyToRating(acc: number): number {
  // Simple heuristic mapping accuracy (0-100) to typical Elo performance
  // 95+ -> 2800, 90 -> 2400, 80 -> 2000, 60 -> 1200, 40 -> 600
  if (acc >= 95) return 2800 + (acc - 95) * 40
  if (acc >= 80) return 2000 + (acc - 80) * 40
  if (acc >= 60) return 1200 + (acc - 60) * 40
  if (acc >= 40) return 600 + (acc - 40) * 30
  return Math.max(100, acc * 10)
}
</script>

<style scoped>
.game-analysis-table {
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.analysis-table {
  width: 100%;
  border-collapse: collapse;
}

.player-col {
  width: 40%;
  text-align: center;
  padding: var(--space-2);
}

.player-col.white { border-right: 1px solid rgba(255, 255, 255, 0.05); }
.player-col.black { border-left: 1px solid rgba(255, 255, 255, 0.05); }

.icon-col {
  width: 20%;
}

.avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-2);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--accent-dim);
  object-fit: cover;
}

.name {
  font-size: 0.9rem;
  font-weight: 800;
  color: white;
}

.rating {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quality-row td {
  padding: 10px 0;
  text-align: center;
}

.count {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 800;
}

.count.white { color: var(--accent-bright); }
.count.black { color: white; }

.quality-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.quality-icon .icon {
  font-size: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 2px;
}

.quality-label-text {
  font-size: 0.55rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.summary-row td {
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.summary {
  text-align: center;
}

.main-accuracy {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--green);
  text-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

.phase-breakdown {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 6px 0;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-muted);
}

.phase-breakdown span {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

.elo {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.quality-icon {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}
</style>
