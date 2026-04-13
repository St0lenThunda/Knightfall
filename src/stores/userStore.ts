import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import { evaluateBadges } from '../utils/badgeEngine'


export interface PastGame {
  id: string
  opponent: string
  result: 'win' | 'loss' | 'draw'
  mistakes: string[]
  control: string
  opening: string
  score: string
}

export interface PuzzleAttempt {
  id: string
  puzzle_id: string
  solved: boolean
  attempts: number
  time_taken_seconds: number
  hints_used: number
  themes: string[]
  created_at: string
}

export interface QueuedPuzzle {
  puzzle_id: string
  next_review: string
  interval_days: number
  ease_factor: number
  repetition: number
}

export const useUserStore = defineStore('user', () => {
  const session = ref<any>(null)
  const profile = ref<{ id: string, username: string, rating: number, puzzle_rating?: number, location?: string, avatar_url?: string } | null>(null)
  const pastGames = ref<PastGame[]>([])
  const puzzleAttempts = ref<PuzzleAttempt[]>([])
  const puzzleQueue = ref<QueuedPuzzle[]>([])

  async function fetchUserData() {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    session.value = currentSession
    
    if (session.value) {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.value.user.id)
        .maybeSingle()

      if (profError) {
        console.error('[fetchUserData] profile fetch error:', profError)
      }

      if (prof) {
        profile.value = prof
      } else {
        // No profile row yet — create one automatically
        const defaultUsername = session.value.user.email?.split('@')[0] ?? 'Player'
        const { data: created } = await supabase
          .from('profiles')
          .upsert({
            id: session.value.user.id,
            username: defaultUsername,
            rating: 1200,
            puzzle_rating: 1200,
          })
          .select()
          .maybeSingle()
        if (created) profile.value = created
      }

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`white_id.eq.${session.value.user.id},black_id.eq.${session.value.user.id}`)
        
      if (matches) {
        pastGames.value = matches.map((m: any) => {
          const isWhite = m.white_id === session.value.user.id
          let resultStr: PastGame['result'] = 'draw'
          if (m.result && m.result.startsWith('1-0')) resultStr = isWhite ? 'win' : 'loss'
          else if (m.result && m.result.startsWith('0-1')) resultStr = isWhite ? 'loss' : 'win'
          
          return {
            id: m.id,
            opponent: 'Unknown',
            result: resultStr,
            mistakes: [],
            control: 'Unknown',
            opening: 'Unknown',
            score: ''
          }
        })
      }

      // Fetch Puzzle Attempts
      const { data: attempts } = await supabase
        .from('puzzle_attempts')
        .select('*')
        .eq('user_id', session.value.user.id)
        .order('created_at', { ascending: false })
      
      if (attempts) puzzleAttempts.value = attempts

      // Fetch Puzzle Queue
      const { data: queue } = await supabase
        .from('puzzle_queue')
        .select('*')
        .eq('user_id', session.value.user.id)
      
      if (queue) puzzleQueue.value = queue

    } else {
      profile.value = null
      pastGames.value = []
      puzzleAttempts.value = []
      puzzleQueue.value = []
    }
  }

  // Calculate ELO Rating update based on Standard expected probability
  async function submitPuzzleAttempt(puzzleId: string, puzzleRating: number, solved: boolean, attempts: number, timeTaken: number, hintsUsed: number, themes: string[]) {
    if (!profile.value) return

    // 1. ELO Update
    const playerRating = profile.value.puzzle_rating || 1200
    const K = 32 // Elo K-factor
    const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400))
    const actualScore = solved ? 1 : 0
    
    let scoreMultiplier = 1
    if (solved) {
      if (hintsUsed > 0) scoreMultiplier *= 0.5
      if (attempts > 1) scoreMultiplier *= 0.8
    }
    
    const ratingChange = Math.round(K * ((actualScore * scoreMultiplier) - expectedScore))
    const newRating = Math.max(100, playerRating + ratingChange)

    // 2. SM-2 Spaced Repetition Logic (Chess-focused)
    const existing = puzzleQueue.value.find(q => q.puzzle_id === puzzleId)
    let quality = 0
    if (solved) {
      if (attempts === 1 && hintsUsed === 0) quality = 5
      else if (hintsUsed > 0) quality = 3
      else quality = 4
    }

    let interval = 0
    let ease = existing?.ease_factor ?? 2.5
    let repetition = existing?.repetition ?? 0
    let nextReviewDate = new Date()

    if (quality >= 3) {
      // Success
      if (repetition === 0) interval = 1
      else if (repetition === 1) interval = 3 // Rapid reinforcement
      else interval = Math.ceil((existing?.interval_days || 1) * ease)
      
      repetition++
      ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    } else {
      // Failure - "Chess-focused" immediate review (4 hours)
      repetition = 0
      interval = 0
      nextReviewDate.setHours(nextReviewDate.getHours() + 4)
    }
    
    if (ease < 1.3) ease = 1.3
    if (interval > 0) {
      nextReviewDate.setDate(nextReviewDate.getDate() + interval)
    }

    const updatedQueueItem: QueuedPuzzle = {
      puzzle_id: puzzleId,
      next_review: nextReviewDate.toISOString(),
      interval_days: interval,
      ease_factor: ease,
      repetition: repetition
    }

    // 3. Optimistic UI Update
    profile.value.puzzle_rating = newRating
    
    const qIdx = puzzleQueue.value.findIndex(q => q.puzzle_id === puzzleId)
    if (qIdx > -1) puzzleQueue.value[qIdx] = updatedQueueItem
    else puzzleQueue.value.push(updatedQueueItem)

    puzzleAttempts.value.unshift({
      id: crypto.randomUUID(),
      puzzle_id: puzzleId,
      solved,
      attempts,
      time_taken_seconds: timeTaken,
      hints_used: hintsUsed,
      themes,
      created_at: new Date().toISOString()
    })
    
    // 4. Persistence
    supabase.from('puzzle_attempts').insert({
      user_id: profile.value.id,
      puzzle_id: puzzleId,
      solved,
      attempts,
      time_taken_seconds: timeTaken,
      hints_used: hintsUsed,
      themes
    }).then()

    supabase.from('profiles').update({ puzzle_rating: newRating }).eq('id', profile.value.id).then()

    supabase.from('puzzle_queue').upsert({
      user_id: profile.value.id,
      puzzle_id: puzzleId,
      next_review: updatedQueueItem.next_review,
      interval_days: updatedQueueItem.interval_days,
      ease_factor: updatedQueueItem.ease_factor,
      repetition: updatedQueueItem.repetition
    }).then()
  }

  // Hook into supabase auth changes
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    fetchUserData()
  })

  const weaknessDna = computed(() => {
    const labels: Record<string, string> = {
      'endgame': 'endgame technique',
      'tactics': 'tactical vision',
      'opening': 'opening theory',
      'mixed': 'overall play'
    }
    const cats = ['endgame', 'tactics', 'opening', 'mixed']
    const scores: Record<string, number> = { endgame: 0, tactics: 0, opening: 0, mixed: 0 }

    // --- Signal 1: Puzzle failures (weight: 1.0 per failed theme tag) ---
    const failures = puzzleAttempts.value.filter(a => !a.solved)
    let puzzleTotal = 0
    failures.forEach(a => {
      a.themes.forEach(t => {
        const cat = ['endgame', 'opening'].includes(t) ? t
          : ['mate', 'tactics', 'middlegame', 'backRankMate', 'smotheredMate'].includes(t) ? 'tactics'
          : 'mixed'
        scores[cat] += 1.0
        puzzleTotal++
      })
    })

    // --- Signal 2: Game losses (weight: 2.0 — losses are more telling than puzzle failures) ---
    // We infer weakness category from the game's opening string & result.
    // Loss in an unrecognised opening → tactics/mixed weakness (hung a piece)
    // Loss where opening is known → opening weakness
    // Future: use moveCount or phase tags from matches table for endgame detection
    let gameTotal = 0
    pastGames.value.forEach(g => {
      if (g.result !== 'loss') return
      const op = (g.opening || '').toLowerCase()
      if (op && op !== 'unknown') {
        scores['opening'] += 2.0
        gameTotal += 2
      } else {
        // No opening tag → assume tactical blunder caused the loss
        scores['tactics'] += 2.0
        gameTotal += 2
      }
    })

    const totalSignal = puzzleTotal + gameTotal
    if (totalSignal === 0) return { category: 'mixed', label: labels['mixed'], missRate: 0 }

    // Pick the category with the highest combined score
    let topCat = 'mixed'
    let topScore = 0
    for (const cat of cats) {
      if (scores[cat] > topScore) { topScore = scores[cat]; topCat = cat }
    }

    const missRate = Math.round((topScore / totalSignal) * 100)

    return {
      category: topCat,
      label: labels[topCat] || topCat,
      missRate,
      // Expose full breakdown for future radar chart use
      breakdown: cats.map(c => ({ cat: c, label: labels[c], score: scores[c] }))
    }
  })

  const wldStats = computed(() => {
    const stats = { win: 0, loss: 0, draw: 0 }
    pastGames.value.forEach(g => stats[g.result]++)
    const total = pastGames.value.length || 1
    return [
      { label: 'Wins',   color: 'var(--green)', count: stats.win,  pct: Math.round(stats.win / total * 100) },
      { label: 'Losses', color: 'var(--rose)',  count: stats.loss, pct: Math.round(stats.loss / total * 100) },
      { label: 'Draws',  color: 'var(--gold)',  count: stats.draw, pct: Math.round(stats.draw / total * 100) },
    ]
  })

  const openingStats = computed(() => {
    const openings: Record<string, { win: number, loss: number, draw: number }> = {}
    pastGames.value.forEach(g => {
      if (!openings[g.opening]) openings[g.opening] = { win: 0, loss: 0, draw: 0 }
      openings[g.opening][g.result]++
    })

    return Object.entries(openings).map(([name, stats]) => {
      const games = stats.win + stats.loss + stats.draw
      return {
        name,
        games,
        winPct: Math.round(stats.win / games * 100),
        drawPct: Math.round(stats.draw / games * 100),
        lossPct: Math.round(stats.loss / games * 100)
      }
    }).sort((a, b) => b.games - a.games)
  })

  const ratingHistory = ref([1200])
  const currentRating = computed(() => {
    if (profile.value) return profile.value.rating
    return 1200
  })

  // To make the heatmap deterministic based on current games played simulation
  const activityHeatmap = computed(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
    const baseSeed = pastGames.value.length
    return Array.from({ length: 12 }, (_, wi) =>
      Array.from({ length: 7 }, (_, di) => seededRandom(wi * 7 + di + baseSeed) > 0.5 ? Math.floor(seededRandom(wi * 13 + di) * 8) : 0)
    )
  })

  const badges = computed(() => evaluateBadges({
    profile: profile.value,
    pastGames: pastGames.value,
    puzzleAttempts: puzzleAttempts.value,
  }))

  const solvedToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return puzzleAttempts.value.filter(a => a.solved && a.created_at.slice(0, 10) === today).length
  })

  const currentStreak = computed(() => {
    // Basic day-streak calculation
    const solved = puzzleAttempts.value.filter(a => a.solved)
    if (solved.length === 0) return 0
    
    const daySet = new Set<string>()
    solved.forEach(a => daySet.add(a.created_at.slice(0, 10)))
    
    let streak = 0
    const today = new Date()
    while (true) {
      const d = new Date(today)
      d.setDate(d.getDate() - streak)
      if (daySet.has(d.toISOString().slice(0, 10))) {
        streak++
      } else {
        // If today has no solve, try checking yesterday to see if streak is still "active"
        if (streak === 0) {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          if (daySet.has(yesterday.toISOString().slice(0, 10))) {
            // Streak is active from yesterday, but 0 today
            // For UI, we might want to show yesterday's streak? 
            // Usually streak = consecutive days including today OR ending yesterday.
            // Let's just return the count of consecutive days ending today or yesterday.
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

  return { session, profile, pastGames, puzzleAttempts, puzzleQueue, fetchUserData, submitPuzzleAttempt, weaknessDna, wldStats, openingStats, ratingHistory, currentRating, activityHeatmap, badges, solvedToday, currentStreak }
})
