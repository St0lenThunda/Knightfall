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
  evalDrop?: number // Optional evaluation drop in pawns/centipawns
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
 * Maps specific curriculum quest/trial IDs to their corresponding tactical/strategic/endgame themes and categories.
 * This ensures that when a user plays a specific lesson, they receive puzzles that directly reinforce
 * that lesson's targeted tactic (e.g. windmills, desperados, underpromotions) instead of random category puzzles.
 */
const QUEST_THEME_MAP: Record<string, { themes: string[], category: string }> = {
  // --- Tactics ---
  'forks-101': { themes: ['fork'], category: 'tactics' },
  'pins-101': { themes: ['pin'], category: 'tactics' },
  'skewers-101': { themes: ['skewer'], category: 'tactics' },
  'zwischenzug-301': { themes: ['intermezzo'], category: 'tactics' },
  'x-ray-101': { themes: ['xrayAttack'], category: 'tactics' },
  'smothered-mate': { themes: ['smotheredMate'], category: 'tactics' },
  'back-rank-mate': { themes: ['backRankMate'], category: 'tactics' },
  'greek-gift': { themes: ['sacrifice'], category: 'tactics' },
  'deflection-101': { themes: ['deflection'], category: 'tactics' },
  'clearance-101': { themes: ['clearance'], category: 'tactics' },
  'windmill-101': { themes: ['windmill'], category: 'tactics' },
  'double-check-101': { themes: ['doubleCheck'], category: 'tactics' },
  'desperado-101': { themes: ['desperado'], category: 'tactics' },
  'stalemate-combo': { themes: ['stalemate'], category: 'tactics' },
  'deflection-guards': { themes: ['deflection'], category: 'tactics' },
  'overloaded-pieces': { themes: ['overload'], category: 'tactics' },
  'king-hunt': { themes: ['kingHunt'], category: 'tactics' },

  // --- Positional / Strategy ---
  'outposts-201': { themes: ['outpost'], category: 'positional' },
  'weak-pawns-101': { themes: ['weakPawns'], category: 'positional' },
  'open-files-101': { themes: ['openFiles'], category: 'positional' },
  'minor-pieces-101': { themes: ['minorPieces'], category: 'positional' },
  'space-advantage-101': { themes: ['spaceAdvantage'], category: 'positional' },
  'prophylaxis-101': { themes: ['prophylaxis'], category: 'positional' },
  'pawn-chains-101': { themes: ['pawnChains'], category: 'positional' },
  'hanging-pawns-101': { themes: ['hangingPawns'], category: 'positional' },
  'isolani-101': { themes: ['isolani'], category: 'positional' },
  'carlsbad-101': { themes: ['carlsbadStructure'], category: 'positional' },
  'king-safety-mid': { themes: ['defense'], category: 'positional' },

  // --- Endgame ---
  'knight-endings': { themes: ['knightEndgame'], category: 'endgame' },
  'rook-endings': { themes: ['rookEndgame', 'lucena', 'philidor'], category: 'endgame' },
  'pawn-promotion': { themes: ['pawnPromotion', 'pawnEndgame'], category: 'endgame' },
  'opposition-201': { themes: ['opposition'], category: 'endgame' },
  'king-activity-101': { themes: ['kingActivity'], category: 'endgame' },
  'zugzwang-101': { themes: ['zugzwang'], category: 'endgame' },
  'triangulation-101': { themes: ['triangulation'], category: 'endgame' },
  'opposite-bishops-101': { themes: ['oppositeBishops'], category: 'endgame' },
  'lucena-position': { themes: ['lucenaPosition', 'lucena'], category: 'endgame' },
  'philidor-position': { themes: ['philidorPosition', 'philidor'], category: 'endgame' },
  'vancura-position': { themes: ['vancuraPosition'], category: 'endgame' },
  'kp-vs-k': { themes: ['kpEndgame'], category: 'endgame' },
  'queen-vs-pawn': { themes: ['queenVsPawn'], category: 'endgame' },
  'knight-vs-bishop': { themes: ['minorPieces'], category: 'endgame' },

  // --- Opening ---
  'e4-opening': { themes: ['centerControl'], category: 'opening' },
  'd4-opening': { themes: ['centerControl'], category: 'opening' },
  'sicilian-defense': { themes: ['sicilian'], category: 'opening' },
  'caro-kann': { themes: ['caroKann'], category: 'opening' },
  'french-defense': { themes: ['frenchDefense'], category: 'opening' },
  'ruy-lopez': { themes: ['ruyLopez'], category: 'opening' },
  'queens-gambit': { themes: ['queensGambit'], category: 'opening' },
  'kings-indian': { themes: ['kingsIndian'], category: 'opening' },
  'flank-openings': { themes: ['flankOpening'], category: 'opening' },
  'nimzo-indian': { themes: ['nimzoIndian'], category: 'opening' },
  'grunfeld-defense': { themes: ['grunfeldSetup', 'grunfeld'], category: 'opening' },
  'scandinavian': { themes: ['scandinavian'], category: 'opening' },
  'italian-game': { themes: ['italianGame'], category: 'opening' },
  'scotch-game': { themes: ['scotchGame'], category: 'opening' },
  'kings-gambit-op': { themes: ['kingsGambit'], category: 'opening' },
  'slav-defense': { themes: ['slavDefense'], category: 'opening' }
}

/**
 * Fetches a batch of puzzles, prioritizing personal drills if requested.
 * Supports filtering by a specific quest ID (which maps to specific themes)
 * or falls back to filtering by category.
 * 
 * @param filterKey - The quest ID or general category to filter by (e.g. 'double-check-101', 'tactics')
 * @param count - The maximum number of puzzles to retrieve in this batch (defaults to 3)
 * @returns Promise<Puzzle[]> - A list of legal puzzles matching the specified filter criteria
 */
