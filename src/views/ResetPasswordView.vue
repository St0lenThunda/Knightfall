<template>
  <div class="page reset-password-page">
    <div class="auth-container glass fade-in">
      <h2>Forge New Credentials</h2>
      <p class="muted">Your recovery link was accepted. Enter your new password below.</p>

      <form @submit.prevent="handleUpdatePassword" class="auth-form">
        <div class="form-group">
          <label class="label">New Password</label>
          <div class="password-input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              class="input" 
              v-model="password" 
              placeholder="••••••••" 
              required 
              minlength="8"
              autocomplete="new-password"
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

        <div class="form-group">
          <label class="label">Confirm New Password</label>
          <div class="password-input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              class="input" 
              v-model="confirmPassword" 
              placeholder="••••••••" 
              required 
              autocomplete="new-password"
            />
          </div>
        </div>

        <button 
          type="submit" 
          class="btn btn-primary" 
          style="width: 100%; justify-content: center; margin-top: var(--space-4);" 
          :disabled="isLoading"
        >
          {{ isLoading ? 'Forging...' : 'Update Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../api/supabaseClient'
import { useUiStore } from '../stores/uiStore'

const router = useRouter()
const uiStore = useUiStore()

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

/**
 * Updates the user's password using the active session 
 * (automatically managed by Supabase via the email link).
 */
async function handleUpdatePassword() {
  if (password.value !== confirmPassword.value) {
    uiStore.addToast('Passwords do not match.', 'error')
    return
  }

  isLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (error) throw error

    uiStore.addToast('Password updated successfully! Redirecting to login...', 'success')
    
    // Redirect to home (where the login modal can be triggered)
    setTimeout(() => {
      router.push('/')
    }, 2000)
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
      uiStore.addToast(err.message || 'Failed to update password.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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
</style>
