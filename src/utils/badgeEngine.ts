// badgeEngine.ts
// Evaluates all 4 badge pillars from live store data. Pure computation — no side effects.

import type { PastGame, PuzzleAttempt } from '../stores/userStore'

export type BadgePillar = 'milestone' | 'mastery' | 'ritual' | 'title'

export interface Badge {
  id: string
  label: string
  icon: string
  description: string
  pillar: BadgePillar
  earned: boolean
  progress?: number   // 0-1, for progress bar display
  progressLabel?: string
}

export interface ChessTitle {
  rank: number         // 0 = Pawn ... 6 = Grandmaster
  symbol: string
  label: string
  color: string
}

const TITLES: ChessTitle[] = [
  { rank: 0, symbol: '♟', label: 'Pawn',        color: 'rgba(255,255,255,0.4)' },
  { rank: 1, symbol: '♞', label: 'Knight',      color: '#60a5fa' },
  { rank: 2, symbol: '♝', label: 'Bishop',      color: '#34d399' },
  { rank: 3, symbol: '♜', label: 'Rook',        color: '#f59e0b' },
  { rank: 4, symbol: '♛', label: 'Queen',       color: '#a78bfa' },
  { rank: 5, symbol: '♚', label: 'King',        color: '#f87171' },
  { rank: 6, symbol: '✦', label: 'Grandmaster', color: '#fde68a' },
]

interface EvalInput {
  profile: { rating: number; puzzle_rating?: number } | null
  pastGames: PastGame[]
  puzzleAttempts: PuzzleAttempt[]
  archetype?: {
    category: string
    title: string
    missRate: number
    radarScores: Record<string, number>
  }
  xp?: number
  level?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function solvedCount(attempts: PuzzleAttempt[]) {
  return attempts.filter(a => a.solved).length
}

function solveRateForTheme(attempts: PuzzleAttempt[], theme: string) {
  const themed = attempts.filter(a => a.themes.some(t =>
    theme === 'tactics'
      ? ['mate', 'tactics', 'middlegame', 'backRankMate', 'smotheredMate'].includes(t)
      : t === theme
  ))
  if (themed.length < 5) return null  // not enough data
  return themed.filter(a => a.solved).length / themed.length
}

function avgSolveTime(attempts: PuzzleAttempt[]) {
  const solved = attempts.filter(a => a.solved && a.time_taken_seconds > 0)
  if (solved.length < 5) return null
  return solved.reduce((s, a) => s + a.time_taken_seconds, 0) / solved.length
}

function hasStreak(attempts: PuzzleAttempt[], days: number) {
  // Check if user has solved at least 1 puzzle on each of the last N consecutive days
  const solved = attempts.filter(a => a.solved)
  if (solved.length === 0) return false
  const daySet = new Set<string>()
  solved.forEach(a => daySet.add(a.created_at.slice(0, 10)))
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (!daySet.has(d.toISOString().slice(0, 10))) return false
  }
  return true
}

function hasHourPattern(attempts: PuzzleAttempt[], minHour: number, maxHour: number, count: number) {
  return attempts.filter(a => {
    const h = new Date(a.created_at).getHours()
    return h >= minHour && h < maxHour && a.solved
  }).length >= count
}

// ─── Pillar 1: Milestone Badges ───────────────────────────────────────────────

