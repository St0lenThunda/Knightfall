import puzzlesData from '../data/puzzles.json'
import assessmentPuzzlesData from '../data/assessmentPuzzles.json'
import { supabase } from './supabaseClient'
import { logger } from '../utils/logger'
import { Chess as ChessEngine } from 'chess.js'
import { Storage, StorageKey } from '../utils/storage'

export interface Puzzle {
  id: string
  stage?: string // For assessment puzzles
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
const assessmentPuzzles = assessmentPuzzlesData as Puzzle[]

/**
 * Validates that all moves in a puzzle solution are legal in the starting FEN.
 * Returns true if valid, false if corrupt.
 */
function isPuzzleLegal(puzzle: Puzzle): boolean {
  try {
    const engine = new ChessEngine(puzzle.fen)
    for (const move of puzzle.solution) {
      const result = engine.move(move)
      if (!result) return false
    }
    return true
  } catch (e) {
    return false
  }
}

export async function fetchAssessmentPuzzles(stage: string): Promise<Puzzle[]> {
  logger.info(`[PuzzleAPI] Fetching assessment stage: ${stage}. Total pool size: ${assessmentPuzzles.length}`)
  
  // Safety filter: Ensure we only pick puzzles that have a stage property 
  // and match the requested stage.
  const filtered = assessmentPuzzles.filter(p => p.stage && p.stage === stage)
  
  logger.info(`[PuzzleAPI] Found ${filtered.length} puzzles for ${stage}`)
  return filtered
}

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
  
  let offset = 0;
  // Attempt to find 5 valid puzzles starting from startIndex
  while (gauntlet.length < 5 && offset < totalPuzzles) {
    const index = (startIndex + offset) % totalPuzzles;
    const p = puzzles[index];
    if (isPuzzleLegal(p)) {
      gauntlet.push(p);
    } else {
      logger.error(`[PuzzleAPI] Daily Gauntlet: Skipping corrupt puzzle ${p.id} at index ${index}`);
    }
    offset++;
  }
  
  return new Promise((resolve) => setTimeout(() => resolve(gauntlet), 300));
}

/**
 * Fetches a batch of puzzles, prioritizing personal drills if requested.
 * Every puzzle is validated for legality before being returned.
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
  
  const validPuzzles: Puzzle[] = []
  const shuffledPool = [...pool].sort(() => 0.5 - Math.random())
  
  for (const p of shuffledPool) {
    if (validPuzzles.length >= count) break
    if (isPuzzleLegal(p)) {
      validPuzzles.push(p)
    } else {
      logger.error(`[PuzzleAPI] Skipping corrupt puzzle ${p.id} (${p.title})`)
    }
  }

  return validPuzzles
}

/**
 * Fetches the specific puzzle by ID, with support for personalized Shadow Realm drills.
 */
export async function fetchPuzzleById(id: string): Promise<Puzzle | null> {
  if (id.startsWith('personal-')) {
    return fetchPersonalPuzzleById(id)
  }

  await new Promise(r => setTimeout(r, 100))
  const puzzle = puzzles.find(p => p.id === id) || null
  
  if (puzzle && !isPuzzleLegal(puzzle)) {
    logger.error(`[PuzzleAPI] Static puzzle ${id} is corrupt (illegal solution). Skipping.`)
    return null
  }
  
  return puzzle
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

  const puzzle: Puzzle = {
    id,
    title: data.theme || 'Personal Mistake',
    rating: data.metadata?.eval_drop ? Math.round(1500 - data.metadata.eval_drop * 100) : 1500,
    themes: ['Personal', data.theme, data.mistake_type],
    fen: data.fen,
    lastMove: '', 
    solution: [data.metadata?.best_move],
    category: 'Personal Mistake',
    explanation: data.explanation_text,
    severity: data.metadata?.severity
  }

  if (!isPuzzleLegal(puzzle)) {
    logger.error(`[PuzzleAPI] Personal drill ${id} is corrupt (illegal solution). Skipping.`)
    return null
  }

  return puzzle
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

/**
 * Fetches the daily puzzle from Lichess.
 * Checks local storage cache first to avoid redundant API queries.
 * If cached puzzle exists and matches today's date, it returns the cached puzzle.
 * Otherwise, it fetches from the Lichess API, validates the puzzle legality,
 * saves to local cache, and returns the formatted Puzzle.
 * 
 * @returns Promise<Puzzle | null> - The Lichess daily puzzle or null if it fails
 */
export async function fetchLichessDaily(): Promise<Puzzle | null> {
  // Extract today's date in YYYY-MM-DD format (local time zone representation)
  const today = new Date().toISOString().split('T')[0]
  
  // 1. Check local cache first to see if we already downloaded it today
  const cachedDate = Storage.get<string>(StorageKey.LICHESS_DAILY_FETCH_DATE, '')
  const cachedPuzzle = Storage.get<Puzzle | null>(StorageKey.LICHESS_DAILY_PUZZLE, null)
  
  // If the cached date matches today's date and we have a valid puzzle object, return it
  if (cachedDate === today && cachedPuzzle) {
    logger.info('[PuzzleAPI] Loading Lichess Daily Puzzle from local cache.')
    return cachedPuzzle
  }
  
  logger.info('[PuzzleAPI] Fetching Lichess Daily Puzzle from Lichess API...')
  try {
    const response = await fetch('https://lichess.org/api/puzzle/daily')
    if (!response.ok) {
      logger.error(`[PuzzleAPI] Lichess Daily API call failed: ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    if (!data || !data.puzzle || !data.game) {
      logger.error('[PuzzleAPI] Invalid Lichess daily puzzle payload structure.')
      return null
    }
    
    // Map Lichess response schema to Knightfall's Puzzle schema
    const puzzle: Puzzle = {
      id: `lichess-${data.puzzle.id}`,
      title: 'Lichess Daily Puzzle',
      rating: data.puzzle.rating,
      themes: data.puzzle.themes || [],
      fen: data.game.fen,
      lastMove: data.puzzle.initialMove || '',
      solution: data.puzzle.solution,
      category: 'External'
    }
    
    // Validate the solution moves to ensure the position isn't corrupt/illegal
    if (!isPuzzleLegal(puzzle)) {
      logger.error(`[PuzzleAPI] Fetched Lichess Daily Puzzle ${puzzle.id} is corrupt (illegal solution).`)
      return null
    }
    
    // Save to local cache to prevent duplicate fetches today
    Storage.set(StorageKey.LICHESS_DAILY_FETCH_DATE, today)
    Storage.set(StorageKey.LICHESS_DAILY_PUZZLE, puzzle)
    
    return puzzle
  } catch (err) {
    logger.error('[PuzzleAPI] Exception during Lichess Daily Puzzle fetch:', err)
    return null
  }
}

