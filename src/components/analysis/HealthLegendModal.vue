<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content glass-heavy health-legend-modal animated-scale-in">
          <header class="modal-header">
            <div class="title-group">
              <span class="badge badge-accent">HEURISTICS_V1</span>
              <h2>Positional Health Index</h2>
              <p class="muted">Understanding the engine's structural evaluation</p>
            </div>
            <button class="btn-close" @click="$emit('close')">✕</button>
          </header>
          <div class="modal-body">
            <!-- Contextual Diagnosis Section -->
            <div class="contextual-diagnosis glass-xs">
              <div class="diagnosis-header">
                <span class="dot-pulse"></span>
                <h4>LIVE DIAGNOSIS</h4>
              </div>
              <div class="diagnosis-grid">
                <div class="diag-cell">
                  <label>MAT</label>
                  <p>{{ diagnosis.material }}</p>
                </div>
                <div class="diag-cell">
                  <label>ACT</label>
                  <p>{{ diagnosis.activity }}</p>
                </div>
                <div class="diag-cell">
                  <label>KGS</label>
                  <p>{{ diagnosis.safety }}</p>
                </div>
              </div>
            </div>

            <div class="legend-items">
              <div class="legend-item">
                <div class="icon-wrap" style="background: var(--accent-dim);">MAT</div>
                <div class="content">
                  <h3>Material Balance (MAT)</h3>
                  <p>Calculates the sum of piece values for White vs Black. Weighted for positional compensation (e.g., bishops are slightly higher than knights in open positions).</p>
                </div>
              </div>
              <div class="legend-item">
                <div class="icon-wrap" style="background: var(--teal-dim);">ACT</div>
                <div class="content">
                  <h3>Piece Activity (ACT)</h3>
                  <p>Measures "Mobility & Space". Tracks how many legal moves are available and how much of the board your pieces control compared to your opponent.</p>
                </div>
              </div>
              <div class="legend-item">
                <div class="icon-wrap" style="background: var(--rose-dim);">KGS</div>
                <div class="content">
                  <h3>King Safety (KGS)</h3>
                  <p>A composite score of pawn shelter, enemy proximity, and tactical exposure. Drops sharply if you are in check or if enemy pieces are swarming your king.</p>
                </div>
              </div>
            </div>
          </div>
          <footer class="modal-footer">
            <button class="btn btn-primary" @click="$emit('close')">Understood</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * HealthLegendModal Component
 * 
 * Logic: Explains the KNF Positional Health metrics (MAT, ACT, KGS).
 * Why: Moves complex static legend data out of the main Analysis view.
 */

defineProps<{
  show: boolean
  diagnosis: {
    material: string
    activity: string
    safety: string
  }
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.health-legend-modal {
  max-width: 550px;
  width: 90%;
  border-radius: 20px;
  overflow: hidden;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-group h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.8rem;
  font-weight: 800;
  margin: 4px 0;
}

.contextual-diagnosis {
  margin-bottom: var(--space-8);
  padding: var(--space-4);
  border-radius: 12px;
}

.diagnosis-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.diagnosis-header h4 {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--accent-light);
}

.diagnosis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.diag-cell label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
  display: block;
}

.diag-cell p {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.legend-item {
  display: flex;
  gap: var(--space-4);
}

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.content h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.content p {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.modal-footer {
  padding: var(--space-6);
  display: flex;
  justify-content: flex-end;
  background: rgba(0,0,0,0.1);
}

.dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-main);
  animation: dot-pulse 2s infinite;
}

@keyframes dot-pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}
</style>
