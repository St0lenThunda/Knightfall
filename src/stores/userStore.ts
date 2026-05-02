import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../api/supabaseClient'
import type { Session } from '@supabase/supabase-js'

import { logger } from '../utils/logger'
import { getLichessUserStats } from '../api/lichessApi'
import { getChesscomUserStats } from '../api/chesscomApi'

import { useUiStore } from './uiStore'

// --- Specialized Composables (Pillar Architecture) ---
import { useUserIdentity } from './user/useUserIdentity'
import { useUserStats } from './user/useUserStats'
import { useUserGamification } from './user/useUserGamification'
import { useRatingSystem } from '../composables/useRatingSystem'

// --- Exported Interfaces ---
export interface GlobalStats {
  lichess?: {
    blitz?: number
    rapid?: number
    bullet?: number
    puzzle?: number
    percentile?: number
  }
  chesscom?: {
    blitz?: number
    rapid?: number
    bullet?: number
    puzzle?: number
    percentile?: number
  }
}

export interface UserProfile {
  id: string
  username: string
  rating: number
  puzzle_rating?: number
  location?: string
  archetype?: string
  avatar_url?: string
  chesscom_handle?: string
  lichess_handle?: string
  hearts: number
  xp: number
  streak: number
  last_active_at?: string
  role?: string
  global_stats?: GlobalStats
  created_at?: string
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
    // Safety timeout for CI/Slow networks: don't hang the app forever
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth Timeout')), 5000)
    )

    try {
      const { data: { session: s } } = await Promise.race([
        supabase.auth.getSession(),
        timeout as Promise<any>
      ])
      session.value = s
    } catch (e) {
      logger.warn('[UserStore] Session fetch timed out or failed. Continuing in guest mode.')
      session.value = null
      return
    }

    if (!session.value) return

    // Execute Profile and Games in parallel
    const [profileRes, matchesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.value.user.id).single(),
      supabase
        .from('matches')
        .select('*')
        .or(`white_id.eq.${session.value.user.id},black_id.eq.${session.value.user.id}`)
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    if (profileRes.data) {
      profile.value = profileRes.data
      
      // Self-Healing: If profile exists but username is missing, try to recover from metadata
      if (profile.value && !profile.value.username && session.value.user.user_metadata?.username) {
        logger.info('[UserStore] Repairing profile: Username missing, recovering from metadata...')
        await updateProfile({ username: session.value.user.user_metadata.username })
      }
    } else if (session.value.user.user_metadata?.username) {
      // If profile is missing entirely but we have metadata, create it now
      logger.info('[UserStore] Profile missing: Creating from metadata...')
      const { data: newProfile } = await supabase.from('profiles').insert({
        id: session.value.user.id,
        username: session.value.user.user_metadata.username,
        rating: 1200,
        hearts: 5,
        xp: 0
      }).select().single()
      if (newProfile) profile.value = newProfile
    }

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
      .eq('user_id', session.value.user.id)
      .order('created_at', { ascending: false })
    
    if (az) puzzleAttempts.value = az
    
    // 4. Check for Floating Guest Data (Delayed Signup Gate)
    await promoteGuestData()
  }

  /**
   * Promotes anonymous guest assessment data to the permanent user profile.
   * This is the "Bridge" that makes the Delayed Signup Gate work.
   */
  async function promoteGuestData() {
    if (!profile.value) return
    
    try {
      const pending = localStorage.getItem('knightfall_pending_dna')
      if (pending) {
        const { archetype } = JSON.parse(pending)
        logger.info(`[UserStore] Found guest DNA: ${archetype}. Promoting to profile...`)

        await updateProfile({
          archetype: archetype
        })

        localStorage.removeItem('knightfall_pending_dna')
        
        const uiStore = useUiStore()
        uiStore.addToast(`DNA Profile Saved: Welcome to the War Room, ${profile.value.username}.`, 'success')
      }
    } catch (e) {
      logger.error('[UserStore] Failed to promote guest DNA:', e)
    }
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
      hints_used: hintLevel,
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

  /**
   * APPROACH 2: Omni-Rating
   * Fetches and unifies stats from Lichess and Chess.com.
   */
  async function syncGlobalIntelligence() {
    if (!profile.value) return
    
    const { lichess_handle, chesscom_handle } = profile.value
    if (!lichess_handle && !chesscom_handle) return

    logger.info('[UserStore] Synchronizing Global Intelligence...')

    const [liStats, chStats] = await Promise.all([
      lichess_handle ? getLichessUserStats(lichess_handle) : Promise.resolve(null),
      chesscom_handle ? getChesscomUserStats(chesscom_handle) : Promise.resolve(null)
    ])

    const updatedStats: GlobalStats = {}

    if (liStats && liStats.perfs) {
      updatedStats.lichess = {
        blitz: liStats.perfs.blitz?.rating || 0,
        rapid: liStats.perfs.rapid?.rating || 0,
        bullet: liStats.perfs.bullet?.rating || 0,
        puzzle: liStats.perfs.puzzle?.rating || 0
      }
    }

    if (chStats) {
      updatedStats.chesscom = {
        blitz: chStats.chess_blitz?.last?.rating || 0,
        rapid: chStats.chess_rapid?.last?.rating || 0,
        bullet: chStats.chess_bullet?.last?.rating || 0,
        puzzle: chStats.tactics?.highest?.rating || chStats.tactics?.last?.rating || 0
      }
    }

    // Update local profile and persist to Supabase if needed
    profile.value = { ...profile.value, global_stats: updatedStats }
    
    // APPROACH 2: Notify the user about the external sync (Transparency)
    if (updatedStats.lichess || updatedStats.chesscom) {
      const uiStore = useUiStore()
      const platforms = [updatedStats.lichess ? 'Lichess' : '', updatedStats.chesscom ? 'Chess.com' : ''].filter(Boolean).join(' & ')
      uiStore.addToast(`Global Intelligence Updated: Synced with ${platforms}.`, 'success')
    }
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
    syncGlobalIntelligence,
    
    // Global Computed (Bridge between stats and identity)
    rating: ratingSystem.currentRating,
    performanceHistory: ratingSystem.history
  }
})
