import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import { SRSAlgorithm, type SRSState } from '../utils/srsAlgorithm'
import type { Session } from '@supabase/supabase-js'

// ─── Exported Interfaces ──────────────────────────────────────────────────────
// These are the canonical data shapes for the entire application.
// Other stores and components should import them from here.

/**
 * Represents the authenticated user's profile data from the `profiles` table.
 * Extracted as a named interface so it can be reused across stores,
 * components, and the badge engine without inline type duplication.
 */
export interface UserProfile {
  id: string
  username: string
  rating: number
  puzzle_rating?: number
  location?: string
  avatar_url?: string
  chessComUsername?: string
  lichessUsername?: string
  // Gamification
  hearts: number
  xp: number
  streak: number
  last_active_at?: string
}

/**
 * A single chess game from the user's match history.
 * The `result` field is normalized to 'win' | 'loss' | 'draw'
 * during the fetch-and-map step, so downstream consumers never
 * need to parse raw PGN result strings like '1-0' or '0-1'.
 */
export interface PastGame {
  id: string
  opponent: string
  result: 'win' | 'loss' | 'draw'
  mistakes: string[]
  control: string
  opening: string
  score: string
  date: string
  white: string
  black: string
  pgn?: string
  eco?: string
}

/**
 * A single puzzle attempt record from the `puzzle_attempts` table.
 * Tracks both success/failure and quality metrics (time, hints, retries)
 * so the Badge Engine can evaluate mastery-tier achievements.
 */
export interface PuzzleAttempt {
  id: string
  puzzle_id: string
  solved: boolean
  attempts: number
  hints_used: number
  time_taken_seconds: number
  themes: string[]
  created_at: string
  // SRS Fields
  next_review_at?: string
  ease_factor?: number
  interval_days?: number
  mastery_level?: number
}

/**
 * A puzzle queued for spaced repetition review (SM-2 algorithm).
 * The `next_review` timestamp determines when the puzzle resurfaces.
 */
export interface QueuedPuzzle {
  puzzle_id: string
  next_review: string
  interval_days: number
  ease_factor: number
  repetition: number
}

// ─── Store Definition ─────────────────────────────────────────────────────────

