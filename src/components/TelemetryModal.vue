<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content glass-heavy telemetry-modal animated-scale-in">
          <header class="modal-header">
            <div class="title-group">
              <span class="badge badge-accent">GHOSTLY_TELEMETRY_V2</span>
              <h2>Session Intelligence</h2>
              <p class="muted">Real-time infrastructure and behavioral metrics</p>
            </div>
            <button class="btn-close" @click="$emit('close')">✕</button>
          </header>

          <div class="telemetry-tabs">
            <button v-for="t in tabs" :key="t.id" 
              class="tab-btn" :class="{ active: activeTab === t.id }"
              @click="activeTab = t.id">
              {{ t.label }}
            </button>
          </div>

          <div class="modal-body custom-scroll">
            <Transition name="fade-slide" mode="out-in">
              <div :key="activeTab" class="tab-content">
                
                <!-- FINANCE TAB -->
                <div v-if="activeTab === 'finance'" class="stats-grid">
                  <div class="stat-group glass-xs">
                    <div class="group-label">💸 Economic Footprint</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.cost">
                        <span class="val">${{ adminStore.estimatedCost.toFixed(4) }}</span>
                      </GhostlyTooltip>
                      <span class="label">Total Session Cost</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item">
                        <span>Cache Savings</span>
                        <GhostlyTooltip :text="METADATA.savings">
                          <span class="text-green">+${{ adminStore.cacheSavings.toFixed(4) }}</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item">
                        <span>Avg. Cost / Call</span>
                        <GhostlyTooltip :text="METADATA.avgCost">
                          <span class="text-muted">${{ adminStore.costPerCall.toFixed(6) }}</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item">
                        <span>Tokens Used</span>
                        <GhostlyTooltip :text="METADATA.tokens">
                          <span class="text-accent">{{ adminStore.totalTokensUsed.toLocaleString() }}</span>
                        </GhostlyTooltip>
                      </div>
                    </div>
                  </div>
                  <div class="stat-group glass-xs">
                    <div class="group-label">🧠 LLM Intelligence</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.density">
                        <span class="val">{{ adminStore.avgResponseLength || 142 }}</span>
                      </GhostlyTooltip>
                      <span class="label">Density Index (Tokens/Move)</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item"><span>Total Responses</span><span>{{ adminStore.totalResponses || adminStore.cacheMisses }}</span></div>
                      <div class="sub-item">
                        <span>Cache Hit Rate (Reuse)</span>
                        <GhostlyTooltip :text="METADATA.hitRate">
                          <span :class="hitRateClass">{{ adminStore.hitRate }}%</span>
                        </GhostlyTooltip>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ENGINE TAB -->
                <div v-if="activeTab === 'engine'" class="stats-grid">
                  <div class="stat-group glass-xs">
                    <div class="group-label">⚙️ WASM Neural Throughput</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.nps">
                        <span class="val">{{ formatNps(adminStore.engineNps) }}</span>
                      </GhostlyTooltip>
                      <span class="label">Nodes Per Second</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item">
                        <span>TTFR (Latency)</span>
                        <GhostlyTooltip :text="METADATA.ttfr">
                          <span class="text-teal">{{ adminStore.ttfr || 420 }}ms</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item">
                        <span>Depth Stability</span>
                        <GhostlyTooltip :text="METADATA.depthStability">
                          <span :class="adminStore.depthStability > 80 ? 'text-green' : 'text-gold'">{{ adminStore.depthStability }}%</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item">
                        <span>Avg Search Depth</span>
                        <GhostlyTooltip :text="METADATA.depth">
                          <span class="text-teal">{{ adminStore.avgDepth || 14 }}</span>
                        </GhostlyTooltip>
                      </div>
                    </div>
                  </div>
                  <div class="stat-group glass-xs">
                    <div class="group-label">🏗️ Local Allocation</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.ram">
                        <span class="val">{{ adminStore.engineMemory }}</span>
                      </GhostlyTooltip>
                      <span class="label">MB RAM Utilized</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item">
                        <span>WASM Threads</span>
                        <GhostlyTooltip :text="METADATA.threads">
                          <span class="text-gold">{{ adminStore.engineThreads }}</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item"><span>Engine Status</span><span class="text-green">ACTIVE</span></div>
                    </div>
                  </div>
                </div>

                <!-- WARDEN TAB -->
                <div v-if="activeTab === 'warden'" class="stats-grid">
                  <div class="stat-group glass-xs">
                    <div class="group-label">🛡️ Behavioral Audit</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.suspicion">
                        <span class="val" :class="adminStore.suspicionPeak > 50 ? 'text-rose' : 'text-green'">{{ adminStore.suspicionPeak }}%</span>
                      </GhostlyTooltip>
                      <span class="label">Suspicion Peak</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item">
                        <span>Suspicion Velocity</span>
                        <GhostlyTooltip :text="METADATA.velocity">
                          <span :class="adminStore.suspicionVelocity > 5 ? 'text-rose' : ''">{{ adminStore.suspicionVelocity }} / move</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item">
                        <span>Engine Correlation</span>
                        <GhostlyTooltip :text="METADATA.correlation">
                          <span class="text-accent">{{ adminStore.engineCorrelation }}%</span>
                        </GhostlyTooltip>
                      </div>
                      <div class="sub-item">
                        <span>Focus Deviance (Blurs)</span>
                        <GhostlyTooltip :text="METADATA.blurs">
                          <span :class="adminStore.blurEvents > 2 ? 'text-rose' : ''">{{ adminStore.blurEvents }}</span>
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
                      <div class="sub-item"><span>Anti-Tamper</span><span class="text-green">LOCKED</span></div>
                      <div class="sub-item"><span>Shadow Protocol</span><span class="text-muted">ACTIVE</span></div>
                    </div>
                  </div>
                </div>

                <!-- SYSTEM TAB -->
                <div v-if="activeTab === 'system'" class="stats-grid">
                  <div class="stat-group glass-xs">
                    <div class="group-label">🗄️ Persistence & Sync</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.vault">
                        <span class="val">{{ adminStore.vaultSizeMb }}</span>
                      </GhostlyTooltip>
                      <span class="label">Vault Size (MB)</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item"><span>Sync Queue</span><span class="text-gold">{{ adminStore.syncQueueSize }}</span></div>
                      <div class="sub-item">
                        <span>Cold Boot Latency</span>
                        <GhostlyTooltip :text="METADATA.boot">
                          <span class="text-muted">{{ adminStore.coldBootLatency || 120 }}ms</span>
                        </GhostlyTooltip>
                      </div>
                    </div>
                  </div>
                  <div class="stat-group glass-xs">
                    <div class="group-label">🧘 Interaction Flow</div>
                    <div class="main-metric">
                      <GhostlyTooltip :text="METADATA.ratio">
                        <span class="val">{{ adminStore.analysisToPlayRatio }}</span>
                      </GhostlyTooltip>
                      <span class="label">Analysis : Play Ratio</span>
                    </div>
                    <div class="sub-metrics">
                      <div class="sub-item"><span>Session Time</span><span class="text-accent">{{ formatDuration(adminStore.sessionDuration) }}</span></div>
                      <div class="sub-item"><span>Moves Analyzed</span><span>{{ adminStore.movesAnalyzed }}</span></div>
                    </div>
                  </div>
                </div>

              </div>
            </Transition>
          </div>

          <footer class="modal-footer">
            <div class="status-indicator">
              <span class="dot pulse"></span>
              <span>INFRA_STATUS: {{ activeTab.toUpperCase() }}_NOMINAL // {{ nodeVersion }}</span>
            </div>
            <button class="btn btn-primary" @click="$emit('close')">Dismiss</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdminStore } from '../stores/adminStore'
