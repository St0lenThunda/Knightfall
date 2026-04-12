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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/play', component: PlayView },
    { path: '/analysis', component: AnalysisView },
    { path: '/puzzles', component: PuzzlesView },
    { path: '/profile', component: ProfileView },
  ],
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
