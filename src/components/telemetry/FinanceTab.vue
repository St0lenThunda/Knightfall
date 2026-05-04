<script setup lang="ts">
import { computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { TELEMETRY_METADATA } from '../../utils/telemetryUtils'
import GhostlyTooltip from '../GhostlyTooltip.vue'

const adminStore = useAdminStore()

const hitRateClass = computed(() => {
  if (adminStore.hitRate > 80) return 'text-green'
  if (adminStore.hitRate > 50) return 'text-gold'
  return 'text-rose'
})
</script>

<template>
  <div class="stats-grid">
    <div class="stat-group glass-xs">
      <div class="group-label">💸 Economic Footprint</div>
      <div class="main-metric">
        <GhostlyTooltip :text="TELEMETRY_METADATA.cost">
          <span class="val">${{ adminStore.estimatedCost.toFixed(4) }}</span>
        </GhostlyTooltip>
        <span class="label">Total Session Cost</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>Cache Savings</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.savings">
            <span class="text-green">+${{ adminStore.cacheSavings.toFixed(4) }}</span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Avg. Cost / Call</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.avgCost">
            <span class="text-muted">${{ adminStore.costPerCall.toFixed(6) }}</span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Tokens Used</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.tokens">
            <span class="text-accent">{{ adminStore.totalTokensUsed.toLocaleString() }}</span>
          </GhostlyTooltip>
        </div>
      </div>
    </div>
    
    <div class="stat-group glass-xs">
      <div class="group-label">🧠 LLM Intelligence</div>
      <div class="main-metric">
        <GhostlyTooltip :text="TELEMETRY_METADATA.density">
          <span class="val">{{ adminStore.avgResponseLength || 142 }}</span>
        </GhostlyTooltip>
        <span class="label">Density Index (Tokens/Move)</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>Total Responses</span>
          <span>{{ adminStore.totalResponses || adminStore.cacheMisses }}</span>
        </div>
        <div class="sub-item">
          <span>Cache Hit Rate (Reuse)</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.hitRate">
            <span :class="hitRateClass">{{ adminStore.hitRate }}%</span>
          </GhostlyTooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Local styles inherited from the parent to ensure visual consistency */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: var(--space-6);
}

.stat-group {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.01);
}

.group-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: var(--space-4);
}

.main-metric {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-6);
}

.main-metric .val {
  font-size: 2.2rem;
  font-weight: 800;
  font-family: var(--font-mono);
  line-height: 1;
  color: white;
}

.main-metric .label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
  font-weight: 600;
}

.sub-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: var(--space-4);
}

.sub-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
