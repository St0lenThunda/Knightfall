import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../api/supabaseClient'
import type { Session } from '@supabase/supabase-js'

import { logger } from '../utils/logger'

// --- Specialized Composables (Pillar Architecture) ---
import { useUserIdentity } from './user/useUserIdentity'
import { useUserStats } from './user/useUserStats'
import { useUserGamification } from './user/useUserGamification'
import { useRatingSystem } from '../composables/useRatingSystem'

// --- Exported Interfaces ---
export interface UserProfile {
  id: string
  username: string
  rating: number
  puzzle_rating?: number
  location?: string
  avatar_url?: string
  chesscom_handle?: string
  lichess_handle?: string
  hearts: number
  xp: number
  streak: number
  last_active_at?: string
  role?: string
}

export interface PastGame {
  id: string
  date: string
  white: string
  black: string
  result: 'win' | 'loss' | 'draw'
  opening: string
  opponentRating?: number
  accuracy?: number
  rating?: number
}

export interface PuzzleAttempt {
  id: string
  puzzle_id: string
  solved: boolean
  themes: string[]
  time_taken_seconds: number
  attempts: number
  hint_level: number
  created_at: string
}

/**
 * Knightfall User Store: The primary identity and progression hub.
 * 
 * DESIGN PATTERN: Orchestrator
 * This store delegates domain-specific logic to specialized composables in @/stores/user/
 * while handling core data fetching and persistence with Supabase.
 */
export const useUserStore = defineStore('user', () => {
  // --- CORE DATA STATE ---
  const session = ref<Session | null>(null)
  const profile = ref<UserProfile | null>(null)
  const pastGames = ref<PastGame[]>([])
  const puzzleAttempts = ref<PuzzleAttempt[]>([])
  const puzzleQueue = ref<any[]>([])

  // --- SUB-COMPOSABLES (Logic Decomposition) ---
  const identity = useUserIdentity(profile)
  const stats = useUserStats(pastGames, puzzleAttempts)
  const gamification = useUserGamification(profile)
  const ratingSystem = useRatingSystem(pastGames)

  // --- LIFECYCLE ---
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    if (newSession) fetchUserData()
  })

  // --- ACTIONS ---

  /**
   * Hydrates the store from Supabase.
   * Fetches profile, match history, and puzzle attempts in parallel.
   */
  async function fetchUserData() {
    const { data: { session: s } } = await supabase.auth.getSession()
    session.value = s
    if (!s) return

    // Execute Profile and Games in parallel
    const [profileRes, matchesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', s.user.id).single(),
      supabase
        .from('matches')
        .select('*')
        .or(`white_id.eq.${s.user.id},black_id.eq.${s.user.id}`)
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    if (profileRes.data) profile.value = profileRes.data

    if (matchesRes.data) {
      pastGames.value = matchesRes.data.map((row: any) => {
        const isWhite = identity.isMe(row.white_username)
        const result = row.result === '1-0' ? (isWhite ? 'win' : 'loss') 
          : row.result === '0-1' ? (isWhite ? 'loss' : 'win')
          : 'draw'
        
        return {
          id: row.id,
          date: row.created_at,
          white: row.white_username,
          black: row.black_username,
          result: result as 'win' | 'loss' | 'draw',
          opening: row.opening || row.eco || 'Unknown',
          opponentRating: isWhite ? row.black_rating : row.white_rating,
          accuracy: isWhite ? row.white_accuracy : row.black_accuracy,
          rating: isWhite ? row.white_rating : row.black_rating
        }
      })
    }

    // 3. Puzzle History
    const { data: az } = await supabase
      .from('puzzle_attempts')
      .select('*')
      .eq('user_id', s.user.id)
      .order('created_at', { ascending: false })
    
    if (az) puzzleAttempts.value = az
  }

  /**
   * Records a puzzle attempt and triggers progression logic.
   */
  async function submitPuzzleAttempt(
    puzzleId: string, 
    solved: boolean, 
    attempts: number, 
    timeTaken: number, 
    hintLevel: number, 
    themes: string[]
  ) {
    if (!session.value) return

    const { data: attempt, error } = await supabase.from('puzzle_attempts').insert({
      user_id: session.value.user.id,
      puzzle_id: puzzleId,
      solved,
      themes,
      time_taken_seconds: timeTaken,
      attempts,
      hint_level: hintLevel,
      created_at: new Date().toISOString()
    }).select().single()

    if (!error && attempt) {
      puzzleAttempts.value.unshift(attempt)
      // Progression Logic
      if (solved) {
        await gamification.addXP(15)
        await gamification.updateStreak()
      } else {
        await gamification.deductHeart()
      }
    }
  }

  /**
   * Updates the user's public profile metadata.
   */
  async function updateProfile(updates: Partial<UserProfile>) {
    if (!profile.value) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.value.id)
    
    if (error) {
      logger.error('[UserStore] Failed to update profile:', error)
    } else {
      profile.value = { ...profile.value, ...updates }
    }
    return { error }
  }

  /**
   * Records the completion of a Daily Gauntlet.
   */
  async function submitGauntletResult(date: string, time: number) {
    if (!session.value) return
    
    // Award special gauntlet XP and ensure streak is updated
    await gamification.addXP(25)
    await gamification.updateStreak()
    
    logger.info(`[UserStore] Gauntlet completed: ${date} in ${time}s. Bonus XP awarded.`)
  }

  // --- PUBLIC API ---
  return {
    // State
    session,
    profile,
    pastGames,
    puzzleAttempts,

    // Composable exposures (Identity)
    ...identity,
    
    // Composable exposures (Stats)
    ...stats,
    
    // Composable exposures (Gamification)
    ...gamification,
    currentStreak: gamification.streak,
    solvedToday: stats.solvedTodayCount,

    // Spaced Repetition Queue
    puzzleQueue,

    // Orchestration Actions
    fetchUserData,
    submitPuzzleAttempt,
    updateProfile,
    submitGauntletResult,
    
    // Global Computed (Bridge between stats and identity)
    rating: ratingSystem.currentRating,
    performanceHistory: ratingSystem.history
  }
})
