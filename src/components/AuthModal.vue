<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card glass fade-in">
      <button class="close-btn btn btn-icon" @click="$emit('close')">✕</button>
      
      <h2>{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h2>
      <p class="muted" style="margin-bottom: var(--space-4); font-size: 0.9rem;">
        {{ isLogin ? 'Log in to continue your chess journey.' : 'Join Knightfall and track your progress.' }}
      </p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group" v-if="!isLogin">
          <label class="label">Username</label>
          <input type="text" class="input" v-model="username" placeholder="ChessWizard99" required />
        </div>

        <div class="form-group">
          <label class="label">Email</label>
          <input type="email" class="input" v-model="email" placeholder="player@knightfall.com" required />
        </div>

        <div class="form-group">
          <label class="label">Password</label>
          <input type="password" class="input" v-model="password" placeholder="••••••••" required />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: var(--space-4);" :disabled="isLoading">
          {{ isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up') }}
        </button>
      </form>

      <div class="toggle-mode">
        <span class="muted">{{ isLogin ? "Don't have an account?" : "Already have an account?" }}</span>
        <button class="btn btn-ghost btn-sm" @click="toggleMode" style="margin-left: var(--space-2);">
          {{ isLogin ? 'Sign Up' : 'Log In' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../api/supabaseClient'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

const userStore = useUserStore()
const uiStore = useUiStore()

const props = defineProps<{ initialMode?: 'login' | 'signup' }>()
const emit = defineEmits(['close', 'success'])

const isLogin = ref(props.initialMode !== 'signup')

const email = ref('')
const password = ref('')
const username = ref('')

const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function toggleMode() {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
  successMsg.value = ''
}

async function handleSubmit() {
  isLoading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isLogin.value) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      uiStore.addToast('Login successful!', 'success')
      emit('success')
      setTimeout(() => emit('close'), 500)
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.value, password: password.value })
      if (error) throw error
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: username.value,
          rating: 1200
        })
        if (profileError) throw profileError
      }
      
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
