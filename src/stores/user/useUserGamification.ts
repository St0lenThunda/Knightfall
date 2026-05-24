import { ref, computed, type Ref } from 'vue'
import { supabase } from '../../api/supabaseClient'
import { Storage, StorageKey } from '../../utils/storage'
import { logger } from '../../utils/logger'
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
  // --- Leveling Engine (The XP Logic) ---
  // We use a quadratic formula: Level = floor(sqrt(XP / 100)) + 1
  const currentLevel = computed(() => Math.floor(Math.sqrt(xp.value / 100)) + 1)
  
  const maxHearts = computed(() => {
    const lvl = currentLevel.value
    if (lvl >= 50) return 10
    if (lvl >= 40) return 9
    if (lvl >= 30) return 8
    if (lvl >= 20) return 7
    if (lvl >= 10) return 6
    return 5
  })

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
    const oldMaxHearts = maxHearts.value
    const newXP = (profile.value.xp || 0) + amount
    
    // Calculate new level to see if max hearts increased
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1
    let newMaxHearts = 5
    if (newLevel >= 50) newMaxHearts = 10
    else if (newLevel >= 40) newMaxHearts = 9
    else if (newLevel >= 30) newMaxHearts = 8
    else if (newLevel >= 20) newMaxHearts = 7
    else if (newLevel >= 10) newMaxHearts = 6

    let heartsToSave = profile.value.hearts
    if (newMaxHearts > oldMaxHearts) {
      heartsToSave = newMaxHearts // Instantly max out on milestone
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP, hearts: heartsToSave })
      .eq('id', profile.value.id)
    
    if (!error) {
      profile.value.xp = newXP
      if (newMaxHearts > oldMaxHearts) {
        profile.value.hearts = heartsToSave
      }
    }
  }

  /** 
   * Deducts a heart for a blunder. 
   * If the user was previously at max hearts, we update last_active_at to start the
   * heart regeneration countdown immediately.
   */
  async function deductHeart(): Promise<number> {
    if (!profile.value || profile.value.hearts <= 0) return 0
    const newHearts = profile.value.hearts - 1
    
    const updates: Partial<UserProfile> = { hearts: newHearts }
    if (profile.value.hearts === maxHearts.value) {
      updates.last_active_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.value.id)
    
    if (!error) {
      profile.value.hearts = newHearts
      if (updates.last_active_at) {
        profile.value.last_active_at = updates.last_active_at
      }
    }
    return profile.value.hearts
  }

  /** Adds a heart, up to the maximum. */
  async function gainHeart(): Promise<number> {
    if (!profile.value) return 0
    if (profile.value.hearts >= maxHearts.value) return profile.value.hearts
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
    const targetHearts = maxHearts.value
    const { error } = await supabase
      .from('profiles')
      .update({ hearts: targetHearts })
      .eq('id', profile.value.id)
    
    if (!error) profile.value.hearts = targetHearts
  }

  /**
   * Checks if any hearts have regenerated since the user was last active
   * and updates both the database and the local profile.
   * A heart is regenerated every 4 hours.
   */
  async function checkAndApplyHeartRegeneration() {
    if (!profile.value) return
    const maxH = maxHearts.value
    const currentH = profile.value.hearts
    
    // If already at max hearts, no need to regenerate
    if (currentH >= maxH) return

    const lastActiveStr = profile.value.last_active_at
    if (!lastActiveStr) return

    const lastActiveTime = new Date(lastActiveStr).getTime()
    const msElapsed = Date.now() - lastActiveTime
    const fourHoursMs = 4 * 60 * 60 * 1000

    if (msElapsed >= fourHoursMs) {
      const heartsToRestore = Math.floor(msElapsed / fourHoursMs)
      const newHearts = Math.min(maxH, currentH + heartsToRestore)
      
      if (newHearts > currentH) {
        logger.info(`[Gamification] Regenerated ${newHearts - currentH} hearts since last activity.`)
        
        const adjustedLastActive = new Date(lastActiveTime + (heartsToRestore * fourHoursMs)).toISOString()
        const { error } = await supabase
          .from('profiles')
          .update({ 
            hearts: newHearts,
            last_active_at: adjustedLastActive
          })
          .eq('id', profile.value.id)

        if (!error) {
          profile.value.hearts = newHearts
          profile.value.last_active_at = adjustedLastActive
        }
      }
    }
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
    if (completedQuests.value.length >= 10) b.push({ id: 'scholar_novice', name: 'Dedicated Scholar', icon: '📚', color: 'var(--teal)' })
    if (completedQuests.value.length >= 25) b.push({ id: 'scholar_adept', name: 'Sanctum Adept', icon: '🏛️', color: 'var(--gold)' })
    if (completedQuests.value.length >= 40) b.push({ id: 'scholar_master', name: 'Master Theoretician', icon: '👑', color: 'var(--rose)' })
    // Educational Note: With the standard curriculum expanded to 70 quests (5,000 XP total),
    // we scale badge milestones. "Paragon" is awarded at 55 completed quests.
    if (completedQuests.value.length >= 55) b.push({ id: 'scholar_paragon', name: 'Sanctum Paragon', icon: '🌟', color: 'var(--accent-bright)' })
    // Educational Note: Clearing all 70 standard quests (reaching 100% completion) 
    // awards the ultimate "Sanctum Conqueror" badge.
    if (completedQuests.value.length >= 70) b.push({ id: 'sanctum_conqueror', name: 'Sanctum Conqueror', icon: '🏛️✨', color: 'var(--accent)' })
    return b
  })

  return {
    hearts, xp, streak, maxHearts,
    currentLevel, xpForNextLevel, levelProgress, nextTitle, currentLevelName, currentRankBase,
    completedQuests, badges,
    addXP, deductHeart, gainHeart, refillHearts, updateStreak, markQuestComplete,
    checkAndApplyHeartRegeneration
  }
}
