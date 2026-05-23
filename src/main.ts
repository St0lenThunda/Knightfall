import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import { supabase } from './api/supabaseClient'
import { logger } from './utils/logger'

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
    { path: '/',         component: HomeView, meta: { title: 'Strategic Briefing', icon: '📜' } },
    { path: '/path',     component: () => import('./views/PathView.vue'),    meta: { requiresAuth: true } },
    { path: '/lesson/:id', component: () => import('./views/LessonView.vue'), meta: { requiresAuth: true } },
    { path: '/learn/:id',  component: () => import('./views/FoundationLessonView.vue') },
    { path: '/sanctum',  component: () => import('./views/SanctumView.vue'), meta: { requiresAuth: true, title: 'The Sanctum', icon: '🧘' } },
    { path: '/academy',  redirect: '/sanctum' },
    { path: '/play',     component: () => import('./views/PlayView.vue'), meta: { title: 'Direct Combat', icon: '⚔️' } },
    { path: '/analysis', component: () => import('./views/AnalysisView.vue'), meta: { title: "Oracle's Review", icon: '🔮' } },
    { path: '/puzzles',  component: () => import('./views/PuzzlesView.vue'), meta: { title: 'Siege Trials', icon: '⚡' } },
    { path: '/gauntlet', component: () => import('./views/GauntletView.vue'), meta: { requiresAuth: true, title: 'The Great Gauntlet', icon: '🔥' } },
    { path: '/dna',      redirect: '/profile?tab=dna' },
    { path: '/opening-lab', component: () => import('./views/OpeningLabView.vue'), meta: { requiresAuth: true, title: 'Stratagem Forge', icon: '⚒️' } },
    { path: '/profile',  component: () => import('./views/ProfileView.vue'), meta: { requiresAuth: true, title: 'War Room', icon: '🛡️' } },
    { path: '/review',   component: () => import('./views/ReviewView.vue'),  meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('./views/SettingsView.vue'), meta: { title: 'Codex of Rites', icon: '🗝️' } },
    { path: '/assessment', component: () => import('./views/OnboardingGauntlet.vue') },
    { path: '/dna-reveal', component: () => import('./views/DnaRevealView.vue') },
    { path: '/reset-password', component: () => import('./views/ResetPasswordView.vue') },
    { path: '/admin', component: () => import('./views/AdminView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Archivist Command', icon: '👑' } },
  ],
})

/**
 * Navigation Guard
 *
 * Protects routes marked with `meta.requiresAuth` by checking the
 * Supabase session before allowing navigation. Unauthenticated users
 * are redirected to the home page.
 * 
 * Routes with `meta.requiresAdmin` are further checked against the database
 * to verify the user has the 'admin' role.
 */
router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect guest users with no DNA profile to the onboarding gauntlet
  if (to.path === '/' && !session) {
    const pendingDna = localStorage.getItem('knightfall_pending_dna')
    if (!pendingDna) {
      logger.info('[Router] Guest user has no cached DNA. Intercepting to /assessment.')
      return { path: '/assessment' }
    }
  }

  if (to.meta.requiresAuth && !session) {
    return { path: '/' }
  }

  if (to.meta.requiresAdmin) {
    if (!session) return { path: '/' }
    
    // Query profiles role to verify administrative privileges directly from db
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      logger.warn(`[Router] Access denied: User ${session.user.id} (${session.user.email}) attempted to access admin page without permission.`)
      return { path: '/' }
    }
  }
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
