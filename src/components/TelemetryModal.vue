<script setup lang="ts">
import { ref } from 'vue'

// --- COMPONENTS ---
import FinanceTab from './telemetry/FinanceTab.vue'
import EngineTab from './telemetry/EngineTab.vue'
import WardenTab from './telemetry/WardenTab.vue'
import OrchestrationTab from './telemetry/OrchestrationTab.vue'
import InfrastructureTab from './telemetry/InfrastructureTab.vue'

defineProps<{ show: boolean }>()
defineEmits(['close'])

const nodeVersion = '24.11.0'
const activeTab = ref('finance')

const tabs = [
  { id: 'finance', label: 'Finance' },
  { id: 'engine', label: 'Engine' },
  { id: 'warden', label: 'Warden' },
  { id: 'orchestration', label: 'Orchestration' },
  { id: 'system', label: 'Infrastructure' }
]
</script>

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
                <FinanceTab v-if="activeTab === 'finance'" />
                <EngineTab v-else-if="activeTab === 'engine'" />
                <WardenTab v-else-if="activeTab === 'warden'" />
                <OrchestrationTab v-else-if="activeTab === 'orchestration'" />
                <InfrastructureTab v-else-if="activeTab === 'system'" />
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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);

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
