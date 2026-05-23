import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import { Chess } from 'chess.js'
import { TaggingService } from '../services/taggingService'
import { useUserStore } from './userStore'
import { useUiStore } from './uiStore'
import { useLibraryStore } from './libraryStore'
import { logger } from '../utils/logger'

// --- Specialized Composables (Pillar Architecture) ---
import { useAssessmentEngine } from './curriculum/useAssessmentEngine'

/**
 * Represents a learning Quest in the curriculum (either a narrative Chronicle or a puzzle Trial).
 * Quests are grouped into Realms and displayed both in the list-based Sanctum and map-based Path.
 */
export interface Quest {
  id: string
  title: string
  description?: string
  category: 'Opening' | 'Tactics' | 'Endgame' | 'Positional'
  requirements: string[]
  icon: string
  status: 'locked' | 'unlocked' | 'completed'
  xp_reward: number
  realmId: string
  /**
   * Distinguishes chronicle (narrative-first foundational) quests from trial (puzzle-drill) quests.
   * Chronicle quests route to `/learn/:id`, trials route to `/lesson/:id`.
   */
  questType: 'chronicle' | 'trial'
}

export const useCurriculumStore = defineStore('curriculum', () => {
  const viewMode = ref<'overworld' | 'island'>('overworld')
  const selectedIslandId = ref<string | null>(null)

  const realms = ref([
    {
      id: 'foundations-realm',
      name: 'The Grand Threshold',
      icon: '🏛️',
      description: 'The ancient gates where you learn the origins and rules of the sacred chess game.',
      x: 400, y: 50,
      categories: ['Opening', 'Tactics', 'Positional']
    },
    { 
      id: 'tactics-realm', 
      name: 'The Iron Marches', 
      icon: '⚔️', 
      description: 'Where steel is sharpened and calculations are absolute.',
      x: 200, y: 150,
      categories: ['Tactics', 'Mate']
    },
    { 
      id: 'strategy-realm', 
      name: 'Highgarden Citadel', 
      icon: '🏰', 
      description: 'The seat of strategic wisdom and long-term planning.',
      x: 600, y: 200,
      categories: ['Positional']
    },
    { 
      id: 'endgame-realm', 
      name: 'The Silent Shores', 
      icon: '⏳', 
      description: 'The final destination where masters are made.',
      x: 400, y: 500,
      categories: ['Endgame']
    },
    { 
      id: 'opening-realm', 
      name: 'The Kings Landing', 
      icon: '🗺️', 
      description: 'The royal docks where every journey begins.',
      x: 100, y: 450,
      categories: ['Opening']
    },
    {
      id: 'personal-realm',
      name: 'The Shadow Realm',
      icon: '👤',
      description: 'The echoes of your own past — conquer your ghosts.',
      x: 350, y: 350,
      categories: ['Personal Mistake']
    }
  ])

  const quests = ref<Quest[]>([
    // ─── CHAPTER 0: THE GRAND GAME BEGINS (Foundations) ───
    // These 10 chronicle quests form the "Mentor's Path" — narrative-first lessons
    // for absolute beginners who have never played chess.
    { id: 'found-origins', title: 'Foundations: The Origin of Chess', category: 'Opening', requirements: [], icon: '♟️', status: 'unlocked', xp_reward: 30, questType: 'chronicle', realmId: 'foundations-realm' , description: "Welcome to the ancient game of kings. In this foundational lesson, you will learn the history of the board, the objective of the game, and how the armies are arranged before the first move is ever played." },
    { id: 'found-board', title: 'Foundations: The Board', category: 'Opening', requirements: ['found-origins'], icon: '🗺️', status: 'locked', xp_reward: 30, questType: 'chronicle', realmId: 'foundations-realm' , description: "The battlefield consists of 64 squares, alternating between light and dark. Mastering the coordinate system (ranks and files) is your first step toward true chess fluency." },
    { id: 'found-pawns', title: 'Foundations: The Pawns', category: 'Opening', requirements: ['found-board'], icon: '🪖', status: 'locked', xp_reward: 40, questType: 'chronicle', realmId: 'foundations-realm' , description: "Pawns are the soul of chess. They move forward but capture diagonally. Though weak individually, together they form the structural backbone of your entire army." },
    { id: 'found-knights', title: 'Foundations: The Knights', category: 'Opening', requirements: ['found-pawns'], icon: '♞', status: 'locked', xp_reward: 40, questType: 'chronicle', realmId: 'foundations-realm' , description: "Knights are the tricksters of the board. They move in an L-shape and are the only piece capable of jumping over other units. Their unpredictable movement makes them deadly in closed positions." },
    { id: 'found-bishops', title: 'Foundations: The Bishops', category: 'Opening', requirements: ['found-knights'], icon: '⛪', status: 'locked', xp_reward: 40, questType: 'chronicle', realmId: 'foundations-realm' , description: "Bishops are long-range snipers that are restricted to a single color complex for the entire game. A coordinated pair of bishops can slice across the board and dominate open diagonals." },
    { id: 'found-rooks', title: 'Foundations: The Rooks', category: 'Opening', requirements: ['found-bishops'], icon: '🏯', status: 'locked', xp_reward: 40, questType: 'chronicle', realmId: 'foundations-realm' , description: "Rooks are heavy artillery. They move horizontally and vertically without limit. In the endgame, a single active rook can be the deciding factor between a draw and a victory." },
    { id: 'found-queens', title: 'Foundations: The Queens', category: 'Opening', requirements: ['found-rooks'], icon: '👑', status: 'locked', xp_reward: 50, questType: 'chronicle', realmId: 'foundations-realm' , description: "The Queen combines the powers of the Rook and the Bishop, making her the most versatile and dangerous piece on the board. Use her wisely, and avoid bringing her out too early!" },
    { id: 'found-kings', title: 'Foundations: The Kings', category: 'Opening', requirements: ['found-queens'], icon: '🤴', status: 'locked', xp_reward: 50, questType: 'chronicle', realmId: 'foundations-realm' , description: "The King is the most important piece. He moves one square in any direction. The entire game revolves around ensuring his safety while hunting down the enemy monarch." },
    { id: 'found-check', title: 'Foundations: Check & Checkmate', category: 'Tactics', requirements: ['found-kings'], icon: '⚔️', status: 'locked', xp_reward: 60, questType: 'chronicle', realmId: 'foundations-realm' , description: "When the King is under attack, it is in 'Check'. If the King is in Check and cannot escape, block, or capture the attacker, it is 'Checkmate' and the game is over!" },
    { id: 'found-principles', title: 'Foundations: The 3 Core Principles', category: 'Positional', requirements: ['found-check'], icon: '🧠', status: 'locked', xp_reward: 75, questType: 'chronicle', realmId: 'foundations-realm' , description: "Control the center, develop your pieces actively, and get your king to safety. These three golden rules will guide you through the opening phase of any chess game." },

    // ─── CHAPTER 1: TACTICS ───
    // Requires completing the Foundations chapter before unlocking.
    { id: 'forks-101', title: 'Tactics: Forks', category: 'Tactics', requirements: ['found-principles'], icon: '🍴', status: 'locked', xp_reward: 50, questType: 'trial', realmId: 'tactics-realm' , description: "A fork is a devastating tactic where a single piece attacks two or more enemy targets simultaneously. Because the opponent can only make one move, they cannot save both targets, guaranteeing material gain. Knights and Pawns are especially notorious for executing deadly forks." },
    { id: 'pins-101', title: 'Tactics: Pins', category: 'Tactics', requirements: [], icon: '📍', status: 'completed', xp_reward: 50, questType: 'trial', realmId: 'tactics-realm' , description: "A pin occurs when an attacked piece cannot move without exposing a more valuable piece behind it. Absolute pins paralyze the target completely because moving would illegally expose the King to capture. This concept teaches you how to restrict enemy mobility and build crushing pressure." },
    { id: 'skewers-101', title: 'Tactics: Skewers', category: 'Tactics', requirements: ['forks-101'], icon: '🍢', status: 'unlocked', xp_reward: 50, questType: 'trial', realmId: 'tactics-realm' , description: "Often described as a 'reverse pin', a skewer attacks a highly valuable piece first. When that piece is forced to move away to safety, it exposes a lesser-valued piece behind it to capture. Rooks and Bishops excel at lining up these destructive geometrical attacks." },
    { id: 'outposts-201', title: 'Position: Outposts', category: 'Positional', requirements: ['pins-101'], icon: '🏰', status: 'locked', xp_reward: 75, questType: 'trial', realmId: 'strategy-realm' , description: "An outpost is a square on the board—typically protected by your own pawn and immune to enemy pawn attacks—where a piece (usually a Knight) can anchor itself deep in enemy territory. A well-placed outpost piece can paralyze the opponent’s entire position." },
    { id: 'zwischenzug-301', title: 'Expert: Zwischenzug', category: 'Tactics', requirements: ['skewers-101'], icon: '⚡', status: 'locked', xp_reward: 100, questType: 'trial', realmId: 'tactics-realm' , description: "Zwischenzug, or the 'in-between move', is a high-level tactical concept where, instead of playing the expected recapturing move, you interpose an unexpected, forcing threat (like a check). This disrupts the opponent's calculation and often flips the evaluation entirely." },
    { id: 'x-ray-101', title: 'Tactics: X-Ray', category: 'Tactics', requirements: ['zwischenzug-301'], icon: '🩻', status: 'locked', xp_reward: 50, questType: 'trial', realmId: 'tactics-realm' , description: "An X-Ray attack occurs when a long-range piece attacks a target *through* another piece. It often acts as a hidden defender for your own pieces, or unexpectedly slices through enemy lines. Seeing through the physical pieces on the board requires acute tactical vision." },
    { id: 'smothered-mate', title: 'Mate: Smothered', category: 'Tactics', requirements: ['x-ray-101'], icon: '🐎', status: 'locked', xp_reward: 80, questType: 'trial', realmId: 'tactics-realm' , description: "A smothered mate is a beautiful checkmate delivered exclusively by a Knight, where the enemy King is entirely blocked (smothered) by its own surrounding pieces and has no squares to escape. It often involves a dramatic Queen sacrifice to force the king into the trap." },
    { id: 'back-rank-mate', title: 'Mate: Back Rank', category: 'Tactics', requirements: ['smothered-mate'], icon: '🧱', status: 'locked', xp_reward: 60, questType: 'trial', realmId: 'tactics-realm' , description: "A back-rank mate exploits a King trapped behind its own defensive pawn shield on the 1st or 8th rank. By delivering a rook or queen check on that back rank, the King is doomed because it has no 'luft' (breathing room) to step forward." },
    { id: 'greek-gift', title: 'Sacrifice: Greek Gift', category: 'Tactics', requirements: ['back-rank-mate'], icon: '🎁', status: 'locked', xp_reward: 90, questType: 'trial', realmId: 'tactics-realm' , description: "The Greek Gift (Bxh7+ or Bxh2+) is a classic bishop sacrifice against a castled king. It shatters the pawn shield, dragging the King into the open where a follow-up attack by a Knight and Queen often leads to forced mate or decisive material gain." },
    { id: 'knight-endings', title: 'Endgame: Knights', category: 'Endgame', requirements: ['greek-gift'], icon: '🐴', status: 'locked', xp_reward: 70, questType: 'trial', realmId: 'endgame-realm' , description: "Knight endgames are notoriously tricky. Unlike bishops, knights are slow and cannot easily stop passed pawns on opposite sides of the board. You will learn how to maneuver your knight, blockade enemy pawns, and maximize its short-range agility." },
    { id: 'rook-endings', title: 'Endgame: Rooks', category: 'Endgame', requirements: ['knight-endings'], icon: '🏯', status: 'locked', xp_reward: 75, questType: 'trial', realmId: 'endgame-realm' , description: "Rook endgames are the most common in all of chess. Mastering concepts like the Philidor position (drawing technique), the Lucena position (winning technique), and active vs passive rooks is absolutely essential for tournament play." },
    { id: 'pawn-promotion', title: 'Endgame: Pawns', category: 'Endgame', requirements: ['rook-endings'], icon: '👑', status: 'locked', xp_reward: 65, questType: 'trial', realmId: 'endgame-realm' , description: "When the heavy pieces are traded off, the humble pawn becomes the star. In this lesson, you will learn how to create passed pawns, utilize the 'rule of the square', and safely escort your pawn to the end of the board to promote it into a Queen." },
    { id: 'opposition-201', title: 'Endgame: Opposition', category: 'Endgame', requirements: ['pawn-promotion'], icon: '⚖️', status: 'locked', xp_reward: 85, questType: 'trial', realmId: 'endgame-realm' , description: "Opposition is the fundamental concept of King-and-Pawn endgames. By placing your King directly opposite the enemy King with an odd number of squares between them, you force the opponent to step aside, gaining critical ground to support your pawns." },
    { id: 'e4-opening', title: 'Opening: King Pawn', category: 'Opening', requirements: ['opposition-201'], icon: '👑', status: 'locked', xp_reward: 50, questType: 'trial', realmId: 'opening-realm' , description: "The move 1.e4 is the most popular opening in chess history, leading to sharp, open, and tactical games. You will explore rapid piece development, immediate control of the center, and dynamic attacking structures." },
    { id: 'd4-opening', title: 'Opening: Queen Pawn', category: 'Opening', requirements: ['e4-opening'], icon: '👸', status: 'locked', xp_reward: 50, questType: 'trial', realmId: 'opening-realm' , description: "The move 1.d4 leads to rich, positional, and strategic battles. Because the pawn on d4 is already defended by the Queen, the resulting pawn structures are often more rigid, requiring deep maneuvering and long-term planning." },
    { id: 'sicilian-defense', title: 'Opening: Sicilian', category: 'Opening', requirements: ['d4-opening'], icon: '🐉', status: 'locked', xp_reward: 70, questType: 'trial', realmId: 'opening-realm' , description: "The Sicilian Defense (1.e4 c5) is Black's most combative response to e4. By striking at the center asymmetrically, Black creates imbalanced, double-edged positions where both sides have realistic chances of launching devastating king hunts." },
    { id: 'caro-kann', title: 'Opening: Caro-Kann', category: 'Opening', requirements: ['sicilian-defense'], icon: '🐢', status: 'locked', xp_reward: 65, questType: 'trial', realmId: 'opening-realm' , description: "The Caro-Kann Defense (1.e4 c6) is renowned for its absolute solidity. Black prepares to challenge the center with d5 while maintaining a resilient pawn structure. It requires patience, but rewards you with a nearly unbreakable endgame setup." },
    { id: 'french-defense', title: 'Opening: French', category: 'Opening', requirements: ['caro-kann'], icon: '🥖', status: 'locked', xp_reward: 60, questType: 'trial', realmId: 'opening-realm' , description: "The French Defense (1.e4 e6) immediately challenges White's central control. It often leads to blocked, closed pawn centers where play shifts to the flanks. Black accepts a cramped position temporarily in exchange for a rock-solid structure and potent counterattacks." },
    { id: 'ruy-lopez', title: 'Opening: Ruy Lopez', category: 'Opening', requirements: ['french-defense'], icon: '🇪🇸', status: 'locked', xp_reward: 75, questType: 'trial', realmId: 'opening-realm' , description: "The Ruy Lopez (1.e4 e5 2.Nf3 Nc6 3.Bb5) is the quintessential chess opening. Named after a 16th-century Spanish priest, it teaches deep positional understanding, sustained central tension, and the value of keeping pieces active." },
    { id: 'grandmaster-peak', title: 'The Peak', category: 'Tactics', requirements: ['ruy-lopez'], icon: '⛰️', status: 'locked', xp_reward: 250, questType: 'trial', realmId: 'tactics-realm' , description: "This is the ultimate test. You will face a grueling sequence of Master-level tactical puzzles combining pins, deflections, sacrifices, and deep calculation. Only the worthy will conquer The Peak." },
  ])

  const completedQuestIds = ref<string[]>([])

  /**
   * Fetches the user's completed quests from Supabase.
   * 
   * @param userId - The unique identifier of the user
   */
  async function fetchProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_skill_progress')
      .select('node_id')
      .eq('user_id', userId)
    
    if (!error && data) {
      completedQuestIds.value = data.map(d => d.node_id)
      updateQuestStatuses()
      generatePersonalLessons() // Refresh personalized content
    }
  }

  /**
   * Updates the locking and status state of all quests based on requirements.
   */
  function updateQuestStatuses() {
    quests.value.forEach(quest => {
      if (completedQuestIds.value.includes(quest.id)) {
        quest.status = 'completed'
      } else if (quest.requirements.every(reqId => completedQuestIds.value.includes(reqId))) {
        quest.status = 'unlocked'
      } else {
        quest.status = 'locked'
      }
    })
  }

  /**
   * Marks a quest as complete in Supabase, updates local state,
   * and bridges with user gamification to sync badges.
   * 
   * @param userId - The unique identifier of the user
   * @param questId - The unique identifier of the quest
   */
  /**
   * Marks a quest as complete in Supabase, updates local state,
   * awards the quest's specific XP reward, and updates local gamification badges.
   * 
   * @param userId - The unique identifier of the user
   * @param questId - The unique identifier of the quest
   */
  async function completeQuest(userId: string, questId: string) {
    // 1. Guard against duplicate completions to prevent infinite XP loops
    if (completedQuestIds.value.includes(questId)) {
      logger.info(`[Curriculum] Quest ${questId} is already completed. Skipping duplicate progress save.`)
      return
    }

    // 2. Persist completion to database
    const { error } = await supabase
      .from('user_skill_progress')
      .insert([{ user_id: userId, node_id: questId }])
    
    if (!error) {
      // 3. Update local state
      completedQuestIds.value.push(questId)
      updateQuestStatuses()
      
      // 4. Bridge gamification progress and award dynamic XP reward
      try {
        const userStore = useUserStore()
        if (userStore.markQuestComplete) {
          userStore.markQuestComplete(questId)
        }

        const quest = quests.value.find(q => q.id === questId)
        if (quest) {
          const xp = quest.xp_reward || 50
          userStore.addXP(xp)
          
          let earnedHeart = false
          if (userStore.gainHeart && userStore.hearts < userStore.maxHearts) {
            userStore.gainHeart()
            earnedHeart = true
          }
          
          const uiStore = useUiStore()
          if (earnedHeart) {
            uiStore.addToast(`+${xp} XP & +1 ❤️ earned!`, 'success')
          } else {
            uiStore.addToast(`+${xp} XP earned! (Hearts Maxed)`, 'success')
          }
        }
      } catch (e) {
        logger.error('[Curriculum] Failed to trigger gamification sync:', e)
      }
    } else {
      // Log the database error clearly for debugging
      logger.error(`[Curriculum] Failed to insert progress for quest ${questId}:`, error)
      const uiStore = useUiStore()
      uiStore.addToast('Failed to save lesson progress to database.', 'error')
    }
  }

  const personalPuzzles = ref<any[]>([])
  const isGenerating = ref(false)

  /**
   * Removes a corrupt or invalid puzzle from the user's queue.
   */
  async function discardPuzzle(puzzleId: string) {
    const userStore = useUserStore()
    const uiStore = useUiStore()
    const userId = userStore.profile?.id
    if (!userId) return

    try {
      // 1. Remove from local state
      personalPuzzles.value = personalPuzzles.value.filter(p => p.id !== puzzleId)
      
      // 2. Remove from Supabase queue
      const { error } = await supabase
        .from('puzzle_queue')
        .delete()
        .eq('user_id', userId)
        .eq('puzzle_id', puzzleId)

      if (error) throw error
      
      logger.info(`[Curriculum] Discarded corrupt drill: ${puzzleId}`)
      uiStore.addToast('Drill discarded from Shadow Realm.', 'success')
    } catch (err) {
      logger.error(`[Curriculum] Failed to discard drill ${puzzleId}:`, err)
      uiStore.addToast('Failed to discard drill.', 'error')
    }
  }

  /**
   * APPROACH 1: Shadow Realm Harvesting
   * Directly injects a discovered blunder into the user's personal training queue.
   * To do this, we must:
   * 1. Register the blunder in the 'coaching_cache' table so its FEN, theme, and 
   *    metadata are queryable when playing the puzzle.
   * 2. Insert a reference to this puzzle ID into the 'puzzle_queue' table, which
   *    stores the user's spaced repetition queue.
   * 
   * @param gameId - The ID of the analyzed match
   * @param blunderData - Object containing the blunder's FEN, ply, CPL drop, and best move
   */
  async function harvestBlunders(gameId: string, blunderData: any) {
    const userStore = useUserStore()
    const userId = userStore.profile?.id
    if (!userId) return

    logger.info(`[Curriculum] Harvesting blunder for Shadow Realm: ${gameId}`)

    // Formulate a unique identifier for the personal mistake puzzle.
    // The GUID portion is extracted using '-' splits during load.
    const puzzleId = `personal-${gameId}-${blunderData.ply}`
    
    // Classify severity based on evaluation drop.
    // We divide centipawns by 100 because 1 pawn = 100 centipawns.
    const dropInPawns = blunderData.drop / 100
    const severity = dropInPawns > 2.5 ? 'blunder' : 'mistake'
    
    // Determine a deterministic theme for classification
    const theme = dropInPawns > 2.5 ? 'Tactical Oversight' : 'Positional Inaccuracy'
    const mistakeType = dropInPawns > 2.5 ? 'tactics' : 'positional'
    
    // Generate a secure position hash to query and cache explanations
    const hash = await TaggingService.generatePositionHash(
      blunderData.fen,
      theme,
      severity,
      userStore.displayName || 'Guest'
    )
    
    const explanationText = `You played ${blunderData.playerMove}, but ${blunderData.move} was stronger (drops ${dropInPawns.toFixed(1)} pawns).`

    try {
      // 1. Register the position in coaching_cache so it is resolvable on demand
      const { error: ccError } = await supabase.from('coaching_cache').insert([{
        position_hash: hash,
        fen: blunderData.fen,
        theme,
        mistake_type: mistakeType,
        explanation_text: explanationText,
        metadata: {
          match_id: gameId,
          move_index: blunderData.ply,
          best_move: blunderData.move,
          severity,
          eval_drop: dropInPawns
        }
      }])

      if (ccError && !ccError.message.includes('duplicate key')) {
        logger.warn(`[Curriculum] Failed to cache blunder position details: ${ccError.message}`)
      }

      // 2. Queue the puzzle ID for the user's spaced repetition session
      const { error: pqError } = await supabase.from('puzzle_queue').insert({
        user_id: userId,
        puzzle_id: puzzleId,
        next_review: new Date().toISOString(),
        interval_days: 0,
        ease_factor: 2.5,
        repetition: 0
      })

      if (pqError) {
        if (pqError.message.includes('duplicate key')) {
          logger.info('[Curriculum] Blunder already exists in user queue.')
        } else {
          throw pqError
        }
      } else {
        const uiStore = useUiStore()
        uiStore.addToast(`Shadow Realm Updated: New tactical ghost captured.`, 'success')
      }

      // 3. Reactively update local memory state immediately for instant HUD update
      if (!personalPuzzles.value.some(p => p.id === puzzleId)) {
        personalPuzzles.value.unshift({
          id: puzzleId,
          fen: blunderData.fen,
          solution: [blunderData.move],
          themes: [dropInPawns > 2.5 ? 'Tactics' : 'Positional', theme],
          category: 'Personal Mistake',
          severity,
          explanation: explanationText
        })
      }
    } catch (err: any) {
      logger.error('[Curriculum] Failed to harvest blunder:', err)
    }
  }

  /**
   * THE INTELLIGENCE ENGINE (Dynamic Puzzle Generation)
   * Scans the user's analyzed games for significant mistakes and transforms
   * them into personalized puzzles using the coaching_cache and TaggingService.
   */
  async function generatePersonalPuzzles() {
    const { fetchPuzzleBatch } = await import('../api/puzzleApi')
    const library = useLibraryStore()
    
    isGenerating.value = true
    const newPuzzles: any[] = []

    try {
      // 1. Try to fetch from Supabase (Production Path)
      const dbPuzzles = await fetchPuzzleBatch('Personal Mistake', 20)
      if (dbPuzzles.length > 0) {
        personalPuzzles.value = dbPuzzles
        logger.info(`[Curriculum] Fetched ${dbPuzzles.length} drills from Shadow Realm vault.`)
        return
      }

      // 2. Fallback to In-Memory Generation (Legacy/Dev Path)
      if (library.games.length === 0) return

      for (const game of library.games) {
        if (!game.evals || game.evals.length === 0) continue

        const chess = new Chess()
        chess.loadPgn(game.pgn)
        const moves = chess.history({ verbose: true })
        
        // Iterate through evals and find significant mistakes
        const evals = game.evals || []
        evals.forEach((ev, i) => {
          // We need the evaluation for the position BEFORE move i to find the engine's best move.
          // If we are at the very first move (i = 0), we default to a standard opening balance of 0.3.
          const prevEval = i > 0 ? evals[i-1] : { score: 0.3, bestMove: '' }

          // SAFETY CHECK: Ensure that both the current eval object (ev) and the previous eval (prevEval)
          // exist, that a valid bestMove was recorded, and that we have not exceeded the game moves array.
          // If ev is null (e.g., the engine skipped that specific ply during a cloud sync or fast scan),
          // accessing ev.score would throw a TypeError: "Cannot read properties of null (reading 'score')".
          if (!ev || !prevEval || !prevEval.bestMove || i >= moves.length) return

          const fenBefore = moves[i].before
          // We check if score exists to avoid defaulting a genuine 0.0 (equal position) to 0.3
          const evalBefore = (prevEval.score !== undefined && prevEval.score !== null) ? prevEval.score : 0.3
          const evalAfter = (ev.score !== undefined && ev.score !== null) ? ev.score : 0

          // If the user played the engine's suggested best move, it's not a mistake,
          // even if the evaluation dropped (horizon effect).
          if (moves[i].lan === prevEval.bestMove || moves[i].san === prevEval.bestMove) {
            return
          }

          // Use TaggingService for deterministic classification
          const tag = TaggingService.identifyMistake(
            fenBefore,
            moves[i].after,
            evalBefore,
            evalAfter,
            moves[i].lan,
            prevEval.bestMove
          )

          if (tag) {
            // CRITICAL: Double check the move is actually legal in the FEN
            const testChess = new Chess(fenBefore)
            try {
              const legal = testChess.move(prevEval.bestMove)
              if (!legal) {
                logger.warn(`[Curriculum] Skipping illegal harvest: ${prevEval.bestMove} in ${fenBefore}`)
                return
              }
            } catch (e) {
              return
            }

            newPuzzles.push({
              id: `personal-${game.id}-${i}`,
              title: tag.theme,
              rating: Math.round(Number(game.whiteElo || 1200)),
              themes: [tag.category, tag.theme, moves[i].piece],
              severity: tag.severity,
              evalDrop: tag.evalDrop,
              fen: fenBefore,
              lastMove: i > 0 ? moves[i-1].lan : '',
              solution: [prevEval.bestMove],
              category: 'Personal Mistake',
              explanation: tag.explanation || game.analysisCache?.[fenBefore] || `You played ${moves[i].san}, but ${prevEval.bestMove} was stronger.`
            })
          }
        })
      }

      // SRS Priority: Blunders first, then Mistakes, then Inaccuracies
      const severityMap: Record<string, number> = { blunder: 3, mistake: 2, inaccuracy: 1 }
      personalPuzzles.value = newPuzzles
        .sort((a, b) => (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0))
        .slice(0, 15)

      logger.info(`[Curriculum] Harvested ${personalPuzzles.value.length} high-priority drills from vault.`)
    } catch (err) {
      logger.error('[Curriculum] Failed to generate personal puzzles:', err)
    } finally {
      isGenerating.value = false
    }
  }

  const personalLessons = ref<any[]>([])

  /**
   * Generates thematic lessons by grouping personal puzzles by theme.
   */
  async function generatePersonalLessons() {
    if (personalPuzzles.value.length === 0) {
      await generatePersonalPuzzles()
    }

    const themeGroups: Record<string, any[]> = {}
    personalPuzzles.value.forEach(p => {
      const mainTheme = p.themes[0] || 'General Improvement'
      if (!themeGroups[mainTheme]) themeGroups[mainTheme] = []
      themeGroups[mainTheme].push(p)
    })

    const newLessons: any[] = []
    Object.entries(themeGroups).forEach(([theme, puzzles]) => {
      if (puzzles.length >= 2) {
        newLessons.push({
          id: `lesson-${theme.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Focus: ${theme}`,
          category: puzzles[0].category,
          icon: '🎓',
          puzzles: puzzles.slice(0, 5),
          xp_reward: puzzles.length * 20
        })
      }
    })

    personalLessons.value = newLessons
    logger.info(`[Curriculum] Generated ${personalLessons.value.length} thematic lessons.`)
  }

  const nextQuests = computed(() => quests.value.filter(q => q.status === 'unlocked'))

  /**
   * Groups all quests by their respective realms.
   * Useful for list-based view mapping in the Sanctum.
   */
  const questsByRealm = computed(() => {
    const groups: Record<string, Quest[]> = {}
    realms.value.forEach(realm => {
      // Filter quests belonging to this specific realm
      groups[realm.id] = quests.value.filter(q => q.realmId === realm.id)
    })
    return groups
  })

  /**
   * Checks if a specific quest is completed by its ID.
   * 
   * @param questId - The unique identifier of the quest
   * @returns boolean - True if the quest is completed
   */
  function isQuestCompleted(questId: string): boolean {
    return completedQuestIds.value.includes(questId)
  }

  /**
   * Calculates the completion progress for a given realm.
   * Returns the count of completed quests.
   * 
   * @param realmId - The unique identifier of the realm
   * @returns number - Number of completed quests in this realm
   */
  function getRealmProgress(realmId: string): number {
    const realmQuests = questsByRealm.value[realmId] || []
    if (realmQuests.length === 0) return 0
    // Count how many quests in this realm are completed
    return realmQuests.filter(q => isQuestCompleted(q.id)).length
  }

  const assessment = useAssessmentEngine()

  return {
    ...assessment,
    quests,
    completedQuestIds,
    fetchProgress,
    completeQuest,
    nextQuests,
    questsByRealm,
    isQuestCompleted,
    getRealmProgress,
    viewMode,
    selectedIslandId,
    realms,
    personalPuzzles,
    personalLessons,
    isGenerating,
    generatePersonalPuzzles,
    generatePersonalLessons,
    discardPuzzle,
    harvestBlunders
  }
})
