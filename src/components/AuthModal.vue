<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card glass fade-in">
      <button class="close-btn btn btn-icon" @click="$emit('close')">✕</button>
      
      <h2>{{ currentTitle }}</h2>
      <p class="muted" style="margin-bottom: var(--space-4); font-size: 0.9rem;">
        {{ currentSubtitle }}
      </p>

      <!-- Forgot Password Mode -->
      <form v-if="mode === 'forgot-password'" @submit.prevent="handleResetRequest" class="auth-form">
        <div class="form-group">
          <label class="label">Recovery Email</label>
          <input type="email" class="input" v-model="email" placeholder="player@knightfall.com" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: var(--space-4);" :disabled="isLoading">
          {{ isLoading ? 'Transmitting...' : 'Send Recovery Link' }}
        </button>
      </form>

      <!-- Login / Signup Mode -->
      <form v-else @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group" v-if="mode === 'signup'">
          <label class="label">Username</label>
          <input type="text" class="input" v-model="username" placeholder="ChessWizard99" required data-testid="username-input" />
        </div>

        <div class="form-group">
          <label class="label">Email</label>
          <input type="email" class="input" v-model="email" placeholder="player@knightfall.com" required data-testid="email-input" />
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="label">Password</label>
            <button 
              v-if="mode === 'login'" 
              type="button" 
              class="btn btn-ghost btn-sm text-xs" 
              @click="mode = 'forgot-password'"
              style="padding: 0; height: auto;"
            >
              Forgot?
            </button>
          </div>
          <input 
            type="password" 
            class="input" 
            v-model="password" 
            placeholder="••••••••" 
            required 
            data-testid="password-input"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" 
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: var(--space-4);" :disabled="isLoading" data-testid="auth-submit-btn">
          {{ isLoading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Sign Up') }}
        </button>
      </form>

      <div class="toggle-mode">
        <template v-if="mode === 'forgot-password'">
          <button class="btn btn-ghost btn-sm" @click="mode = 'login'">
            ← Back to Login
          </button>
        </template>
        <template v-else>
          <span class="muted">{{ mode === 'login' ? "Don't have an account?" : "Already have an account?" }}</span>
          <button class="btn btn-ghost btn-sm" @click="toggleMode" style="margin-left: var(--space-2);">
            {{ mode === 'login' ? 'Sign Up' : 'Log In' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

const userStore = useUserStore()
const uiStore = useUiStore()

const props = defineProps<{ initialMode?: 'login' | 'signup' }>()
const emit = defineEmits(['close', 'success'])

const mode = ref<'login' | 'signup' | 'forgot-password'>(props.initialMode || 'login')

const email = ref('')
const password = ref('')
const username = ref('')

const isLoading = ref(false)

const currentTitle = computed(() => {
  if (mode.value === 'login') return 'Welcome Back'
  if (mode.value === 'signup') return 'Create Account'
  return 'Reset Password'
})

const currentSubtitle = computed(() => {
  if (mode.value === 'login') return 'Log in to continue your chess journey.'
  if (mode.value === 'signup') return 'Join Knightfall and track your progress.'
  return 'Enter your email to receive a recovery link.'
})

function toggleMode() {
  mode.value = mode.value === 'login' ? 'signup' : 'login'
}

async function handleResetRequest() {
  isLoading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    uiStore.addToast('Recovery email sent! Check your inbox.', 'success')
    mode.value = 'login'
  } catch (err: any) {
    uiStore.addToast(err.message || 'Failed to send recovery email.', 'error')
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  isLoading.value = true

  try {
    if (mode.value === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      uiStore.addToast('Login successful!', 'success')
      emit('success')
      setTimeout(() => emit('close'), 500)
    } else {
      const { error } = await supabase.auth.signUp({ 
        email: email.value, 
        password: password.value,
        options: {
          data: {
            username: username.value
          }
        }
      })
      if (error) throw error
      
      // We no longer manually insert to 'profiles' here. 
      // The Database Trigger (handle_new_user) takes over to avoid 401/RLS issues.
      
      await userStore.fetchUserData()
      
      uiStore.addToast('Account created successfully!', 'success')
      emit('success')
      setTimeout(() => emit('close'), 500)
    }
  } catch (err: any) {
    uiStore.addToast(err.message || 'An error occurred.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center; justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 90%;
  max-width: 400px;
  padding: var(--space-6);
  position: relative;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: var(--space-4); right: var(--space-4);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.error-msg {
  color: var(--rose);
  font-size: 0.85rem;
  background: var(--rose-dim);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(244, 63, 94, 0.2);
}

.success-msg {
  color: var(--green);
  font-size: 0.85rem;
  background: var(--green-dim);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.toggle-mode {
  text-align: center;
  border-top: 1px solid var(--border);
  padding-top: var(--space-4);
  font-size: 0.9rem;
}
</style>
