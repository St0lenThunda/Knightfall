<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
        <div class="lab-modal glass-lg animated slideInUp" style="max-width: 400px; text-align: center;">
          <header class="modal-header" style="justify-content: center; flex-direction: column; gap: var(--space-2); border: none;">
            <span class="icon" style="font-size: 3rem; margin-bottom: 10px;">💣</span>
            <h2 class="text-rose" style="margin: 0;">Nuclear Reset</h2>
          </header>
          <div class="modal-body" style="padding: var(--space-4) var(--space-8);">
            <p style="font-size: 0.95rem; line-height: 1.5;">This will permanently delete <strong class="text-rose">ALL</strong> games, tags, and analysis data in your local Vault.</p>
            <p class="muted" style="font-size: 0.75rem; margin-top: var(--space-6); background: rgba(244,63,94,0.05); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(244,63,94,0.1);">
              This action is irreversible. All local analysis and imported collections will be lost.
            </p>
            
            <div class="cloud-wipe-opt" style="margin-top: var(--space-6); display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;" @click="localWipeCloud = !localWipeCloud">
              <input type="checkbox" v-model="localWipeCloud" style="cursor: pointer;" />
              <span style="font-size: 0.8rem; font-weight: 700;" :class="{ 'text-rose': localWipeCloud }">Also wipe my Cloud History</span>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; gap: var(--space-4); padding: var(--space-8);">
            <button class="btn btn-ghost flex-1" @click="$emit('cancel')" :disabled="isWiping">
              Cancel
            </button>
            <button class="btn btn-primary bg-rose flex-1" @click="$emit('confirm', localWipeCloud)" :disabled="isWiping">
              {{ isWiping ? 'Wiping...' : 'Destroy All Data' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * NuclearWipeModal
 * 
 * High-stakes confirmation for purging all local and optionally cloud data.
 */
const props = defineProps<{
  visible: boolean;
  isWiping: boolean;
}>()

const emit = defineEmits(['cancel', 'confirm'])

const localWipeCloud = ref(false)

// Reset internal state when visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal) localWipeCloud.value = false
})
</script>

<style scoped>
.lab-modal {
  position: relative;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.modal-header { padding: var(--space-6); display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
.modal-body { overflow-y: auto; max-height: 60vh; }
.text-rose { color: var(--rose); }
.bg-rose { background: var(--rose) !important; color: white !important; }
</style>
