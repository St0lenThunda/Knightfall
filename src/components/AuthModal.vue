<template>
  <div class="modal-backdrop backdrop-overlay" @click.self="$emit('close')">
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
          <input type="text" class="input" v-model="username" placeholder="ChessWizard99" required data-testid="username-input" autocomplete="username" />
        </div>

        <div class="form-group">
          <label class="label">{{ mode === 'login' ? 'Username or Email' : 'Email' }}</label>
          <input 
            :type="mode === 'login' ? 'text' : 'email'" 
            class="input" 
            v-model="email" 
            :placeholder="mode === 'login' ? 'player@knightfall.com or ChessWizard' : 'player@knightfall.com'" 
            required 
            data-testid="email-input" 
            autocomplete="email" 
          />
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
          <div class="password-input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              class="input" 
              v-model="password" 
              placeholder="••••••••" 
              required 
              data-testid="password-input"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" 
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              tabindex="-1"
              title="Toggle password visibility"
            >
              <!-- Inline SVG EyeOff (Visible) -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                <line x1="2" y1="2" x2="22" y2="22"></line>
              </svg>
              <!-- Inline SVG Eye (Hidden) -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
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
const showPassword = ref(false)

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
    // If the browser fails to reach the Supabase host (e.g., DNS resolution fails because the project is paused)
    // it throws a generic TypeError with the message "Failed to fetch". We intercept this to provide a clearer,
    // more actionable message.
    if (err instanceof Error && err.message === 'Failed to fetch') {
      uiStore.addToast(
        'Unable to reach the server. Your Supabase project may be paused due to inactivity. ' +
        'Please restore the project in the Supabase Dashboard or check your connection.',
        'error'
      )
    } else {
      uiStore.addToast(err.message || 'Failed to send recovery email.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  isLoading.value = true

  try {
    if (mode.value === 'login') {
      let targetEmail = email.value.trim()
      
      // If the input doesn't look like an email (no @), attempt to resolve as username
      if (!targetEmail.includes('@')) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', targetEmail)
          .single()
        
        if (profileError) {
          if (profileError.message === 'Failed to fetch') {
            throw new Error('Failed to fetch')
          }
          throw new Error('Identity not found. Please verify your username, ensure you have an account, or log in using your email address.')
        }
        if (!data?.email) {
          throw new Error('Identity not found. Please verify your username, ensure you have an account, or log in using your email address.')
        }
        targetEmail = data.email
      }

      const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password: password.value })
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
    // If the browser fails to reach the Supabase host (e.g., DNS resolution fails because the project is paused)
    // it throws a generic TypeError with the message "Failed to fetch". We intercept this to provide a clearer,
    // more actionable message to the developer or user.
    if (err instanceof Error && err.message === 'Failed to fetch') {
      uiStore.addToast(
        'Unable to reach the server. Your Supabase project may be paused due to inactivity. ' +
        'Please restore the project in the Supabase Dashboard or check your connection.',
        'error'
      )
    } else {
      uiStore.addToast(err.message || 'An error occurred.', 'error')
    }
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

  display: flex;
  align-items: center; justify-content: center;
  z-index: 3000;
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

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .input {
  width: 100%;
  padding-right: var(--space-10);
}

.password-toggle {
  position: absolute;
  right: var(--space-3);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
}

.password-toggle:hover {
  color: var(--accent-bright);
  background: rgba(255, 255, 255, 0.05);
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
