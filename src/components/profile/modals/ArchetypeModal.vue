<template>
  <Transition name="modal-fade">
    <div v-if="uiStore.isArchetypeModalOpen" class="modal-overlay" @click.self="uiStore.isArchetypeModalOpen = false">
      <div class="archetype-modal glass-lg">
        <button class="close-btn" @click="uiStore.isArchetypeModalOpen = false">×</button>
        
        <div class="modal-header">
          <div class="dna-pulse"></div>
          <h2>Intelligence Profile</h2>
          <p class="text-accent small bold uppercase tracking-widest">Archetype Classification</p>
        </div>

        <div class="modal-body">
          <div class="current-status-section">
            <div class="status-box glass">
              <span class="label">CURRENT STATUS</span>
              <span class="val">{{ userStore.profile?.archetype || 'The Unwritten Page' }}</span>
            </div>
            <p v-if="!userStore.profile?.archetype" class="mt-4 text-muted small">
              The Knightfall intelligence engine is currently scanning your <strong>Gameplay DNA</strong>. 
              We look for signals in your wins, losses, and tactical blunders to determine your "Chess Persona."
            </p>
          </div>

          <div class="archetype-grid mt-8">
            <div class="archetype-item glass">
              <div class="arch-icon">⚔️</div>
              <div class="arch-info">
                <h4>Tactical Opportunist</h4>
                <p>High tactical vision. You thrive in chaotic positions but may struggle with long-term strategic coordination.</p>
              </div>
            </div>

            <div class="archetype-item glass">
              <div class="arch-icon">⏳</div>
              <div class="arch-info">
                <h4>Technical Grindmaster</h4>
                <p>Exceptional endgame technique. You are a monster in simplified positions but might fall behind in the opening.</p>
              </div>
            </div>

            <div class="archetype-item glass">
              <div class="arch-icon">🗺️</div>
              <div class="arch-info">
                <h4>Theoretical Specialist</h4>
                <p>Deep opening preparation. You have an answer for every line but may lose momentum in the middlegame.</p>
              </div>
            </div>

            <div class="archetype-item glass">
              <div class="arch-icon">👤</div>
              <div class="arch-info">
                <h4>The Unwritten Page</h4>
                <p>The starting identity. A balanced initiate with a clean slate, waiting for enough signals to definitively classify.</p>
              </div>
            </div>
          </div>

          <div class="requirements-box mt-8">
            <h5>How to identify your archetype:</h5>
            <ul class="requirements-list">
              <li><span class="bullet">✓</span> <strong>Sync Games:</strong> Ensure your recent games are in the Vault.</li>
              <li><span class="bullet">✓</span> <strong>Cloud Intel:</strong> Run analysis passes to generate "Neural Signals."</li>
              <li><span class="bullet">✓</span> <strong>DNA Reveal:</strong> Visit the DNA Panel to finalize your classification.</li>
            </ul>
          </div>
        </div>

        <div class="modal-footer mt-8">
          <button class="btn btn-accent full-width" @click="uiStore.isArchetypeModalOpen = false">Understood</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUiStore } from '../../../stores/uiStore'
import { useUserStore } from '../../../stores/userStore'

const uiStore = useUiStore()
const userStore = useUserStore()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(10, 10, 15, 0.85);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.archetype-modal {
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-10);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: var(--space-6);
  right: var(--space-6);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.modal-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.dna-pulse {
  width: 4px;
  height: 40px;
  background: var(--accent-gradient);
  margin: 0 auto var(--space-4);
  border-radius: 2px;
  box-shadow: 0 0 15px var(--accent-bright);
  animation: pulse 2s infinite ease-in-out;
}

.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--accent);
}

.status-box .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; }
.status-box .val { font-size: 1.5rem; font-weight: 900; color: var(--accent-bright); text-transform: uppercase; }

.archetype-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.archetype-item {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-6);
  align-items: flex-start;
  transition: transform 0.2s ease;
}

.archetype-item:hover {
  transform: translateX(5px);
  border-color: rgba(255, 255, 255, 0.2);
}

.arch-icon {
  font-size: 1.8rem;
  background: rgba(255, 255, 255, 0.05);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.arch-info h4 { margin-bottom: var(--space-1); color: var(--accent-bright); }
.arch-info p { font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); }

.requirements-box {
  padding: var(--space-6);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-lg);
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.requirements-list li {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bullet { color: var(--accent-bright); font-weight: bold; }

@keyframes pulse {
  0%, 100% { transform: scaleY(1); opacity: 0.8; }
  50% { transform: scaleY(1.5); opacity: 1; }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.btn-accent {
  background: var(--accent-gradient);
  color: white;
  padding: var(--space-4);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.full-width { width: 100%; }
</style>
