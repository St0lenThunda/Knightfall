<script setup lang="ts">
import { useAdminStore } from '../../stores/adminStore'
import { useLibraryStore } from '../../stores/libraryStore'
import { TELEMETRY_METADATA, formatTime } from '../../utils/telemetryUtils'
import GhostlyTooltip from '../GhostlyTooltip.vue'

const adminStore = useAdminStore()
const libraryStore = useLibraryStore()
</script>

<template>
  <div class="stats-grid">
    <div class="stat-group glass-xs">
      <div class="group-label">🛡️ Behavioral Audit</div>
      <div class="main-metric">
        <GhostlyTooltip :text="TELEMETRY_METADATA.suspicion">
          <span class="val" :class="adminStore.suspicionPeak > 50 ? 'text-rose' : 'text-green'">
            {{ adminStore.suspicionPeak }}%
          </span>
        </GhostlyTooltip>
        <span class="label">Suspicion Peak</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>Suspicion Velocity</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.velocity">
            <span :class="adminStore.suspicionVelocity > 5 ? 'text-rose' : ''">
              {{ adminStore.suspicionVelocity }} / move
            </span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Engine Correlation</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.correlation">
            <span class="text-accent">{{ adminStore.engineCorrelation }}%</span>
          </GhostlyTooltip>
        </div>
        <div class="sub-item">
          <span>Focus Deviance (Blurs)</span>
          <GhostlyTooltip :text="TELEMETRY_METADATA.blurs">
            <span :class="adminStore.blurEvents > 2 ? 'text-rose' : ''">
              {{ adminStore.blurEvents }}
            </span>
          </GhostlyTooltip>
        </div>
      </div>
    </div>

    <div class="stat-group glass-xs">
      <div class="group-label">📜 Telemetry Integrity</div>
      <div class="main-metric">
        <span class="val">NOMINAL</span>
        <span class="label">Security State</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>Anti-Tamper</span>
          <span class="text-green">LOCKED</span>
        </div>
        <div class="sub-item">
          <span>Shadow Protocol</span>
          <span class="text-muted">ACTIVE</span>
        </div>
      </div>
    </div>

    <!-- WARDEN ARCHITECTURAL INTEL -->
    <div class="stat-group glass-xs span-2">
      <div class="group-label">🧠 Architectural Intelligence (Fabric)</div>
      <div v-if="libraryStore.wardenReport" class="briefing-deck">
        <div class="intel-header">
          <div class="status-pill" :class="libraryStore.wardenReport.status.toLowerCase()">
            {{ libraryStore.wardenReport.status }}
          </div>
          <span class="version-tag">W_v{{ libraryStore.wardenReport.version }}</span>
          <span class="ts-tag">{{ formatTime(libraryStore.wardenReport.timestamp) }}</span>
        </div>
        
        <div class="briefing-box custom-scroll">
          <pre>{{ libraryStore.wardenReport.briefing || 'SYNTHESIZING_ARCHITECTURAL_SNAPSHOT...' }}</pre>
        </div>

        <div class="briefing-footer">
          <div class="metric-chip">
            <span class="label">INTEGRITY:</span>
            <span class="val" :class="libraryStore.wardenReport.metrics.integrity_score > 90 ? 'text-green' : 'text-gold'">
              {{ libraryStore.wardenReport.metrics.integrity_score }}%
            </span>
          </div>
          <div class="metric-chip">
            <span class="label">FILES:</span>
            <span class="val text-accent">{{ libraryStore.wardenReport.metrics.files_scanned }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-intel">
        <div class="loading-bar">
          <div class="fill"></div>
        </div>
        <p class="muted">AWAITING_FABRIC_SYNTHESIS...</p>
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

.stat-group.span-2 {
  grid-column: span 2;
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

/* Briefing Styles */
.briefing-deck {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.intel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.65rem;
  font-family: var(--font-mono);
}

.status-pill {
  background: rgba(255,255,255,0.05);
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.status-pill.validated { background: rgba(16, 185, 129, 0.1); color: var(--green); border: 1px solid rgba(16, 185, 129, 0.2); }

.version-tag { color: var(--accent-bright); }
.ts-tag { opacity: 0.4; }

.briefing-box {
  background: rgba(0,0,0,0.3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.02);
  max-height: 250px;
  overflow-y: auto;
}

.briefing-box pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.8);
}

.briefing-footer {
  display: flex;
  gap: 20px;
}

.metric-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-family: var(--font-mono);
}
.metric-chip .label { opacity: 0.5; font-weight: 800; }
.metric-chip .val { font-weight: 800; }

.empty-intel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: var(--space-10) 0;
}

.loading-bar {
  width: 100px; height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden;
}
.loading-bar .fill {
  width: 30%; height: 100%; background: var(--accent);
  animation: loading-slide 1.5s infinite ease-in-out;
}

@keyframes loading-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(300%); }
}
</style>
