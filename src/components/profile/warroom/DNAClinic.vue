<script setup lang="ts">
/**
 * DNAClinic: Renders the "Clinic" section of the DNA dashboard.
 * Displays immediate coaching prescriptions.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '../../../stores/coachStore'

const router = useRouter()
const coachStore = useCoachStore()
const miniRx = computed(() => coachStore.dnaPrescriptions.slice(0, 3))
</script>

<template>
  <div v-if="miniRx.length > 0" class="glass card-v3 mb-6">
    <div class="card-header">
      <h4>📋 The Clinic</h4>
    </div>
    <div class="mini-prescriptions mt-4">
      <div v-for="rx in miniRx" :key="rx.id" class="mini-rx-item" :class="rx.severity">
        <span class="rx-icon">{{ rx.icon }}</span>
        <div class="rx-info">
          <div class="rx-title">{{ rx.title }}</div>
          <button @click="router.push(rx.link)" class="btn btn-xs btn-primary mt-2">{{ rx.linkText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.mini-rx-item {
  display: flex; gap: var(--space-4); padding: var(--space-4); border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03); margin-bottom: var(--space-3); border-left: 4px solid var(--accent);
}
.mini-rx-item.critical { border-left-color: var(--rose); }
.mini-rx-item.warning { border-left-color: var(--gold); }
.rx-title { font-weight: 700; font-size: 0.9rem; }
</style>
