<template>
  <div class="page reset-password-page">
    <div class="auth-container glass fade-in">
      <h2>Forge New Credentials</h2>
      <p class="muted">Your recovery link was accepted. Enter your new password below.</p>

      <form @submit.prevent="handleUpdatePassword" class="auth-form">
        <div class="form-group">
          <label class="label">New Password</label>
          <input 
            type="password" 
            class="input" 
            v-model="password" 
            placeholder="••••••••" 
            required 
            minlength="8"
          />
        </div>

        <div class="form-group">
          <label class="label">Confirm New Password</label>
          <input 
            type="password" 
            class="input" 
            v-model="confirmPassword" 
            placeholder="••••••••" 
            required 
          />
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
    uiStore.addToast(err.message || 'Failed to update password.', 'error')
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
</style>
