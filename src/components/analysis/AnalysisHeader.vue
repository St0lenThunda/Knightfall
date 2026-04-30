<template>
  <div class="analysis-compact-header">
    <div>
      <h2 class="title-sm">🔬 Oracle's Review</h2>
      <p class="muted">AI-powered coaching, not just engine numbers</p>
    </div>

    <div class="header-actions">
      <!-- Guest-only onboarding -->
      <button v-if="!isAuthenticated" class="btn btn-primary btn-sm" @click="$emit('loadDemo')">
        🚀 Load Demo
      </button>
      
      <!-- Authenticated: Go to Library -->
      <router-link v-else to="/profile?tab=vault" class="btn btn-primary btn-sm">
        🏛 Go to Vault
      </router-link>

      <!-- Always available: External Import -->
      <button class="btn btn-ghost btn-sm" @click="$emit('importPgn')" title="Analyze an external PGN string">
        📂 Import PGN
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AnalysisHeader Component
 * 
 * Logic: Handles the top navigation and import actions for the Analysis view.
 * Why: Separates global navigation/actions from the board logic.
 */

defineProps<{
  isAuthenticated: boolean
}>()

defineEmits<{
  (e: 'loadDemo'): void
  (e: 'importPgn'): void
}>()
</script>

<style scoped>
.analysis-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-6);
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--border);
}

.title-sm {
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  margin: 0;
}

.muted {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
</style>