function milestoneBadges(input: EvalInput): Badge[] {
  const { profile, pastGames, puzzleAttempts } = input
  const wins = pastGames.filter(g => g.result === 'win').length
  const games = pastGames.length
  const solved = solvedCount(puzzleAttempts)
  const rating = profile?.puzzle_rating ?? 1200

  return [
    {
      id: 'first_win',
      label: 'First Blood',
      icon: '🎯',
      description: 'Win your first game',
      pillar: 'milestone',
      earned: wins >= 1,
      progress: Math.min(1, wins),
      progressLabel: `${wins}/1 wins`,
    },
    {
      id: 'games_10',
      label: 'Battle Tested',
      icon: '⚔️',
      description: 'Play 10 games',
      pillar: 'milestone',
      earned: games >= 10,
      progress: Math.min(1, games / 10),
      progressLabel: `${games}/10 games`,
    },
    {
      id: 'games_50',
      label: 'Seasoned Player',
      icon: '🏟️',
      description: 'Play 50 games',
      pillar: 'milestone',
      earned: games >= 50,
      progress: Math.min(1, games / 50),
      progressLabel: `${games}/50 games`,
    },
    {
      id: 'games_100',
      label: 'Centurion',
      icon: '💯',
      description: 'Play 100 games',
      pillar: 'milestone',
      earned: games >= 100,
      progress: Math.min(1, games / 100),
      progressLabel: `${games}/100 games`,
    },
    {
      id: 'puzzles_10',
      label: 'Pattern Seeker',
      icon: '🧩',
      description: 'Solve 10 puzzles',
      pillar: 'milestone',
      earned: solved >= 10,
      progress: Math.min(1, solved / 10),
      progressLabel: `${solved}/10 puzzles`,
    },
    {
      id: 'puzzles_100',
      label: 'Tactician',
      icon: '🔮',
      description: 'Solve 100 puzzles',
      pillar: 'milestone',
      earned: solved >= 100,
      progress: Math.min(1, solved / 100),
      progressLabel: `${solved}/100 puzzles`,
    },
    {
      id: 'rating_1400',
      label: 'Club Player',
      icon: '📈',
      description: 'Reach 1400 puzzle rating',
      pillar: 'milestone',
      earned: rating >= 1400,
      progress: Math.min(1, (rating - 1200) / 200),
      progressLabel: `${rating}/1400`,
    },
    {
      id: 'rating_1600',
      label: 'Sharp Mind',
      icon: '🧠',
      description: 'Reach 1600 puzzle rating',
      pillar: 'milestone',
      earned: rating >= 1600,
      progress: Math.min(1, (rating - 1200) / 400),
      progressLabel: `${rating}/1600`,
    },
    {
      id: 'rating_2000',
      label: 'Master Tactician',
      icon: '🏆',
      description: 'Reach 2000 puzzle rating',
      pillar: 'milestone',
      earned: rating >= 2000,
      progress: Math.min(1, (rating - 1200) / 800),
      progressLabel: `${rating}/2000`,
    },
  ]
}

// ─── Pillar 2: DNA Mastery Badges ─────────────────────────────────────────────

function masteryBadges(input: EvalInput): Badge[] {
  const { puzzleAttempts } = input
  const solved = solvedCount(puzzleAttempts)
  const endgameRate = solveRateForTheme(puzzleAttempts, 'endgame')
  const tacticsRate = solveRateForTheme(puzzleAttempts, 'tactics')
  const openingRate = solveRateForTheme(puzzleAttempts, 'opening')
  const avgTime = avgSolveTime(puzzleAttempts)
  const hintless = puzzleAttempts.filter(a => a.solved && a.hints_used === 0 && a.attempts === 1).length

  return [
    {
      id: 'endgame_surgeon',
      label: 'Endgame Surgeon',
      icon: '🔬',
      description: '80%+ solve rate on endgame puzzles (min 20 attempts)',
      pillar: 'mastery',
      earned: endgameRate !== null && endgameRate >= 0.8,
      progress: endgameRate ?? 0,
      progressLabel: endgameRate ? `${Math.round(endgameRate * 100)}% endgame rate` : 'Need 5+ endgame puzzles',
    },
    {
      id: 'tactics_master',
      label: 'Tactical Vision',
      icon: '⚡',
      description: '75%+ solve rate on tactical puzzles',
      pillar: 'mastery',
      earned: tacticsRate !== null && tacticsRate >= 0.75,
      progress: tacticsRate ?? 0,
      progressLabel: tacticsRate ? `${Math.round(tacticsRate * 100)}% tactics rate` : 'Need 5+ tactics puzzles',
    },
    {
      id: 'opening_scholar',
      label: 'Opening Scholar',
      icon: '📖',
      description: '75%+ solve rate on opening puzzles',
      pillar: 'mastery',
      earned: openingRate !== null && openingRate >= 0.75,
      progress: openingRate ?? 0,
      progressLabel: openingRate ? `${Math.round(openingRate * 100)}% opening rate` : 'Need 5+ opening puzzles',
    },
    {
      id: 'speed_demon',
      label: 'Speed Demon',
      icon: '💨',
      description: 'Average puzzle solve time under 15 seconds',
      pillar: 'mastery',
      earned: avgTime !== null && avgTime <= 15,
      progress: avgTime ? Math.max(0, 1 - (avgTime - 5) / 25) : 0,
      progressLabel: avgTime ? `${Math.round(avgTime)}s avg (target: 15s)` : 'Need 5+ solved puzzles',
    },
    {
      id: 'pure_genius',
      label: 'Pure Genius',
      icon: '🎯',
      description: 'Solve 25 puzzles with no hints and on the first attempt',
      pillar: 'mastery',
      earned: hintless >= 25,
      progress: Math.min(1, hintless / 25),
      progressLabel: `${hintless}/25 flawless solves`,
    },
    {
      id: 'volume_solver',
      label: 'Grinder',
      icon: '⚙️',
      description: 'Attempt 200 total puzzles',
      pillar: 'mastery',
      earned: solved >= 200,
      progress: Math.min(1, solved / 200),
      progressLabel: `${solved}/200 puzzles`,
    },
  ]
}

