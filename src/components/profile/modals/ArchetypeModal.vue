<template>
  <Transition name="modal-fade">
    <!-- Click outside modal to close, unless clicking the card content -->
    <div v-if="uiStore.isArchetypeModalOpen" class="modal-overlay" @click.self="uiStore.isArchetypeModalOpen = false">
      <div class="archetype-modal glass-lg">
        <button class="close-btn" @click="uiStore.isArchetypeModalOpen = false">×</button>
        
        <div class="modal-header">
          <div class="dna-pulse"></div>
          <h2>Intelligence Profile</h2>
          <p class="text-accent small bold uppercase tracking-widest">Archetype Classification</p>
        </div>

        <div class="modal-body">
          <!-- ── Active Status Section ── -->
          <div class="current-status-section">
            <div class="status-container">
              <!-- Core Persona (e.g., The Vanguard) -->
              <div class="status-box glass">
                <span class="label">CORE PERSONA</span>
                <span class="val">{{ activeArchetype?.persona || 'The Squire' }}</span>
              </div>
              
              <!-- Current DNA Form (e.g., Storm Form) -->
              <div 
                class="status-box glass highlight-form" 
                v-if="activeArchetype" 
                :class="'theme-' + activeArchetype.id"
              >
                <span class="label">CURRENT FORM</span>
                <span class="val">{{ activeArchetype.icon }} {{ activeArchetype.name }}</span>
              </div>
            </div>
            
            <!-- Description of the active form's gameplay characteristics -->
            <p v-if="activeArchetype" class="mt-4 text-accent small italic text-center">
              "{{ activeArchetype.description }}"
            </p>
            <p v-else class="mt-4 text-muted small text-center">
              The Knightfall intelligence engine is currently scanning your <strong>Gameplay DNA</strong>. 
              We look for signals in your wins, losses, and tactical blunders to determine your "Chess Persona."
            </p>
          </div>

          <!-- ── Glossary of Core Personas ── -->
          <div class="archetype-grid mt-8">
            <div 
              v-for="persona in corePersonas" 
              :key="persona.name" 
              class="archetype-item glass"
              :class="{ 'active-persona': isActivePersona(persona.name) }"
            >
              <div class="arch-icon">{{ persona.icon }}</div>
              <div class="arch-info">
                <div class="title-row">
                  <h4>{{ persona.name }}</h4>
                  <!-- Highlight pill if this persona matches the user's active archetype -->
                  <span v-if="isActivePersona(persona.name)" class="active-badge">Active</span>
                </div>
                <p class="mt-1">{{ persona.description }}</p>
                
                <!-- Display the active/manifested forms under this persona -->
                <div class="arch-forms mt-3">
                  <span class="forms-label">MANIFESTS AS:</span>
                  <div class="forms-list">
                    <span 
                      v-for="form in persona.forms" 
                      :key="form.name" 
                      class="form-badge"
                      :class="{ 'active-form-badge': activeArchetype?.id === form.id }"
                    >
                      {{ form.icon }} {{ form.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Onboarding / Scanning Checklist ── -->
          <div class="requirements-box mt-8">
            <h5>How to identify your archetype:</h5>
            <ul class="requirements-list">
              <li><span class="bullet">✓</span> <strong>Sync Games:</strong> Ensure your recent games are in the Vault.</li>
              <li><span class="bullet">✓</span> <strong>Cloud Intel:</strong> Run analysis passes to generate "Neural Signals."</li>
              <li><span class="bullet">✓</span> <strong>DNA Reveal:</strong> Visit the DNA Panel to finalize your classification.</li>
            </ul>
          </div>
        </div>

        <div class="modal-footer mt-8">
          <button class="btn btn-accent full-width" @click="uiStore.isArchetypeModalOpen = false">Understood</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * ArchetypeModal.vue
 * 
 * Displays the player's core chess identity and current dynamic combat form.
 * Uses a dynamic glossary of 4 battlefield roles (Vanguard, Ironclad, Grand Strategist, Squire)
 * mapping to the 5 diagnostic DNA states.
 */
import { computed } from 'vue'
import { useUiStore } from '../../../stores/uiStore'
import { useUserStore } from '../../../stores/userStore'
import { archetypes } from '../../../composables/useArchetypeStats'

// Initialize state stores
const uiStore = useUiStore()
const userStore = useUserStore()

/**
 * Computed property to find the active archetype definition object.
 * Maps the user profile's archetype key to our static list.
 */
const activeArchetype = computed(() => {
  const archId = userStore.profile?.archetype?.toLowerCase()
  return archetypes.find(a => a.id === archId) || null
})

/**
 * Glossary of Core Battlefield Personas and the active DNA forms they manifest.
 */
const corePersonas = [
  {
    name: 'The Vanguard',
    icon: '⚔️',
    description: 'High tactical vision. You thrive in chaotic positions but may struggle with long-term strategic coordination.',
    forms: [
      { name: 'Storm Form', icon: '⚡', id: 'storm' },
      { name: 'Rogue Form', icon: '🗡️', id: 'rogue' }
    ]
  },
  {
    name: 'The Ironclad',
    icon: '🛡️',
    description: 'Exceptional endgame technique. You are a monster in simplified positions but might fall behind in the opening.',
    forms: [
      { name: 'Sentinel Form', icon: '⚙️', id: 'technician' }
    ]
  },
  {
    name: 'The Grand Strategist',
    icon: '🗺️',
    description: 'Deep opening preparation. You have an answer for every line but may lose momentum in the middlegame.',
    forms: [
      { name: 'Oracle Form', icon: '👁️', id: 'oracle' }
    ]
  },
  {
    name: 'The Squire',
    icon: '👤',
    description: 'The starting identity. A balanced initiate with a clean slate, waiting for enough signals to definitively classify.',
    forms: [
      { name: 'Initiate Form', icon: '🌱', id: 'student' }
    ]
  }
]

/**
 * Checks if a specific persona is currently active for the logged-in user.
 * 
 * @param personaName - The name of the persona to evaluate
 * @returns boolean - True if active
 */
const isActivePersona = (personaName: string): boolean => {
  return activeArchetype.value?.persona === personaName
}
</script>

<style scoped>

.archetype-modal {
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-10);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: var(--space-6);
  right: var(--space-6);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.modal-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.dna-pulse {
  width: 4px;
  height: 40px;
  background: var(--accent-gradient);
  margin: 0 auto var(--space-4);
  border-radius: 2px;
  box-shadow: 0 0 15px var(--accent-bright);
  animation: pulse 2s infinite ease-in-out;
}

.status-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  width: 100%;
}

.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-box .label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.status-box .val {
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  margin-top: 4px;
  text-align: center;
}

.highlight-form {
  transition: all 0.3s ease;
}

/* Glowing Form-specific Themes */
.highlight-form.theme-storm {
  border-color: #a78bfa;
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.2);
}
.highlight-form.theme-storm .val {
  color: #a78bfa;
  text-shadow: 0 0 10px rgba(167, 139, 250, 0.4);
}