export const useUserStore = defineStore('user', () => {
  /**
   * The Supabase auth session. Typed properly so that downstream
   * access like `session.value.user.id` is compile-time checked.
   * Previously was `ref<any>` — the weakest link in our type chain.
   */
  const session = ref<Session | null>(null)

  /** The user's profile data, fetched from the `profiles` table on login. */
  const profile = ref<UserProfile | null>(null)

  /** All past games, normalized from the `matches` table. */
  const pastGames = ref<PastGame[]>([])

  /** All puzzle attempt records, ordered by creation date. */
  const puzzleAttempts = ref<PuzzleAttempt[]>([])

  /** The spaced repetition queue for puzzle review scheduling. */
  const puzzleQueue = ref<QueuedPuzzle[]>([])

  // ─── Gamification State (Duolingo Pillar) ──────────────────────────────────
  const hearts = computed(() => profile.value?.hearts ?? 5)
  const xp = computed(() => profile.value?.xp ?? 0)
  const streak = computed(() => profile.value?.streak ?? 0)
  const maxHearts = 5
  /** Daily Gauntlet progress tracking for the current session. */
  const gauntletProgress = ref({
    date: '',
    solvedCount: 0,
    totalCount: 5,
    history: [] as { date: string, time: number }[]
  })

  // ─── Identity Helpers (Fix #1: Centralized "Who Am I?" Logic) ─────────────
  //
  // Previously, this pattern was repeated 7+ times across libraryStore and
  // coachStore:
  //   const myName = userStore.profile?.username?.toLowerCase() || ''
  //   const isWhite = g.white.toLowerCase() === myName || ...
  //
  // Now every store just calls `userStore.isMe(g.white)`.

  /**
   * A derived identity object that caches the user's lowercase username
   * and Chess.com handle. Recomputed only when the profile changes.
   */
  const myIdentity = computed(() => ({
    name: profile.value?.username?.toLowerCase() || '',
    chessCom: profile.value?.chessComUsername?.toLowerCase() || '',
    lichess: profile.value?.lichessUsername?.toLowerCase() || '',
  }))

  /**
   * Simple admin check for HUD visibility and restricted features.
   */
  const isAdmin = computed(() => {
    const name = profile.value?.username?.toLowerCase()
    const isDev = import.meta.env.DEV
    return isDev || name === 'thunda' || name === 'admin' || name === 'tonym415'
  })

  /**
   * Determines whether a given player name belongs to the current user.
   * Checks both the Knightfall username and the linked Chess.com handle.
   *
   * @param playerName - The name to check (e.g., from a PGN "White" header)
   * @returns true if the name matches the current user's identity
   */
  function isMe(playerName: string): boolean {
    const id = myIdentity.value
    const lower = playerName.toLowerCase()
    return lower === id.name || 
           (!!id.chessCom && lower === id.chessCom) ||
           (!!id.lichess && lower === id.lichess)
  }

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  /**
   * Hydrates all user data from Supabase in parallel.
   * Each fetch is independent — a failure in one doesn't block the others.
   * This prevents a half-hydrated store state on partial network failures.
   */
  async function fetchUserData() {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    session.value = currentSession

    if (!session.value) return

    // Fire all three fetches in parallel for speed (Fix #10: Error Boundaries)
    const [profileResult, puzzleResult, matchResult] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.value.user.id)
        .single(),
      supabase
        .from('puzzle_attempts')
        .select('*')
        .eq('user_id', session.value.user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('matches')
        .select('*')
        .or(`white_id.eq.${session.value.user.id},black_id.eq.${session.value.user.id}`)
        .order('created_at', { ascending: true }),
    ])

    // --- Profile ---
    if (profileResult.status === 'fulfilled' && profileResult.value.data) {
      profile.value = profileResult.value.data
      // Hydrate Chess.com username from localStorage (avoids DB migration)
      const savedChessComUser = localStorage.getItem('knightfall_chesscom_username')
      // Hydrate Lichess username from localStorage
      const savedLichessUser = localStorage.getItem('knightfall_lichess_username')
      if (profile.value) {
        profile.value.chessComUsername = savedChessComUser || undefined
        profile.value.lichessUsername = savedLichessUser || undefined
      }
    }

    // --- Puzzle Attempts ---
    if (puzzleResult.status === 'fulfilled' && puzzleResult.value.data) {
      puzzleAttempts.value = puzzleResult.value.data
    }

    // --- Match History ---
    if (matchResult.status === 'fulfilled' && matchResult.value.data) {
      pastGames.value = matchResult.value.data.map((m: Record<string, any>) => {
        const amWhite = m.white_id === session.value!.user.id
        let res: PastGame['result'] = 'draw'
        if (m.result?.startsWith('1-0')) res = amWhite ? 'win' : 'loss'
        else if (m.result?.startsWith('0-1')) res = amWhite ? 'loss' : 'win'
        
        return {
          id: m.id,
          opponent: amWhite ? (m.black_username || 'Opponent') : (m.white_username || 'Opponent'),
          result: res,
          mistakes: [],
          control: m.time_control || 'Standard',
          opening: m.opening || 'Unknown Opening',
          score: m.result || '1/2-1/2',
          date: m.date,
          white: m.white_username || 'White',
          black: m.black_username || 'Black',
          pgn: m.pgn,
          eco: m.eco
        }
      })
    }
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Records a completed puzzle attempt to both local state and Supabase.
   * Now integrates SRS logic to schedule future reviews.
   */
  async function submitPuzzleAttempt(puzzleId: string, solved: boolean, attempts: number, timeTaken: number, hintLevel: number, themes: string[]) {
    if (!session.value) return

    // 1. Calculate SRS Update
    // Find previous attempt for this puzzle to carry over SRS state
    const previous = [...puzzleAttempts.value].reverse().find(a => a.puzzle_id === puzzleId)
    const currentState: SRSState = {
      easeFactor: previous?.ease_factor ?? 2.5,
      interval: previous?.interval_days ?? 0,
      masteryLevel: previous?.mastery_level ?? 0
    }

    const quality = SRSAlgorithm.mapPerformanceToQuality(solved, attempts, hintLevel)
    const srs = SRSAlgorithm.calculateNextReview(quality, currentState)

    // 2. Persist to Supabase
    const { data } = await supabase
      .from('puzzle_attempts')
      .insert([{ 
        user_id: session.value.user.id, 
        puzzle_id: puzzleId, 
        solved, 
        attempts,
        hints_used: hintLevel,
        time_taken_seconds: timeTaken,
        themes,
        // SRS Columns
        next_review_at: srs.nextReviewAt.toISOString(),
        ease_factor: srs.easeFactor,
        interval_days: srs.interval,
        mastery_level: srs.masteryLevel
      }])
      .select()
      .single()

    if (data) puzzleAttempts.value.push(data)

    // 3. Award XP and check streak
    await addXP(solved ? 15 : 5)
    await updateStreak()
  }

  /**
   * Awards XP to the user and persists to Supabase.
   */
  async function addXP(amount: number) {
    if (!profile.value) return
    const newXP = (profile.value.xp || 0) + amount
    
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP })
      .eq('id', profile.value.id)
    
    if (!error) profile.value.xp = newXP
  }

  /**
   * Deducts a heart for a blunder.
   */
  async function deductHeart() {
    if (!profile.value || profile.value.hearts <= 0) return
    const newHearts = profile.value.hearts - 1
    
    const { error } = await supabase
      .from('profiles')
      .update({ hearts: newHearts })
      .eq('id', profile.value.id)
    
    if (!error) profile.value.hearts = newHearts
  }

  /**
   * Updates the daily streak logic.
   */
  async function updateStreak() {
    if (!profile.value) return
    
    const today = new Date().toISOString().slice(0, 10)
    const lastActive = profile.value.last_active_at?.slice(0, 10)
    
    if (lastActive === today) return // Already updated today

    let newStreak = (profile.value.streak || 0)
    
    if (lastActive) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)
      
      if (lastActive === yesterdayStr) {
        newStreak++ // Consecutive day
      } else {
        newStreak = 1 // Streak broken, restart
      }
    } else {
      newStreak = 1 // First activity
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

  /**
   * Records a completed Daily Gauntlet session.
   *
   * @param date - The date string (YYYY-MM-DD)
   * @param totalTime - The total time in seconds to solve all 5 puzzles
   */
  async function submitGauntletResult(date: string, totalTime: number) {
    gauntletProgress.value.history.push({ date, time: totalTime })
  }

  // ─── Auth Lifecycle ─────────────────────────────────────────────────────────

  /** React to Supabase auth state changes (login, logout, token refresh). */
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    fetchUserData()
  })

  // ─── Computed Stats ─────────────────────────────────────────────────────────

  /** Win/Loss/Draw statistics derived from pastGames. */
  const wldStats = computed(() => {
    const stats = { win: 0, loss: 0, draw: 0 }
    const uniqueIds = new Set<string>()
    const deduplicated = pastGames.value.filter(g => {
      if (uniqueIds.has(g.id)) return false
      uniqueIds.add(g.id)
      return true
    })

    deduplicated.forEach(g => {
      if (g.result === 'win') stats.win++
      else if (g.result === 'loss') stats.loss++
      else stats.draw++
    })
    const total = deduplicated.length || 1
    return [
      { label: 'Wins',   color: 'var(--green)', count: stats.win,  pct: Math.round(stats.win / total * 100) },
      { label: 'Losses', color: 'var(--rose)',  count: stats.loss, pct: Math.round(stats.loss / total * 100) },
      { label: 'Draws',  color: 'var(--gold)',  count: stats.draw, pct: Math.round(stats.draw / total * 100) },
    ]
  })

  /** Opening performance breakdown from pastGames. */
  const openingStats = computed(() => {
    const openings: Record<string, { win: number, loss: number, draw: number }> = {}
    pastGames.value.forEach(g => {
      const op = g.opening || 'Unknown'
      if (!openings[op]) openings[op] = { win: 0, loss: 0, draw: 0 }
      if (g.result === 'win') openings[op].win++
      else if (g.result === 'loss') openings[op].loss++
      else openings[op].draw++
    })
    return Object.entries(openings).map(([name, s]) => {
      const total = s.win + s.loss + s.draw || 1
      return {
        name,
        games: total,
        winPct: Math.round(s.win / total * 100),
        lossPct: Math.round(s.loss / total * 100),
        drawPct: Math.round(s.draw / total * 100)
      }
    }).sort((a, b) => b.games - a.games)
  })

  /** Actual rating history derived from unique game results, with dates for filtering. */
  const ratingHistory = computed(() => {
    // Helper to handle various chess date formats (YYYY.MM.DD -> YYYY-MM-DD)
    const normalizeDate = (d: string) => {
      if (!d || d.includes('?')) return new Date().toISOString()
      const clean = d.replace(/\./g, '-')
      const p = new Date(clean)
      return isNaN(p.getTime()) ? new Date().toISOString() : p.toISOString()
    }

    let current = 1200
    const history: { date: string, rating: number }[] = []
    
    // Sort games by date and deduplicate by ID to ensure history is chronological and clean
    const uniqueIds = new Set<string>()
    const sorted = [...pastGames.value]
      .filter(g => {
        if (uniqueIds.has(g.id)) return false
        uniqueIds.add(g.id)
        return true
      })
      .sort((a, b) => new Date(normalizeDate(a.date)).getTime() - new Date(normalizeDate(b.date)).getTime())
    
    // Add base entry before any games
    if (sorted.length > 0) {
      const firstDate = new Date(normalizeDate(sorted[0].date))
      firstDate.setDate(firstDate.getDate() - 1)
      history.push({ date: firstDate.toISOString(), rating: 1200 })
    } else {
      history.push({ date: new Date().toISOString(), rating: 1200 })
    }

    sorted.forEach(g => {
      // Dynamic Elo-ish calculation based on result
      if (g.result === 'win') current += 15
      else if (g.result === 'loss') current -= 12
      else current += 2
      history.push({ date: normalizeDate(g.date), rating: current })
    })
    return history
  })

  /** The current calculated rating value. */
  const currentRating = computed(() => {
    const hist = ratingHistory.value
    return hist.length > 0 ? hist[hist.length - 1].rating : 1200
  })

  /** An actual 12-week activity heatmap based on games and puzzles. */
  const activityHeatmap = computed(() => {
    const weeks = 12
    const days = 7
    const heatmap = Array.from({ length: weeks }, () => Array(days).fill(0))
    
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - (weeks * 7))
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // Combine all activity sources
    const activities = [
      ...pastGames.value.map(g => g.date),
      ...puzzleAttempts.value.map(p => p.created_at)
    ]

    activities.forEach(dateStr => {
      if (!dateStr) return
      const d = new Date(dateStr)
      const diffTime = d.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < (weeks * 7)) {
        const weekIdx = Math.floor(diffDays / 7)
        const dayIdx = diffDays % 7
        heatmap[weekIdx][dayIdx]++
      }
    })

    return heatmap
  })

  /** Number of puzzles solved today (for progress bars). */
  const solvedToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return puzzleAttempts.value.filter(a => a.solved && a.created_at.slice(0, 10) === today).length
  })

  /** Consecutive days with at least one solved puzzle. */
  const currentStreak = computed(() => {
    const solved = puzzleAttempts.value.filter(a => a.solved)
    if (solved.length === 0) return 0
    const daySet = new Set<string>()
    solved.forEach(a => daySet.add(a.created_at.slice(0, 10)))
    let streak = 0
    const today = new Date()
    while (true) {
      const d = new Date(today)
      d.setDate(d.getDate() - streak)
      const dateStr = d.toISOString().slice(0, 10)
      if (daySet.has(dateStr)) {
        streak++
      } else {
        if (streak === 0) {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          if (daySet.has(yesterday.toISOString().slice(0, 10))) {
            let yStreak = 0
            while(true) {
              const yd = new Date(yesterday)
              yd.setDate(yd.getDate() - yStreak)
              if (daySet.has(yd.toISOString().slice(0, 10))) yStreak++
              else break
            }
            return yStreak
          }
        }
        break
      }
    }
    return streak
  })

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    session, profile, pastGames, puzzleAttempts, puzzleQueue,
    hearts, xp, streak, maxHearts,
    gauntletProgress, myIdentity, isMe, isAdmin,
    fetchUserData, submitPuzzleAttempt, submitGauntletResult,
    addXP, deductHeart,
    wldStats, openingStats, ratingHistory, currentRating,
    activityHeatmap, solvedToday, currentStreak
  }
})