// ─── Pillar 3: Streak & Ritual Badges ─────────────────────────────────────────

function ritualBadges(input: EvalInput): Badge[] {
  const { puzzleAttempts } = input

  return [
    {
      id: 'streak_3',
      label: 'On a Roll',
      icon: '🔥',
      description: 'Solve puzzles for 3 consecutive days',
      pillar: 'ritual',
      earned: hasStreak(puzzleAttempts, 3),
      progress: hasStreak(puzzleAttempts, 3) ? 1 : hasStreak(puzzleAttempts, 1) ? 0.33 : 0,
      progressLabel: '3-day streak',
    },
    {
      id: 'streak_7',
      label: 'Iron Will',
      icon: '💪',
      description: 'Solve puzzles for 7 consecutive days',
      pillar: 'ritual',
      earned: hasStreak(puzzleAttempts, 7),
      progress: hasStreak(puzzleAttempts, 7) ? 1 : hasStreak(puzzleAttempts, 3) ? 0.5 : 0,
      progressLabel: '7-day streak',
    },
    {
      id: 'midnight_tactician',
      label: 'Midnight Tactician',
      icon: '🌙',
      description: 'Solve 10 puzzles after midnight',
      pillar: 'ritual',
      earned: hasHourPattern(puzzleAttempts, 0, 4, 10),
      progress: Math.min(1, hasHourPattern(puzzleAttempts, 0, 4, 1) ? 0.1 : 0),
      progressLabel: `${puzzleAttempts.filter(a => { const h = new Date(a.created_at).getHours(); return h >= 0 && h < 4 && a.solved }).length}/10 midnight solves`,
    },
    {
      id: 'dawn_patrol',
      label: 'Dawn Patrol',
      icon: '🌅',
      description: 'Solve 5 puzzles before 8am',
      pillar: 'ritual',
      earned: hasHourPattern(puzzleAttempts, 5, 8, 5),
      progress: Math.min(1, puzzleAttempts.filter(a => { const h = new Date(a.created_at).getHours(); return h >= 5 && h < 8 && a.solved }).length / 5),
      progressLabel: `${puzzleAttempts.filter(a => { const h = new Date(a.created_at).getHours(); return h >= 5 && h < 8 && a.solved }).length}/5 early solves`,
    },
    {
      id: 'lunchbreak',
      label: 'Lunchbreak GM',
      icon: '🥪',
      description: 'Solve 15 puzzles between noon and 1pm',
      pillar: 'ritual',
      earned: hasHourPattern(puzzleAttempts, 12, 13, 15),
      progress: Math.min(1, puzzleAttempts.filter(a => { const h = new Date(a.created_at).getHours(); return h >= 12 && h < 13 && a.solved }).length / 15),
      progressLabel: `${puzzleAttempts.filter(a => { const h = new Date(a.created_at).getHours(); return h >= 12 && h < 13 && a.solved }).length}/15 lunch solves`,
    },
  ]
}

