<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="glass-lg badge-modal-v2">
          <button class="btn-close-absolute" @click="$emit('close')">✕</button>

          <header class="modal-header">
            <div class="title-group">
              <h3>Badge Showcase</h3>
              <p class="muted">Your journey of mastery and milestones</p>
            </div>
            <div class="completion-summary">
              <span class="count">{{ coachStore.achievements.earnedCount }}</span>
              <span class="total">/ {{ coachStore.achievements.totalCount }} Earned</span>
            </div>
          </header>
          
          <div class="badge-layout">
            <!-- Left: Scrollable List -->
            <div class="badge-list-sidebar custom-scrollbar">
              <div v-for="pillar in badgePillars" :key="pillar.id" class="badge-pillar-section">
                <div class="pillar-label">
                  <span class="icon">{{ pillar.icon }}</span>
                  <span>{{ pillar.label }}</span>
                </div>
                <div class="badge-grid-v2">
                  <div 
                    v-for="b in coachStore.achievements.badges.filter(x => x.pillar === pillar.id)" 
                    :key="b.id" 
                    class="badge-hex-item"
                    :class="{ 
                      'is-earned': b.earned, 
                      'is-selected': selectedBadge?.id === b.id,
                      ['pillar-' + b.pillar]: true
                    }"
                    @click="selectedBadge = b"
                  >
                    <div class="badge-hex-inner">
                      <span class="icon">{{ b.icon }}</span>
                    </div>
                    <div v-if="b.earned" class="earned-sparkle"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Detail Panel -->
            <div class="badge-detail-panel glass-sm">
              <Transition name="fade-slide" mode="out-in">
                <div v-if="selectedBadge" :key="selectedBadge.id" class="detail-content">
                  <div class="detail-icon-wrap" :class="'pillar-' + selectedBadge.pillar">
                    <div class="large-icon">{{ selectedBadge.icon }}</div>
                    <div class="icon-ring"></div>
                  </div>
                  
                  <div class="detail-info text-center mt-6">
                    <span class="pillar-tag" :class="'pillar-' + selectedBadge.pillar">{{ selectedBadge.pillar.toUpperCase() }}</span>
                    <h2 class="mt-2">{{ selectedBadge.label }}</h2>
                    <p class="muted mt-4">{{ selectedBadge.description }}</p>
                  </div>

                  <div class="detail-progress mt-8">
                    <div class="progress-header">
                      <span class="status">{{ selectedBadge.earned ? 'ACHIEVED' : 'IN PROGRESS' }}</span>
                      <span class="val">{{ selectedBadge.progressLabel }}</span>
                    </div>
                    <div class="progress-track-lg">
                      <div class="progress-fill" :style="{ width: (selectedBadge.progress || 0) * 100 + '%', background: getPillarColor(selectedBadge.pillar) }"></div>
                    </div>
                  </div>

                  <div v-if="selectedBadge.earned" class="earned-date mt-6">
                    <span class="icon">✨</span>
                    <span>Achievement Unlocked</span>
                  </div>
                </div>
                <div v-else class="empty-detail">
                  <div class="placeholder-icon">🏅</div>
                  <p class="muted">Select a badge to view details</p>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCoachStore } from '../../../stores/coachStore'

/**
 * BadgeShowcaseModal
 * 
 * Displays the user's earned achievements across tactical pillars.
 */
defineProps<{
  visible: boolean;
}>()

defineEmits(['close'])

const coachStore = useCoachStore()
const selectedBadge = ref<any>(null)

const badgePillars = [
  { id: 'tactics', label: 'Tactics', icon: '⚡' },
  { id: 'strategy', label: 'Strategy', icon: '♟' },
  { id: 'grind', label: 'Consistency', icon: '🔨' },
  { id: 'vault', label: 'Curation', icon: '🗄️' },
]

function getPillarColor(pillar: string) {
  switch (pillar) {
    case 'tactics': return 'var(--rose)'
    case 'strategy': return 'var(--accent)'
    case 'grind': return 'var(--gold)'
    case 'vault': return 'var(--teal)'
    default: return 'var(--text-muted)'
  }
}
</script>

<style scoped>
/* Modal Structure */
.badge-modal-v2 {
  width: 90vw;
  max-width: 900px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.modal-header {
  padding: var(--space-6) var(--space-8);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completion-summary {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: var(--bg-card);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.completion-summary .count { font-size: 1.2rem; font-weight: 900; color: var(--gold); }
.completion-summary .total { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }

.badge-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 340px;
  overflow: hidden;
}

/* Sidebar List */
.badge-list-sidebar {
  padding: var(--space-8);
  overflow-y: auto;
  background: rgba(0,0,0,0.1);
}

.badge-pillar-section { margin-bottom: var(--space-8); }
.pillar-label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--space-5);
}

.badge-grid-v2 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: var(--space-4);
}

.badge-hex-item {
  width: 64px;
  height: 64px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0.3;
  filter: grayscale(1);
}

.badge-hex-item.is-earned { opacity: 1; filter: none; }
.badge-hex-item.is-selected { transform: scale(1.1); filter: drop-shadow(0 0 12px var(--glow-color)); }

.badge-hex-inner {
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 2px solid var(--border);
}

.badge-hex-item.is-selected .badge-hex-inner { border-color: var(--glow-color); }

.badge-hex-item.pillar-tactics   { --glow-color: var(--rose); }
.badge-hex-item.pillar-strategy  { --glow-color: var(--accent); }
.badge-hex-item.pillar-grind     { --glow-color: var(--gold); }
.badge-hex-item.pillar-vault     { --glow-color: var(--teal); }

/* Detail Panel */
.badge-detail-panel {
  border-left: 1px solid var(--border);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.detail-icon-wrap {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
}

.icon-ring {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px dashed var(--glow-color);
  opacity: 0.3;
  animation: rotate 10s linear infinite;
}

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.pillar-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.pillar-tag.pillar-tactics  { background: var(--rose-dim); color: var(--rose); }
.pillar-tag.pillar-strategy { background: var(--accent-dim); color: var(--accent-bright); }
.pillar-tag.pillar-grind    { background: var(--gold-dim); color: var(--gold); }
.pillar-tag.pillar-vault    { background: var(--teal-dim); color: var(--teal); }

.progress-track-lg {
  height: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-fill { height: 100%; transition: width 0.6s ease; }

.btn-close-absolute {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.2);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-close-absolute:hover { background: var(--rose); color: white; border-color: var(--rose); }

@media (max-width: 800px) {
  .badge-layout { grid-template-columns: 1fr; }
  .badge-detail-panel { display: none; }
}
</style>
