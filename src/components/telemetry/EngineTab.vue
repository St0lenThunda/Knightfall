<script setup lang="ts">
import { useAdminStore } from '../../stores/adminStore'
import { TELEMETRY_METADATA, formatNps } from '../../utils/telemetryUtils'
import GhostlyTooltip from '../GhostlyTooltip.vue'

const adminStore = useAdminStore()
</script>

<template>
  <div class="stats-grid">
    <div class="stat-group glass-xs">
      <div class="group-label">⚙️ WASM Neural Throughput</div>
      <div class="main-metric">
        <GhostlyTooltip :text="TELEMETRY_METADATA.nps">
          <span class="val">{{ formatNps(adminStore.engineNps) }}</span>
        </GhostlyTooltip>
        <span class="label">Nodes Per Second</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>TTFR (Latency)</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.ttfr">
            <span class="text-teal">{{ adminStore.ttfr || 420 }}ms</span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Depth Stability</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.depthStability">
            <span :class="adminStore.depthStability > 80 ? 'text-green' : 'text-gold'">{{ adminStore.depthStability }}%</span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Avg Search Depth</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.depth">
            <span class="text-teal">{{ adminStore.avgDepth || 14 }}</span>
          </GhostlyTooltip>
        </div>
      </div>
    </div>

    <div class="stat-group glass-xs">
      <div class="group-label">🏗️ Local Allocation</div>
      <div class="main-metric">
        <GhostlyTooltip :text="TELEMETRY_METADATA.ram">
          <span class="val">{{ adminStore.engineMemory }}</span>
        </GhostlyTooltip>
        <span class="label">MB RAM Utilized</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>WASM Threads</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.threads">
            <span class="text-gold">{{ adminStore.engineThreads }}</span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Engine Status</span>
          <span class="text-green">ACTIVE</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