import GhostlyTooltip from './GhostlyTooltip.vue'

defineProps<{ show: boolean }>()
defineEmits(['close'])

const adminStore = useAdminStore()
const nodeVersion = '24.11.0'
const activeTab = ref('finance')

const METADATA = {
  cost: "Total financial footprint of all LLM coaching calls in this session.",
  savings: "Estimated money saved by serving analysis from local/global caches.",
  avgCost: "The average economic cost of each new insight generated by the Oracle.",
  tokens: "Combined input/output tokens processed by the AI model.",
  density: "Avg tokens per response; higher indicates more detailed coaching prose.",
  hitRate: "Percentage of requests served by infrastructure caches (Reuse Rate).",
  nps: "Raw search speed of the WASM engine (Nodes Per Second). Higher is stronger.",
  ttfr: "Time to First Recommendation; how fast the engine responds to a new position.",
  depthStability: "Engine search consistency; fluctuations may indicate CPU throttling.",
  depth: "The average number of moves ahead the engine is thinking.",
  ram: "Local browser memory currently allocated to the Stockfish WASM instance.",
  threads: "Number of hardware threads utilized for parallel search processing.",
  suspicion: "Highest behavioral anomaly score detected this session (100% = Busted).",
  velocity: "The rate at which suspicion points are accumulating per player move.",
  correlation: "Match rate between player moves and the engine's primary recommendations.",
  blurs: "Count of window focus losses, used as a behavioral signal for external help.",
  vault: "Total storage space consumed by your game library in the browser IDB.",
  boot: "Time taken to hydrate your entire game vault from local storage on startup.",
  ratio: "Interaction balance between study/analysis and active gameplay."
}

const tabs = [
  { id: 'finance', label: 'Finance' },
  { id: 'engine', label: 'Engine' },
  { id: 'warden', label: 'Warden' },
  { id: 'system', label: 'Infrastructure' }
]

const hitRateClass = computed(() => {
  if (adminStore.hitRate > 80) return 'text-green'
  if (adminStore.hitRate > 50) return 'text-gold'
  return 'text-rose'
})

const formatNps = (nps: number) => {
  if (nps > 1000000) return (nps / 1000000).toFixed(1) + 'M'
  if (nps > 1000) return (nps / 1000).toFixed(0) + 'K'
  return nps || '0'
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.telemetry-modal {
  width: 100%;
  max-width: 900px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: var(--space-8);
  padding-bottom: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-group h2 {
  margin: var(--space-2) 0;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
}

.telemetry-tabs {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--space-8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-btn {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover { color: white; background: rgba(255,255,255,0.02); }
.tab-btn.active { color: var(--accent-bright); border-bottom-color: var(--accent); }

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-8);
}

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

.modal-footer {
  padding: var(--space-6) var(--space-8);
  background: rgba(0,0,0,0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.dot { width: 8px; height: 8px; background: var(--green); border-radius: 50%; }
.pulse { animation: pulse-green 2s infinite; }

@keyframes pulse-green {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.btn-close {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-close:hover { background: var(--rose); transform: rotate(90deg); }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
