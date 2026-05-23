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

  /** Adds a heart, up to the maximum. */
  async function gainHeart(): Promise<number> {
    if (!profile.value) return 0
    if (profile.value.hearts >= maxHearts) return profile.value.hearts
    const newHearts = profile.value.hearts + 1
    
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

  // --- Sanctum Achievements ---
  const completedQuests = ref<string[]>(Storage.get(StorageKey.COMPLETED_QUESTS, [] as string[]))

  /**
   * Marks a quest as completed locally in browser storage.
   * 
   * Why do we not award XP here?
   * Historically, this method awarded a static 50 XP. We have moved XP rewards
   * to be dynamic, based on each Quest's specific `xp_reward` defined in curriculumStore.ts.
   * Removing `addXP` here prevents double-awarding XP when quests are completed.
   * 
   * @param questId - The unique identifier of the completed quest
   */
  function markQuestComplete(questId: string) {
    // Only add to the completed array if it's not already tracked.
    if (!completedQuests.value.includes(questId)) {
      completedQuests.value.push(questId)
      // Save the updated array to localStorage to persist state across reloads.
      Storage.set(StorageKey.COMPLETED_QUESTS, completedQuests.value)
    }
  }

  const badges = computed(() => {
    const b = []
    if (completedQuests.value.length >= 1) b.push({ id: 'first_lesson', name: 'First Steps', icon: '📜', color: 'var(--blue)' })
    if (completedQuests.value.length >= 5) b.push({ id: 'scholar_novice', name: 'Dedicated Scholar', icon: '📚', color: 'var(--teal)' })
    if (completedQuests.value.length >= 10) b.push({ id: 'scholar_adept', name: 'Sanctum Adept', icon: '🏛️', color: 'var(--gold)' })
    if (completedQuests.value.length >= 20) b.push({ id: 'scholar_master', name: 'Master Theoretician', icon: '👑', color: 'var(--rose)' })
    return b
  })

  return {
    hearts, xp, streak, maxHearts,
    currentLevel, xpForNextLevel, levelProgress, nextTitle, currentLevelName, currentRankBase,
    completedQuests, badges,
    addXP, deductHeart, gainHeart, refillHearts, updateStreak, markQuestComplete
  }
}