// ─── Pillar 4: Archetype & Persona Badges ─────────────────────────────────────

function archetypeBadges(input: EvalInput): Badge[] {
  const { archetype, pastGames } = input
  if (!archetype) return []

  const scores = archetype.radarScores
  const games = pastGames.length

  return [
    {
      id: 'versatile_general',
      label: 'Versatile General',
      icon: '🛡️',
      description: 'Achieve a balanced "Mixed" playstyle with 10+ games',
      pillar: 'title',
      earned: archetype.category === 'mixed' && games >= 10,
      progress: archetype.category === 'mixed' ? 1 : 0,
      progressLabel: archetype.category === 'mixed' ? 'Identity Unlocked' : 'Keep playing',
    },
    {
      id: 'theory_master',
      label: 'Theory Master',
      icon: '🧙‍♂️',
      description: 'Achieve 0.9+ score in Opening Theory',
      pillar: 'title',
      earned: scores.opening >= 0.9,
      progress: scores.opening,
      progressLabel: `${Math.round(scores.opening * 100)}% theory`,
    },
    {
      id: 'tactical_beast',
      label: 'Tactical Beast',
      icon: '👹',
      description: 'Achieve 0.9+ score in Tactical Vision',
      pillar: 'title',
      earned: scores.tactics >= 0.9,
      progress: scores.tactics,
      progressLabel: `${Math.round(scores.tactics * 100)}% vision`,
    },
    {
      id: 'endgame_grinder',
      label: 'Endgame Grinder',
      icon: '🧱',
      description: 'Achieve 0.9+ score in Endgame Technique',
      pillar: 'title',
      earned: scores.endgame >= 0.9,
      progress: scores.endgame,
      progressLabel: `${Math.round(scores.endgame * 100)}% technique`,
    },
  ]
}

// ─── Pillar 4: Tiered Title ────────────────────────────────────────────────────

export function computeTitle(input: EvalInput, masteryCount: number): ChessTitle {
  const { profile, pastGames, xp = 0, level = 1 } = input
  const games = pastGames.length
  const rating = profile?.rating ?? 0
  const puzzleRating = profile?.puzzle_rating ?? 0

  if (games >= 500 && rating >= 2000 && puzzleRating >= 1800 && level >= 50) return TITLES[6]
  if (games >= 200 && rating >= 1700 && puzzleRating >= 1600 && masteryCount >= 8 && level >= 20) return TITLES[5]
  if (games >= 100 && rating >= 1500 && puzzleRating >= 1400 && masteryCount >= 5 && level >= 10) return TITLES[4]
  if (games >= 50  && rating >= 1400 && puzzleRating >= 1300 && masteryCount >= 3 && level >= 5) return TITLES[3]
  if (games >= 25  && puzzleRating >= 1300 && masteryCount >= 1 && level >= 3) return TITLES[2]
  if (games >= 10  && puzzleRating >= 1200 && level >= 2) return TITLES[1]
  return TITLES[0]
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function evaluateBadges(input: EvalInput): {
  badges: Badge[]
  title: ChessTitle
  earnedCount: number
  totalCount: number
} {
  const milestone = milestoneBadges(input)
  const mastery   = masteryBadges(input)
  const ritual    = ritualBadges(input)
  const arch      = archetypeBadges(input)
  const badges    = [...milestone, ...mastery, ...ritual, ...arch]
  const masteryEarned = mastery.filter(b => b.earned).length
  const title     = computeTitle(input, masteryEarned)

  return {
    badges,
    title,
    earnedCount: badges.filter(b => b.earned).length,
    totalCount: badges.length,
  }
}

export { TITLES }
