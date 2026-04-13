import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import HomeView from './views/HomeView.vue'
import PlayView from './views/PlayView.vue'
import AnalysisView from './views/AnalysisView.vue'
import PuzzlesView from './views/PuzzlesView.vue'
import ProfileView from './views/ProfileView.vue'
import LibraryView from './views/LibraryView.vue'
import { supabase } from './api/supabaseClient'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',         component: HomeView },
    { path: '/play',     component: PlayView },
    { path: '/analysis', component: AnalysisView },
    { path: '/puzzles',  component: PuzzlesView },
    { path: '/profile',  component: ProfileView, meta: { requiresAuth: true } },
    { path: '/library',  component: LibraryView },
  ],
})

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
