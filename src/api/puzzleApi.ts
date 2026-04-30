import puzzlesData from '../data/puzzles.json'
import { supabase } from './supabaseClient'
import { logger } from '../utils/logger'
import { Chess as ChessEngine } from 'chess.js'

export interface Puzzle {
  id: string
  title: string
  rating: number
  themes: string[]
  fen: string
  fen_before?: string
  lastMove: string
  solution: string[]
  category: string
  explanation?: string // Optional coaching insight for personal puzzles
  severity?: 'blunder' | 'mistake' | 'inaccuracy'
}

const puzzles = puzzlesData as Puzzle[]

export async function fetchRandomPuzzle(category?: string): Promise<Puzzle> {
  const batch = await fetchPuzzleBatch(category, 1)
  return batch[0]
}

/**
 * Fetches the "Daily Gauntlet" — a consistent set of 5 puzzles 
 * that is the same for every user on a given day.
 */
export async function fetchDailyGauntlet(): Promise<Puzzle[]> {
  const today = new Date().toISOString().split('T')[0];
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = (seed << 5) - seed + today.charCodeAt(i);
    seed |= 0; 
  }

  const totalPuzzles = puzzles.length;
  const startIndex = Math.abs(seed) % totalPuzzles;
  const gauntlet: Puzzle[] = [];
  for (let i = 0; i < 5; i++) {
    const index = (startIndex + i) % totalPuzzles;
    gauntlet.push(puzzles[index]);
  }
  return new Promise((resolve) => setTimeout(() => resolve(gauntlet), 300));
}

/**
 * Fetches a batch of puzzles, prioritizing personal drills if requested.
 */
export async function fetchPuzzleBatch(category?: string, count: number = 3): Promise<Puzzle[]> {
  if (category === 'Personal Mistake') {
    return fetchPersonalPuzzles(count)
  }

  await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
  let pool = puzzles
  if (category && category !== 'mixed') {
    pool = puzzles.filter(p => p.category === category)
    if (pool.length === 0) pool = puzzles
  }
  
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Fetches the specific puzzle by ID, with support for personalized Shadow Realm drills.
 */
export async function fetchPuzzleById(id: string): Promise<Puzzle | null> {
  if (id.startsWith('personal-')) {
    return fetchPersonalPuzzleById(id)
  }

  await new Promise(r => setTimeout(r, 100))
  return puzzles.find(p => p.id === id) || null
}

/**
 * Parses a personal puzzle ID and fetches its metadata from the coaching_cache.
 */
export async function fetchPersonalPuzzleById(id: string): Promise<Puzzle | null> {
  const parts = id.split('-')
  // ID format: personal-GUID-INDEX
  // GUID is parts[1..5], INDEX is parts[6]
  const matchId = parts.slice(1, 6).join('-')
  const moveIndex = parseInt(parts[6])

  if (!matchId || isNaN(moveIndex)) {
    logger.error(`[PuzzleAPI] Invalid personal puzzle ID: ${id}`)
    return null
  }

  const { data, error } = await supabase
    .from('coaching_cache')
    .select('*')
    .contains('metadata', { match_id: matchId, move_index: moveIndex })
    .maybeSingle()

  if (error) {
    logger.error(`[PuzzleAPI] Failed to fetch personal puzzle ${id}:`, error.message, error.details)
    return null
  }

  if (!data) {
    logger.warn(`[PuzzleAPI] Personal puzzle ${id} not found in cache.`)
    return null
  }

  // Tactical Validation: Ensure the solution is actually legal in the starting FEN.
  // This prevents 'Ghost Drills' caused by harvesting off-by-one errors.
  try {
    const validator = new ChessEngine(data.fen)
    const bestMove = data.metadata?.best_move
    if (bestMove) {
      const result = validator.move(bestMove)
      if (!result) {
        logger.error(`[PuzzleAPI] Corrupt drill detected: ${id}. Illegal move '${bestMove}' for FEN ${data.fen}. Auto-skipping.`)
        return null
      }
    }
  } catch (e) {
    logger.error(`[PuzzleAPI] Validation failed for ${id}:`, e)
    return null
  }

  return {
    id,
    title: data.theme || 'Personal Mistake',
    rating: data.metadata?.eval_drop ? Math.round(1500 - data.metadata.eval_drop * 100) : 1500,
    themes: ['Personal', data.theme, data.mistake_type],
    fen: data.fen,
    lastMove: '', // We could derive this from PGN if needed
    solution: [data.metadata?.best_move],
    category: 'Personal Mistake',
    explanation: data.explanation_text,
    severity: data.metadata?.severity
  }
}

/**
 * Fetches a batch of personal puzzles for the current user.
 */
async function fetchPersonalPuzzles(count: number): Promise<Puzzle[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get due items from the queue
  const { data: queueItems, error: qError } = await supabase
    .from('puzzle_queue')
    .select('puzzle_id')
    .eq('user_id', user.id)
    .order('next_review', { ascending: true })
    .limit(count)

  if (qError || !queueItems) return []

  const puzzles: Puzzle[] = []
  for (const item of queueItems) {
    const p = await fetchPuzzleById(item.puzzle_id)
    if (p) puzzles.push(p)
  }

  return puzzles
}

export async function fetchMultiplePuzzlesById(ids: string[]): Promise<Puzzle[]> {
  const results: Puzzle[] = []
  for (const id of ids) {
    const p = await fetchPuzzleById(id)
    if (p) results.push(p)
  }
  return results
}
