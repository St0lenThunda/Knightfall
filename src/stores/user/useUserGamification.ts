import { ref, computed, type Ref } from 'vue'
import { supabase } from '../../api/supabaseClient'
import type { UserProfile } from '../userStore'

/**
 * User Gamification Composable
 * 
 * Handles the "Duolingo Pillar" of the application: XP, Hearts, Streaks, and Leveling.
 * By isolating this logic, we can manage player motivation and progression independently
 * from core account management or game history.
 * 
 * @param profile - Reactive reference to the user's profile data
 */
export function useUserGamification(profile: Ref<UserProfile | null>) {
  // --- Basic Metrics ---
  const hearts = computed(() => profile.value?.hearts ?? 5)
  const xp = computed(() => profile.value?.xp ?? 0)
  const streak = computed(() => profile.value?.streak ?? 0)
  const maxHearts = 5

  // --- Leveling Engine (The XP Logic) ---
  // We use a quadratic formula: Level = floor(sqrt(XP / 100)) + 1
  const currentLevel = computed(() => Math.floor(Math.sqrt(xp.value / 100)) + 1)
  const xpForNextLevel = computed(() => Math.pow(currentLevel.value, 2) * 100)
  const xpForCurrentLevel = computed(() => Math.pow(currentLevel.value - 1, 2) * 100)

  /** Progress percentage (0-100) within the current level. */
  const levelProgress = computed(() => {
    const start = xpForCurrentLevel.value
    const end = xpForNextLevel.value
    const range = end - start
    if (range === 0) return 0
    return Math.min(100, Math.max(0, ((xp.value - start) / range) * 100))
  })

  // --- Title System (Aligned with Piece Worth) ---
  const nextTitle = computed(() => {
    const lvl = currentLevel.value
    if (lvl < 10) return "Pawn"
    if (lvl < 20) return "Knight"
    if (lvl < 30) return "Bishop"
    if (lvl < 40) return "Rook"
    if (lvl < 50) return "Queen"
    if (lvl < 60) return "King"
    return "Grandmaster"
  })

  const currentLevelName = computed(() => {
    const lvl = currentLevel.value
    if (lvl < 10) return "Initiate"
    if (lvl < 20) return "Apprentice"
    if (lvl < 30) return "Scholar"
    if (lvl < 40) return "Expert"
    if (lvl < 50) return "Master"
    if (lvl < 60) return "Grandmaster"
    return "Legend"
  })

  // --- Mutations ---

  /** Awards XP to the user and persists to Supabase. */
  async function addXP(amount: number) {
    if (!profile.value) return
    const newXP = (profile.value.xp || 0) + amount
    
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP })
      .eq('id', profile.value.id)
    
    if (!error) profile.value.xp = newXP
  }

  /** Deducts a heart for a blunder. */
  async function deductHeart(): Promise<number> {
    if (!profile.value || profile.value.hearts <= 0) return 0
    const newHearts = profile.value.hearts - 1
    
    const { error } = await supabase
      .from('profiles')
      .update({ hearts: newHearts })
      .eq('id', profile.value.id)
    
    if (!error) profile.value.hearts = newHearts
    return profile.value.hearts
  }

  /** Refills hearts to max. */
  async function refillHearts() {
    if (!profile.value) return
    const { error } = await supabase
      .from('profiles')
      .update({ hearts: 5 })
      .eq('id', profile.value.id)
    
    if (!error) profile.value.hearts = 5
  }

  /** Updates the daily streak logic based on activity. */
  async function updateStreak() {
    if (!profile.value) return
    
    const today = new Date().toISOString().slice(0, 10)
    const lastActive = profile.value.last_active_at?.slice(0, 10)
    
    if (lastActive === today) return 

    let newStreak = (profile.value.streak || 0)
    if (lastActive) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)
      
      if (lastActive === yesterdayStr) newStreak++ 
      else newStreak = 1 
    } else {
      newStreak = 1 
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        streak: newStreak,
        last_active_at: new Date().toISOString()
      })
      .eq('id', profile.value.id)

    if (!error) {
      profile.value.streak = newStreak
      profile.value.last_active_at = new Date().toISOString()
    }
  }

  // --- Academy Achievements ---
  const completedLessons = ref<string[]>(JSON.parse(localStorage.getItem('knightfall_completed_lessons') || '[]'))

  function markLessonComplete(lessonId: string) {
    if (!completedLessons.value.includes(lessonId)) {
      completedLessons.value.push(lessonId)
      localStorage.setItem('knightfall_completed_lessons', JSON.stringify(completedLessons.value))
      addXP(50) // Reward XP
    }
  }

  const badges = computed(() => {
    const b = []
    if (completedLessons.value.length >= 1) b.push({ id: 'first_lesson', name: 'First Steps', icon: '📜', color: 'var(--blue)' })
    if (completedLessons.value.length >= 5) b.push({ id: 'scholar_novice', name: 'Dedicated Scholar', icon: '📚', color: 'var(--teal)' })
    if (completedLessons.value.length >= 10) b.push({ id: 'scholar_adept', name: 'Academy Adept', icon: '🏛️', color: 'var(--gold)' })
    if (completedLessons.value.length >= 20) b.push({ id: 'scholar_master', name: 'Master Theoretician', icon: '👑', color: 'var(--rose)' })
    return b
  })

  return {
    hearts, xp, streak, maxHearts,
    currentLevel, xpForNextLevel, levelProgress, nextTitle, currentLevelName,
    completedLessons, badges,
    addXP, deductHeart, refillHearts, updateStreak, markLessonComplete
  }
}
