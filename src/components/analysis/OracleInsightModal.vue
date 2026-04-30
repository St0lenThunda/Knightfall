<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && tag" class="modal-overlay" @click.self="$emit('close')">
        <div class="tag-popup-modal glass-heavy animated-scale-in" :class="tag.severity">
          <div class="popup-accent-bar"></div>
          
          <header class="popup-header">
            <div class="severity-badge">
              {{ tag.severity.toUpperCase() }}
            </div>
            <button class="btn-close" @click="$emit('close')">✕</button>
          </header>

          <div class="popup-body">
            <div class="tag-main-info">
              <span class="tag-icon">{{ categoryIcon }}</span>
              <div class="tag-title-group">
                <h3>{{ tag.theme }}</h3>
                <p class="eval-drop">Evaluation drop: <strong>{{ tag.evalDrop.toFixed(1) }}</strong> pawns</p>
              </div>
            </div>

            <div class="tag-explanation-box glass-xs" v-html="renderedExplanation"></div>

            <div v-if="suggestedMove" class="better-move-suggestion">
              <label>ORACLE'S SUGGESTION</label>
              <div class="suggestion-line">
                <span class="move-arrow">➜</span>
                <span class="suggested-move">{{ suggestedMove }}</span>
                <span class="suggestion-reason">was significantly stronger in this position.</span>
              </div>
            </div>
          </div>

          <footer class="popup-footer">
            <button class="btn btn-primary btn-glow" @click="$emit('close')">Understood</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../../utils/markdown'

/**
 * OracleInsightModal Component
 * 
 * Logic: Displays deterministic move quality explanations (Mistakes, Blunders, etc.)
 * Why: Keeps the heavy "Oracle Insight" UI out of the main Analysis orchestrator.
 */

const props = defineProps<{
  show: boolean
  tag: any | null
  suggestedMove: string | null
}>()

defineEmits<{
  (e: 'close'): void
}>()

const categoryIcon = computed(() => {
  if (!props.tag) return '🧱'
  switch (props.tag.category) {
    case 'tactics': return '⚡'
    case 'opening': return '📖'
    case 'missed_win': return '🎯'
    default: return '🧱'
  }
})

const renderedExplanation = computed(() => renderMarkdown(props.tag?.explanation || null))

</script>

<style scoped>
.tag-popup-modal {
  position: relative;
  width: 90%;
  max-width: 450px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--glass-border);
}

.popup-accent-bar {
  height: 6px;
  width: 100%;
}

.blunder .popup-accent-bar { background: var(--rose); }
.mistake .popup-accent-bar { background: var(--orange); }
.inaccuracy .popup-accent-bar { background: var(--yellow); }
.brilliant .popup-accent-bar { background: var(--cyan); }
.best .popup-accent-bar { background: var(--teal); }

.popup-header {
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.severity-badge {
  font-size: 0.65rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 4px;
  background: var(--glass-bg);
  letter-spacing: 1.5px;
  color: var(--text-main);
}

.popup-body {
  padding: 0 var(--space-6) var(--space-6) var(--space-6);
}

.tag-main-info {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  margin-bottom: var(--space-4);
}

.tag-icon {
  font-size: 2.5rem;
}

.tag-title-group h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
}

.eval-drop {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.eval-drop strong {
  color: var(--rose-light);
}

.tag-explanation-box {
  padding: var(--space-4);
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-main);
  margin-bottom: var(--space-6);
}

.better-move-suggestion label {
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--accent-light);
  letter-spacing: 1px;
  display: block;
  margin-bottom: 8px;
}

.suggestion-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.move-arrow {
  color: var(--teal);
  font-weight: bold;
}

.suggested-move {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  color: var(--teal-light);
  background: var(--teal-dim);
  padding: 2px 6px;
  border-radius: 4px;
}

.suggestion-reason {
  color: var(--text-muted);
}

.popup-footer {
  padding: var(--space-4) var(--space-6);
  background: rgba(0,0,0,0.2);
  display: flex;
  justify-content: flex-end;
}
</style>