.highlight-form.theme-oracle {
  border-color: #6366f1;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
}
.highlight-form.theme-oracle .val {
  color: #6366f1;
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
}

.highlight-form.theme-technician {
  border-color: #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
}
.highlight-form.theme-technician .val {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.highlight-form.theme-rogue {
  border-color: #f43f5e;
  box-shadow: 0 0 15px rgba(244, 63, 94, 0.2);
}
.highlight-form.theme-rogue .val {
  color: #f43f5e;
  text-shadow: 0 0 10px rgba(244, 63, 94, 0.4);
}

.highlight-form.theme-student {
  border-color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
}
.highlight-form.theme-student .val {
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.archetype-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.archetype-item {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-6);
  align-items: flex-start;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.archetype-item:hover {
  transform: translateX(5px);
  border-color: rgba(255, 255, 255, 0.15);
}

.archetype-item.active-persona {
  border-color: rgba(167, 139, 250, 0.35);
  background: rgba(167, 139, 250, 0.03);
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.08);
}

.arch-icon {
  font-size: 1.8rem;
  background: rgba(255, 255, 255, 0.03);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.arch-info {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.arch-info h4 {
  color: var(--text-primary);
  font-weight: 750;
  margin: 0;
}

.active-badge {
  font-size: 0.58rem;
  font-weight: 900;
  color: white;
  background: var(--accent-gradient);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-left: auto;
  box-shadow: 0 0 10px var(--accent-bright);
}

.arch-info p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.arch-forms {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.forms-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.forms-list {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.form-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
}

.form-badge.active-form-badge {
  background: rgba(167, 139, 250, 0.1);
  border-color: var(--accent-bright);
  color: var(--accent-bright);
  font-weight: bold;
}

.requirements-box {
  padding: var(--space-6);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-lg);
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.requirements-list li {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bullet {
  color: var(--accent-bright);
  font-weight: bold;
}

@keyframes pulse {
  0%, 100% { transform: scaleY(1); opacity: 0.8; }
  50% { transform: scaleY(1.5); opacity: 1; }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.btn-accent {
  background: var(--accent-gradient);
  color: white;
  padding: var(--space-4);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.full-width {
  width: 100%;
}
</style>
