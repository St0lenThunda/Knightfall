<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay">
      <div class="modal-content glass-lg animated-slide-up">
        <div class="modal-header">
          <div class="header-title">
            <span class="icon">✍️</span>
            <h3>Edit Game Metadata</h3>
          </div>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="modal-body">
          <div class="input-grid">
            <div class="field">
              <label>Event Name</label>
              <input v-model="form.Event" type="text" placeholder="e.g. Knightfall Match" />
            </div>

            <div class="field">
              <label>Match Date</label>
              <input v-model="form.Date" type="date" />
            </div>

            <div class="row-split">
              <div class="field">
                <label>White Player</label>
                <input v-model="form.White" type="text" />
              </div>
              <div class="field">
                <label>White Elo</label>
                <input v-model="form.WhiteElo" type="text" placeholder="1200" />
              </div>
            </div>

            <div class="row-split">
              <div class="field">
                <label>Black Player</label>
                <input v-model="form.Black" type="text" />
              </div>
              <div class="field">
                <label>Black Elo</label>
                <input v-model="form.BlackElo" type="text" placeholder="1200" />
              </div>
            </div>
          </div>

          <div class="modal-info mt-4 glass-xs p-3">
            <p class="muted text-xs">
              Changes will be applied to the current PGN session and will persist when you save the game to your Vault.
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? 'Applying...' : 'Apply Changes' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * MetadataEditorModal
 * 
 * Allows users to manually overwrite PGN headers for the current session.
 * Essential for fixing imported games with missing names or incorrect event data.
 * 
 * DESIGN: High contrast with defined edges to prevent being "lost" in the UI.
 */
import { ref, watch } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useAnalysisPlayers } from '../../composables/useAnalysisPlayers'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])
const store = useGameStore()
const { resolvedPlayers } = useAnalysisPlayers()
const isSaving = ref(false)

const form = ref<Record<string, string>>({
  Event: '',
  Date: '',
  White: '',
  WhiteElo: '',
  Black: '',
  BlackElo: ''
})

// Sync form with current headers when shown
watch(() => props.show, (isShown) => {
  if (isShown) {
    const h = store.chess.header()
    const resolved = resolvedPlayers.value
    
    // Convert PGN date (YYYY.MM.DD) to HTML date (YYYY-MM-DD)
    let dateVal = h.Date || ''
    if (dateVal.includes('.')) {
      dateVal = dateVal.replace(/\./g, '-')
    } else if (dateVal === '????.??.??' || !dateVal) {
      dateVal = new Date().toISOString().split('T')[0]
    }

    form.value = {
      Event: h.Event || 'Knightfall Match',
      Date: dateVal,
      // Prefill with resolved names if headers are generic
      White: (h.White && h.White !== '?' && h.White !== 'White') ? h.White : resolved.white.name,
      WhiteElo: (h.WhiteElo && h.WhiteElo !== '?' && h.WhiteElo !== '0') ? h.WhiteElo : String(resolved.white.rating || '1200'),
      Black: (h.Black && h.Black !== '?' && h.Black !== 'Black') ? h.Black : resolved.black.name,
      BlackElo: (h.BlackElo && h.BlackElo !== '?' && h.BlackElo !== '0') ? h.BlackElo : String(resolved.black.rating || '1200')
    }
  }
})

async function handleSave() {
  isSaving.value = true
  try {
    const pgnData = { ...form.value }
    
    // Convert HTML date (YYYY-MM-DD) back to PGN date (YYYY.MM.DD)
    if (pgnData.Date) {
      pgnData.Date = pgnData.Date.replace(/-/g, '.')
    }

    if (typeof store.setHeaders === 'function') {
      await store.setHeaders(pgnData)
    }
    emit('close')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>

.modal-content {
  width: 100%;
  max-width: 500px;
  background: rgba(10, 10, 15, 0.98);

  border-radius: var(--radius-lg);
  /* INCREASED CONTRAST BORDER */
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 30px 60px -12px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 20px rgba(0, 255, 255, 0.05); /* Subtle cyber-glow */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: var(--space-5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-title .icon {
  font-size: 1.2rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 50, 50, 0.2);
  border-color: rgba(255, 50, 50, 0.4);
}

.modal-body {
  padding: var(--space-5);
}

.input-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.row-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field label {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--accent-bright);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  color: white;
  font-size: 1rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

input:focus {
  outline: none;
  border-color: var(--accent-bright);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.15);
  transform: translateX(4px);
}

.modal-footer {
  padding: var(--space-5);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary {
  padding: var(--space-3) var(--space-6);
  font-weight: 900;
  letter-spacing: 0.05em;
  box-shadow: 0 0 15px rgba(var(--accent-bright-rgb), 0.2);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animated-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>
