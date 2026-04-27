<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'

const userStore = useUserStore()
const showMasteryModal = ref(false)

const rankSymbol = computed(() => {
  const title = userStore.nextTitle
  if (title === 'Pawn') return '♟'
  if (title === 'Knight') return '♞'
  if (title === 'Bishop') return '♝'
  if (title === 'Rook') return '♜'
  if (title === 'Queen') return '♛'
  if (title === 'King') return '♚'
  return '👑'
})

const getNextUnlock = computed(() => {
  const lvl = userStore.currentLevel
  
  // Calculate the next significant milestone (next 10th level)
  const nextMilestone = Math.floor(lvl / 10) * 10 + 10
  
  const milestones: Record<number, { title: string, reward?: string }> = {
    10: { title: 'Knight', reward: 'The Echo Theme' },
    20: { title: 'Bishop', reward: 'Void Avatar Border' },
    30: { title: 'Rook', reward: 'Obsidian Board' },
    40: { title: 'Queen', reward: 'Ethereal Pieces' },
    50: { title: 'King', reward: 'Grandmaster Badge' },
    60: { title: 'World Champion', reward: 'Spectral Halo' }
  }

  const data = milestones[nextMilestone] || { title: 'Legend' }
  const rewardText = data.reward ? ` + ${data.reward}` : ''
  
  return `LVL ${nextMilestone}: ${data.title.toUpperCase()}${rewardText}`
})
</script>

<template>
  <div class="level-progression-bar glass mb-6">
    <div class="rank-icon-large">{{ rankSymbol }}</div>
    
    <div class="progression-main">
      <div class="level-info">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="level-badge">{{ userStore.currentLevelName }} <span class="lvl-num">(LVL {{ userStore.currentLevel }})</span></div>
          <button class="btn-info-circle" @click="showMasteryModal = true" title="How do levels work?">ⓘ</button>
        </div>
        <div class="xp-stats">
          <span class="xp-current">{{ userStore.xp }}</span>
          <span class="xp-target">/ {{ userStore.xpForNextLevel }} XP</span>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: userStore.levelProgress + '%' }"></div>
        <div class="progress-glow" :style="{ width: userStore.levelProgress + '%' }"></div>
      </div>
      <div class="level-footer">
        <span class="next-unlock">NEXT UNLOCK: {{ getNextUnlock }}</span>
        <span class="pct">{{ Math.round(userStore.levelProgress) }}% to Level {{ userStore.currentLevel + 1 }}</span>
      </div>
    </div>

    <!-- Mastery Info Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMasteryModal" class="modal-overlay" @click.self="showMasteryModal = false">
          <div class="glass-lg mastery-modal">
            <header class="modal-header">
              <div class="title-group">
                <h3>Mastery & Leveling</h3>
                <p class="muted">Your journey from Initiate to Grandmaster</p>
              </div>
              <button class="btn-close" @click="showMasteryModal = false">✕</button>
            </header>
            
            <div class="modal-body">
              <div class="mastery-grid">
                <div class="mastery-info-card glass">
                  <h4>How do I Level Up?</h4>
                  <p>Earn XP by solving puzzles, analyzing your games, and winning matches. Knightfall levels follow a <strong>Quadratic Scaling</strong> model—meaning mastery requires increasing dedication.</p>
                  <div class="xp-table mt-4">
                    <div class="xp-row"><span>Puzzle Solved</span><span class="text-green">+15 XP</span></div>
                    <div class="xp-row"><span>Game Analyzed</span><span class="text-teal">+25 XP</span></div>
                    <div class="xp-row"><span>Daily Goal Met</span><span class="text-gold">+50 XP</span></div>
                  </div>
                </div>

                <div class="mastery-info-card glass">
                  <h4>Rank Milestones</h4>
                  <div class="milestone-list mt-4">
                    <div class="milestone-item">
                      <span class="lvl">LVL 1</span>
                      <span class="reward">Initiate (Pawn Title)</span>
                    </div>
                    <div class="milestone-item">
                      <span class="lvl">LVL 10</span>
                      <span class="reward">Apprentice (Knight) + 'Echo' Theme</span>
                    </div>
                    <div class="milestone-item">
                      <span class="lvl">LVL 20</span>
                      <span class="reward">Scholar (Bishop) + 'Void' Border</span>
                    </div>
                    <div class="milestone-item">
                      <span class="lvl">LVL 30</span>
                      <span class="reward">Expert (Rook) + 'Obsidian' Board</span>
                    </div>
                    <div class="milestone-item">
                      <span class="lvl">LVL 40</span>
                      <span class="reward">Master (Queen) + 'Ethereal' Pieces</span>
                    </div>
                    <div class="milestone-item">
                      <span class="lvl">LVL 50</span>
                      <span class="reward">Grandmaster (King) + Mastery Badge</span>
                    </div>
                    <div class="milestone-item">
                      <span class="lvl">LVL 60+</span>
                      <span class="reward">Legend + Spectral Halo Effect</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="modal-footer mt-6">
              <button class="btn btn-primary w-full" @click="showMasteryModal = false">Understood</button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.level-progression-bar {
  padding: var(--space-6) var(--space-8);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  gap: var(--space-10);
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.05), transparent);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.rank-icon-large {
  font-size: 4rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 32px rgba(139, 92, 246, 0.1);
}

.progression-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.level-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.level-badge {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--accent);
  letter-spacing: 0.1em;
}

.lvl-num {
  font-size: 0.8rem;
  opacity: 0.6;
  font-weight: 700;
  margin-left: 4px;
}

.xp-stats {
  font-family: var(--font-mono);
  font-weight: 800;
}
.xp-current { color: white; font-size: 1.1rem; }
.xp-target { color: var(--text-muted); font-size: 0.8rem; }

.progress-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-glow {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: var(--accent);
  filter: blur(8px);
  opacity: 0.3;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.level-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.next-unlock { color: var(--gold); }
.pct { color: var(--text-muted); }

.btn-info-circle {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}
.btn-info-circle:hover { color: var(--accent-bright); }

/* Mastery Modal */
.mastery-modal {
  width: 95%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
}
.mastery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-top: var(--space-6); }
.mastery-info-card { padding: var(--space-5); border-radius: var(--radius-lg); }
.mastery-info-card h4 { margin-bottom: 12px; color: var(--accent-bright); }
.mastery-info-card p { font-size: 0.85rem; line-height: 1.5; }

.xp-table, .milestone-list { display: flex; flex-direction: column; gap: 8px; }
.xp-row, .milestone-item {
  display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; padding: 8px;
  background: rgba(255,255,255,0.03); border-radius: var(--radius-sm);
}
.milestone-item .lvl { color: var(--accent); }
.milestone-item .reward { flex: 1; margin-left: 12px; font-weight: 500; }

@media (max-width: 600px) { .mastery-grid { grid-template-columns: 1fr; } }
</style>
