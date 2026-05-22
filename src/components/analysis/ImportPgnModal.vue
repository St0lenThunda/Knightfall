<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="lab-modal glass-floating fade-in">
        <div class="modal-header">
          <div>
            <h2 class="text-gradient mb-1">Import Analysis Intelligence</h2>
            <p class="muted text-sm">Paste a raw PGN to hydrate the analysis board with history and metadata.</p>
          </div>
          <button class="btn-close" @click="$emit('close')">×</button>
        </div>

        <div class="modal-body">
          <div class="form-section mb-6">
            <div class="flex justify-between items-end mb-2">
              <label class="label">PGN Data Stream</label>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-ghost" @click="loadSample">Load Sample</button>
                <button class="btn btn-sm btn-danger" @click="pgnText = ''">Clear</button>
              </div>
            </div>
            
            <div class="input-container glass-dark p-2">
              <textarea
                v-model="pgnText"
                class="pgn-textarea mono"
                placeholder='[Event "Match vs The Celestial Event"]
1. d4 d5 2. e4 dxe4...'
                spellcheck="false"
              ></textarea>
            </div>
            
            <div class="mt-4 flex items-center gap-2 p-3 rounded-lg bg-accent-dim border border-accent/20">
              <span class="text-lg">💡</span>
              <p class="text-xs muted">
                Knightfall will automatically extract player names, Elo ratings, and move history from the provided stream.
              </p>
            </div>
          </div>
        </div>

        <div class="modal-footer flex justify-end gap-3">
          <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
          <button 
            class="btn btn-primary btn-lg" 
            :disabled="!pgnText.trim()"
            @click="handleSubmit"
          >
            🚀 Initialize Analysis
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import', pgn: string): void
}>()

const pgnText = ref('')

function loadSample() {
  pgnText.value = `[Event "Match vs The Celestial Event"]
[Site "Knightfall"]
[Date "2026.05.04"]
[Round "?"]
[White "Chesswizard99"]
[Black "The Celestial Event"]
[Result "0-1"]
[WhiteElo "1200"]
[BlackElo "3200"]

1. d4 d5 2. e4 dxe4 3. Qd2 e6 4. Bb5+ Nd7 0-1`
}

function handleSubmit() {
  if (pgnText.value.trim()) {
    emit('import', pgnText.value.trim())
    pgnText.value = ''
    emit('close')
  }
}
</script>

<style scoped>
.pgn-textarea {
  width: 100%;
  height: 320px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.85rem;
  resize: none;
  outline: none;
  padding: var(--space-4);
  line-height: 1.5;
}

.input-container {
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  transition: all 0.2s var(--ease);
}

.input-container:focus-within {
  border-color: var(--accent);
  box-shadow: var(--glow-accent);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.4);
}

/* Modal Transition override for specific classes if needed */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;

}
.modal-enter-from .lab-modal, .modal-leave-to .lab-modal {
  transform: scale(0.95) translateY(10px);
}
</style>
