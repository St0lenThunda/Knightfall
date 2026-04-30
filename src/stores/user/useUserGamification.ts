import { ref, computed, type Ref } from 'vue'
import { supabase } from '../../api/supabaseClient'
import { Storage, StorageKey } from '../../utils/storage'
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

  /**
   * THEMATIC RANK SYSTEM
   * Maps levels to specific thematic titles.
   * Every 10 levels represents a major "Piece Rank" (Pawn -> King).
   * Within each rank, we provide unique sub-titles to make every level feel distinct.
   */
  const levelTitles: Record<string, string[]> = {
    pawn: ["Aspirant", "Recruit", "Scout", "Vanguard", "Sentinel", "Shield-Bearer", "Man-at-Arms", "Sergeant", "Veteran", "Elite"],
    knight: ["Knight", "Cavalier", "Gallant", "Paladin", "Dragoon", "Templar", "Banneret", "Commander", "Warlord", "Champion"],
    bishop: ["Bishop", "Acolyte", "Deacon", "Cleric", "Mystic", "High Priest", "Oracle", "Seer", "Sage", "Saint"],
    rook: ["Rook", "Warden", "Keeper", "Castellan", "Bastion", "Iron Wall", "Citadel", "Fortress", "Stronghold", "Colossus"],
    queen: ["Queen", "Consort", "Sovereign", "Empress", "Matriarch", "Overlord", "Tyrant", "Goddess", "Supreme", "Absolute"],
    king: ["King", "Monarch", "Emperor", "Conqueror", "Immortal", "Legend", "Mythic", "Eternal", "Divine", "Ascended"]
  }

  /**
   * The primary display title for the user based on their exact level.
   * Example: Level 12 -> "Gallant Knight"
   */
  const currentLevelName = computed(() => {
    const lvl = currentLevel.value
    const index = lvl % 10 // Sub-level within the 10-level block
    
    // Determine the base rank category
    let rank = "pawn"
    if (lvl >= 60) return "Grandmaster"
    if (lvl >= 50) rank = "king"
    else if (lvl >= 40) rank = "queen"
    else if (lvl >= 30) rank = "rook"
    else if (lvl >= 20) rank = "bishop"
    else if (lvl >= 10) rank = "knight"

    const titles = levelTitles[rank]
    const subTitle = titles[index] || titles[titles.length - 1]
    
    // For major milestones (Level 10, 20, etc.), just return the rank name
    if (index === 0 && lvl > 1) return rank.charAt(0).toUpperCase() + rank.slice(1)
    
    // For intermediate levels, combine or return sub-title
    return `${subTitle} ${rank.charAt(0).toUpperCase() + rank.slice(1)}`
  })

  const currentRankBase = computed(() => {
    const lvl = currentLevel.value
    if (lvl >= 50) return "king"
    if (lvl >= 40) return "queen"
    if (lvl >= 30) return "rook"
    if (lvl >= 20) return "bishop"
    if (lvl >= 10) return "knight"
    return "pawn"
  })

  /**
   * The target rank or "Next Big Thing" the user is chasing.
   */
  const nextTitle = computed(() => {
    const lvl = currentLevel.value
    if (lvl < 10) return "Knight"
    if (lvl < 20) return "Bishop"
    if (lvl < 30) return "Rook"
    if (lvl < 40) return "Queen"
    if (lvl < 50) return "King"
    return "Grandmaster"
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
  const completedLessons = ref<string[]>(Storage.get(StorageKey.COMPLETED_LESSONS, [] as string[]))

  function markLessonComplete(lessonId: string) {
    if (!completedLessons.value.includes(lessonId)) {
      completedLessons.value.push(lessonId)
      Storage.set(StorageKey.COMPLETED_LESSONS, completedLessons.value)
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
    currentLevel, xpForNextLevel, levelProgress, nextTitle, currentLevelName, currentRankBase,
    completedLessons, badges,
    addXP, deductHeart, refillHearts, updateStreak, markLessonComplete
  }
}