export async function fetchPuzzleBatch(filterKey?: string, count: number = 3): Promise<Puzzle[]> {
  // Single Source of Truth: if the user wants their own mistake queue, delegate to fetchPersonalPuzzles
  if (filterKey === 'Personal Mistake') {
    return fetchPersonalPuzzles(count)
  }

  // Artificial delay to simulate network latency for a smoother, premium UI transition feel
  // We use a random duration between 200ms and 500ms
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300))

  let pool: Puzzle[] = []
  let generalCategory: string | null = null

  // 1. Theme-Specific Filtering
  // Check if the filterKey matches a known quest ID in our mappings
  if (filterKey && QUEST_THEME_MAP[filterKey]) {
    const mapping = QUEST_THEME_MAP[filterKey]
    generalCategory = mapping.category
    
    // Select puzzles that contain at least one of the specific target themes for this quest
    pool = puzzles.filter(p => p.themes.some(t => mapping.themes.includes(t)))
    logger.info(`[PuzzleAPI] Found ${pool.length} theme-specific puzzles for quest: ${filterKey}`)
  }

  // 2. Category-Wide Fallback
  // If we didn't find a quest mapping, or if the quest mapping returned no puzzles,
  // we fall back to filtering by category (or all puzzles if no category is specified)
  if (pool.length === 0) {
    let targetCat = filterKey ? filterKey.toLowerCase() : null
    
    // If the filterKey was a quest ID but had no specific puzzles, fall back to its general category
    if (!targetCat && generalCategory) {
      targetCat = generalCategory.toLowerCase()
    }

    if (targetCat && targetCat !== 'mixed') {
      pool = puzzles.filter(p => p.category.toLowerCase() === targetCat)
    }
    
    // If the category pool is still empty, fall back to the entire database pool
    if (pool.length === 0) {
      pool = puzzles
    }
  }

  const validPuzzles: Puzzle[] = []
  
  // Shuffle the selected pool randomly using a standard sorting comparator
  // so the user does not get the same sequence of puzzles every time
  const shuffledPool = [...pool].sort(() => 0.5 - Math.random())
  
  // 3. Legality Verification & Deduplication
  // Iterate through the shuffled pool and check that each puzzle's move sequence is 100% legal.
  for (const p of shuffledPool) {
    if (validPuzzles.length >= count) break
    
    if (isPuzzleLegal(p)) {
      validPuzzles.push(p)
    } else {
      logger.error(`[PuzzleAPI] Skipping corrupt puzzle ${p.id} (${p.title})`)
    }
  }

  // 4. Backfill from Broader Category (Deduplicated with Concept Safeguard)
  // If we couldn't find enough specific/theme-based puzzles to satisfy 'count',
  // we query the general category to fill the remaining slots.
  if (validPuzzles.length < count && generalCategory) {
    const fallbackCategory = generalCategory.toLowerCase()
    
    // First, filter out any puzzles that have already been selected
    const fallbackPool = puzzles.filter(p => 
      p.category.toLowerCase() === fallbackCategory && 
      !validPuzzles.some(vp => vp.id === p.id)
    )

    // Build a set of all themes mapped to other quests to protect them from generic bleed.
    // This represents the "physics" of our safeguard: if a puzzle is assigned to a specific
    // lesson (e.g. desperado, double check), we shouldn't show it as a generic fallback in
    // a different lesson unless we absolutely have no other choices.
    const otherMappedThemes = new Set<string>()
    Object.entries(QUEST_THEME_MAP).forEach(([key, val]) => {
      if (key !== filterKey) {
        val.themes.forEach(t => otherMappedThemes.add(t))
      }
    })

    // Separate the fallback pool into two tiers:
    // Tier 1: Generic puzzles that do not belong to any other specific quest theme
    // Tier 2: Specific puzzles that belong to other quest themes (only used as a last resort)
    const genericFallback = fallbackPool.filter(p => 
      !p.themes.some(t => otherMappedThemes.has(t))
    )
    const specificFallback = fallbackPool.filter(p => 
      p.themes.some(t => otherMappedThemes.has(t))
    )

    // Shuffle both pools independently to maintain randomness
    const shuffledGeneric = genericFallback.sort(() => 0.5 - Math.random())
    const shuffledSpecific = specificFallback.sort(() => 0.5 - Math.random())

    // Combine them, putting generic puzzles first to act as a shield against concept overlap
    const finalFallbackPool = [...shuffledGeneric, ...shuffledSpecific]
    
    for (const p of finalFallbackPool) {
      if (validPuzzles.length >= count) break
      
      if (isPuzzleLegal(p)) {
        validPuzzles.push(p)
      } else {
        logger.error(`[PuzzleAPI] Skipping corrupt fallback puzzle ${p.id} (${p.title})`)
      }
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
  if (!id.startsWith('personal-')) {
    logger.error(`[PuzzleAPI] Invalid personal puzzle ID (missing prefix): ${id}`)
    return null
  }

  const withoutPrefix = id.slice('personal-'.length)
  const lastHyphenIdx = withoutPrefix.lastIndexOf('-')

  if (lastHyphenIdx === -1) {
    logger.error(`[PuzzleAPI] Invalid personal puzzle ID (missing index delimiter): ${id}`)
    return null
  }

  const matchId = withoutPrefix.slice(0, lastHyphenIdx)
  const moveIndex = parseInt(withoutPrefix.slice(lastHyphenIdx + 1), 10)

  if (!matchId || isNaN(moveIndex)) {
    logger.error(`[PuzzleAPI] Invalid personal puzzle ID (empty components): ${id}`)
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

