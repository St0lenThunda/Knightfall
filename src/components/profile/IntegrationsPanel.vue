<script setup lang="ts">
/**
 * IntegrationsPanel: The "Intelligence Cockpit" for managing external connections.
 * 
 * Allows users to safely store Lichess and Chess.com tokens in localStorage.
 * These tokens unlock the "Masters" database for deep Theory DNA analysis.
 */
import { ref, onMounted } from 'vue'
import { Storage, StorageKey } from '../../utils/storage'
import { useUiStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'

const uiStore = useUiStore()
const userStore = useUserStore()

const lichessToken = ref('')
const chesscomToken = ref('')
const lichessHandle = ref('')
const chesscomHandle = ref('')

const isSaving = ref(false)

onMounted(() => {
  // Hydrate from storage
  lichessToken.value = Storage.get(StorageKey.LICHESS_TOKEN, '')
  chesscomToken.value = Storage.get(StorageKey.CHESSCOM_TOKEN, '')
  
  // Hydrate handles from profile
  lichessHandle.value = userStore.profile?.lichess_handle || ''
  chesscomHandle.value = userStore.profile?.chesscom_handle || ''
})

async function handleSave() {
  isSaving.value = true
  
  try {
    // 1. Save tokens locally
    Storage.set(StorageKey.LICHESS_TOKEN, lichessToken.value)
    Storage.set(StorageKey.CHESSCOM_TOKEN, chesscomToken.value)
    
    // 2. Save handles to Supabase profile
    await userStore.updateProfile({
      lichess_handle: lichessHandle.value,
      chesscom_handle: chesscomHandle.value
    })
    
    // 3. Trigger immediate sync to show the user the "new data"
    await userStore.syncGlobalIntelligence()
    
    uiStore.addToast('Intelligence bridges synchronized and profile updated.', 'success')
  } catch (err) {
    uiStore.addToast('Failed to synchronize all bridges.', 'error')
  } finally {
    isSaving.value = false
  }
}

function clearTokens() {
  lichessToken.value = ''
  chesscomToken.value = ''
  lichessHandle.value = ''
  chesscomHandle.value = ''
  Storage.remove(StorageKey.LICHESS_TOKEN)
  Storage.remove(StorageKey.CHESSCOM_TOKEN)
}
</script>

<template>
  <div class="integrations-panel glass-sm">
    <div class="panel-header">
      <div class="icon-orb">🌍</div>
      <div class="header-text">
        <h2>Intelligence Bridges</h2>
        <p class="text-muted">Link external platforms to unlock Theory DNA and high-fidelity analysis.</p>
      </div>
    </div>

    <div class="integrations-grid">
      <!-- LICHESS BRIDGE -->
      <div class="integration-card glass" :class="{ 'is-active': lichessToken }">
        <div class="card-brand">
          <span class="brand-icon">♞</span>
          <div class="brand-info">
            <h3>Lichess.org</h3>
            <span class="status-tag" :class="lichessToken ? 'online' : 'offline'">
              {{ lichessToken ? 'AUTHENTICATED' : 'ANONYMOUS' }}
            </span>
          </div>
        </div>
        
        <div class="card-body">
          <p class="feature-tip">Required for <strong>Masters Database</strong> opening theory and move-by-move cloud evaluations.</p>
          
          <div class="input-group-v2">
            <label>Lichess Username</label>
            <input 
              type="text" 
              v-model="lichessHandle" 
              placeholder="Your username"
              class="kf-input mb-4"
            />
            <label>Personal Access Token (PAT)</label>
            <input 
              type="password" 
              v-model="lichessToken" 
              placeholder="lip_xxxxxxxxxxxxxx"
              class="kf-input"
            />
            <a href="https://lichess.org/account/oauth/token" target="_blank" class="help-link">Generate Token ↗</a>
          </div>
        </div>
      </div>

      <!-- CHESS.COM BRIDGE -->
      <div class="integration-card glass" :class="{ 'is-active': chesscomToken || chesscomHandle }">
        <div class="card-brand">
          <span class="brand-icon">♟</span>
          <div class="brand-info">
            <h3>Chess.com</h3>
            <span class="status-tag" :class="chesscomHandle ? 'online' : 'offline'">
              {{ chesscomHandle ? 'AUTHENTICATED' : 'ANONYMOUS' }}
            </span>
          </div>
        </div>
        
        <div class="card-body">
          <p class="feature-tip">Enables high-speed bulk import and verified accuracy metrics from your global profile.</p>
          
          <div class="input-group-v2">
            <label>Chess.com Username</label>
            <input 
              type="text" 
              v-model="chesscomHandle" 
              placeholder="Your username"
              class="kf-input mb-4"
            />
            <label>API Key / Token (Optional)</label>
            <input 
              type="password" 
              v-model="chesscomToken" 
              placeholder="Private key (if applicable)"
              class="kf-input"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <div class="security-disclaimer">
        <span class="icon">🛡️</span>
        <p>Tokens are stored **locally** in your browser's vault. They are never sent to Knightfall servers.</p>
      </div>
      
      <div class="action-group">
        <button class="btn btn-ghost" @click="clearTokens">Clear All</button>
        <button class="btn btn-primary" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? 'Establishing Bridge...' : 'Save Integrations' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.integrations-panel {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.icon-orb {
  width: 50px;
  height: 50px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.header-text h2 { margin: 0; font-size: 1.5rem; }
.header-text p { margin: 4px 0 0; font-size: 0.9rem; }

.integrations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: var(--space-6);
}

.integration-card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.3s ease;
}

.integration-card.is-active {
  border-color: var(--accent-dim);
  background: rgba(139, 92, 246, 0.03);
}

.card-brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.brand-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.brand-info h3 { margin: 0; font-size: 1.1rem; }

.status-tag {
  font-size: 0.6rem;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.status-tag.online { background: rgba(45, 212, 191, 0.1); color: var(--teal); }
.status-tag.offline { background: rgba(255,255,255,0.05); color: var(--text-muted); }

.card-body .feature-tip {
  font-size: 0.8rem;
  line-height: 1.4;
  margin-bottom: var(--space-6);
  opacity: 0.7;
}

.input-group-v2 {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group-v2 label {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
}

.kf-input {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: white;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  width: 100%;
}
.mb-4 { margin-bottom: var(--space-4); }

.help-link {
  font-size: 0.7rem;
  color: var(--accent-bright);
  text-decoration: none;
  font-weight: 700;
  margin-top: 4px;
}

.panel-footer {
  margin-top: auto;
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.security-disclaimer {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
}

.security-disclaimer .icon { font-size: 1.2rem; }
.security-disclaimer p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

.action-group {
  display: flex;
  gap: var(--space-4);
}
</style>
