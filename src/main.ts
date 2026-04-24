import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import { supabase } from './api/supabaseClient'

/**
 * Route Configuration
 *
 * HomeView is loaded eagerly because it's the landing page and must render
 * instantly. All other routes use dynamic `import()` so Vite can code-split
 * them into separate chunks. This cuts the initial JS bundle significantly
 * (from ~723KB monolith to per-route chunks), improving first-paint time.
 *
 * Why? The Vite build previously warned about a 723KB chunk. Lazy-loading
 * ensures users only download the code they actually navigate to.
 */
import HomeView from './views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',         component: HomeView },
    { path: '/path',     component: () => import('./views/PathView.vue'),    meta: { requiresAuth: true } },
    { path: '/lesson/:id', component: () => import('./views/LessonView.vue'), meta: { requiresAuth: true } },
    { path: '/play',     component: () => import('./views/PlayView.vue') },
    { path: '/analysis', component: () => import('./views/AnalysisView.vue'), meta: { requiresAuth: true } },
    { path: '/puzzles',  component: () => import('./views/PuzzlesView.vue') },
    { path: '/gauntlet', component: () => import('./views/GauntletView.vue'), meta: { requiresAuth: true } },
    { path: '/dna',      redirect: '/profile?tab=dna' },
    { path: '/opening-lab', component: () => import('./views/OpeningLabView.vue'), meta: { requiresAuth: true } },
    { path: '/profile',  component: () => import('./views/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/review',   component: () => import('./views/ReviewView.vue'),  meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
  ],
})

/**
 * Navigation Guard
 *
 * Protects routes marked with `meta.requiresAuth` by checking the
 * Supabase session before allowing navigation. Unauthenticated users
 * are redirected to the home page.
 */
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { path: '/' }
    }
  }
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
