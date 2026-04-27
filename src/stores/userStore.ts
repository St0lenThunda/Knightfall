import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { BASE_RATING } from '../composables/useRatingSystem'

// --- Specialized Composables (Pillar Architecture) ---
import { useUserIdentity } from './user/useUserIdentity'
import { useUserStats } from './user/useUserStats'
import { useUserGamification } from './user/useUserGamification'

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
}

export interface PuzzleAttempt {
  id: string
  puzzle_id: string
  solved: boolean
  themes: string[]
  time_taken_seconds: number
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
          opponent: isWhite ? row.black_username : row.white_username,
          result: result as 'win' | 'loss' | 'draw',
          rating: isWhite ? row.white_rating : row.black_rating,
          accuracy: isWhite ? row.white_accuracy : row.black_accuracy,
          eco: row.eco
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
    
    if (!error) profile.value = { ...profile.value, ...updates }
    return { error }
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

    // Spaced Repetition Queue
    puzzleQueue,

    // Orchestration Actions
    fetchUserData,
    submitPuzzleAttempt,
    updateProfile,
    
    // Global Computed (Bridge between stats and identity)
    rating: computed(() => {
      const hist = stats.calculatedRatingHistory.value
      return hist.length > 0 ? hist[hist.length - 1].rating : BASE_RATING
    })
  }
})
