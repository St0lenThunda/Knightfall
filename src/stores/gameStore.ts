import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { logger } from '../utils/logger'
import { useAntiCheat } from '../composables/useAntiCheat'
import { Storage, StorageKey } from '../utils/storage'

// Pillars
import { useBoardLogic } from './game/useBoardLogic'
import { useGameClock } from './game/useGameClock'
import { useBotEngine } from './game/useBotEngine'
import { useGameAnalysis } from './game/useGameAnalysis'
import { useEngineStore } from './engineStore'
import { useUserStore } from './userStore'
import { BOTS } from './game/useBotEngine'
import { TIME_CONTROLS, type TimeControl } from './game/useGameClock'

export { BOTS, TIME_CONTROLS }
export type { TimeControl }

export type GameMode = 'local' | 'vs-computer' | 'puzzle' | 'analysis' | 'live'

/**
 * Knightfall Game Store
 * 
 * High-level orchestrator for live gameplay.
 * Aggregates core pillars (Board, Clock, Bots, Analysis).
 */
export const useGameStore = defineStore('game', () => {
  const antiCheat = useAntiCheat()
  
  // --- PILLARS ---
  const userStore = useUserStore()
  const boardLogic = useBoardLogic()
  const clock = useGameClock()
  const bots = useBotEngine()
  const analysis = useGameAnalysis()

  // --- ORCHESTRATION STATE ---
  const mode = ref<GameMode>('local')
  const gameStarted = ref(false)
  const forceGameOver = ref(false)
  const resignationWinner = ref<'w' | 'b' | null>(null)
  const loadedGameId = ref<string | null>(null)
  const playerColor = ref<'w' | 'b'>('w')
  const sessionStartTime = ref(Date.now())
  const lastMoveDuration = ref(0)

  // --- DEBUG WATCHERS ---
  watch(mode, (newMode) => {
    logger.info(`[GameStore] Mode changed: ${newMode}`)
  })
  
  watch(loadedGameId, (newId) => {
    logger.info(`[GameStore] LoadedGameId changed: ${newId || 'N/A'}`)
  })

  // Sync playerColor with boardLogic
  watch(playerColor, (newColor) => {
    boardLogic.playerColor.value = newColor
  })
  const gameActive = computed(() => {
    const active = gameStarted.value && !forceGameOver.value && !boardLogic.isGameOver.value
    if (!active && gameStarted.value) {
      logger.warn(`[GameStore] Game inactive! Started: ${gameStarted.value}, ForceGameOver: ${forceGameOver.value}, BoardGameOver: ${boardLogic.isGameOver.value}, FEN: ${boardLogic.fen.value}`)
    }
    return active
  })

  const isPlayersTurn = computed(() => {
    if (!gameActive.value) return false
    
    // In local or analysis mode, the user can always move
    if (mode.value === 'local' || mode.value === 'analysis') return true
    
    // In vs-computer or puzzle mode, user can only move if it's their color's turn
    if (mode.value === 'vs-computer' || mode.value === 'puzzle') {
      return boardLogic.turn.value === playerColor.value
    }
    
    return false
  })

  const isGameOver = computed(() => boardLogic.isGameOver.value || forceGameOver.value)

  const gameResult = computed(() => {
    if (resignationWinner.value) return resignationWinner.value === 'w' ? '1-0' : '0-1'
    if (clock.timeOutWinner.value) return clock.timeOutWinner.value === 'w' ? '1-0' : '0-1'
    if (!isGameOver.value) return '*'
    
    if (boardLogic.chess.value.isCheckmate()) return boardLogic.turn.value === 'w' ? '0-1' : '1-0'
    if (boardLogic.chess.value.isDraw() || boardLogic.chess.value.isStalemate()) return '1/2-1/2'
    
    return '*'
  })

  // --- ACTIONS ---

  function newGame(newMode: GameMode, color: 'w' | 'b' = 'w', tc?: any) {
    mode.value = newMode
    playerColor.value = color
    boardLogic.loadPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'live')
    if (tc) clock.setTimeControl(tc)
    startMatch()
  }

  function startClock() {
    clock.startClock(boardLogic.turn.value, boardLogic.isGameOver.value, (loser) => {
      handleFlag(loser)
    })
  }

  function stopClock() {
    clock.stopClock()
  }

  function pauseClock() {
    clock.stopClock()
  }

  function resumeClock() {
    clock.startClock(boardLogic.turn.value, boardLogic.isGameOver.value, (loser) => {
      handleFlag(loser)
    })
  }

  function computerMove() {
    if (mode.value === 'vs-computer' && !boardLogic.isGameOver.value) {
      triggerBotMove()
    }
  }

  function startMatch() {
    gameStarted.value = true
    forceGameOver.value = false
    resignationWinner.value = null
    clock.resetTimes()
    antiCheat.reset()
    
    if (mode.value === 'vs-computer' && boardLogic.playerColor.value === 'b') {
      triggerBotMove()
    }
  }

  /**
   * Orchestrates square selection and move execution.
   * If a square is already selected and the new square is a legal move, execute it.
   */
  function selectSquare(sq: any) {
    if (!isPlayersTurn.value) return
    
    if (boardLogic.selectedSquare.value && boardLogic.legalMoveSquares.value.includes(sq)) {
      makeMove(boardLogic.selectedSquare.value, sq)
    } else {
      boardLogic.selectSquare(sq)
    }
  }

  /**
   * High-level move execution. 
   * Orchestrates the move, clock updates, and Anti-Cheat tracking.
   */
  function makeMove(fromOrUci: any, to?: any, promotion?: any) {
    // Only allow moves if the game is active and it's the player's turn
    if (!gameActive.value) return null
    
    // We allow moves from the store itself (e.g. computer responses) by bypassing this check if needed,
    // but for user-initiated moves via the UI, we check isPlayersTurn.
    // NOTE: In Knightfall, all moves (user and computer) currently flow through makeMove.
    // However, computer responses in puzzles are triggered by store.makeMove explicitly.
    // If we block makeMove, we block the computer too!
    
    // REFINED LOGIC: We only block if it's a "User Mode" and not the turn.
    // But wait, the computer move in vs-computer mode is triggered by triggerBotMove -> makeMove.
    // So we need to distinguish between User and System.
    
    // Actually, the simplest way is to only gate the UI entry point: selectSquare.

    // If the player makes a move while the engine was thinking (e.g. for eval bar), stop it
    if (engineStore.isAnalyzing) {
      engineStore.stop()
    }

    const move = boardLogic.makeMove(fromOrUci, to, promotion)
    if (move && typeof move === 'object') {
      // 1. Record move timing for rhythm analysis
      const now = Date.now()
      lastMoveDuration.value = now - antiCheat.lastMoveTimestamp.value
      antiCheat.recordMoveTime()

      // 2. Correlation Check: Did the player match the engine's recommendation?
      // We only check this during computer matches to avoid self-correlation.
      if (mode.value === 'vs-computer' && boardLogic.turn.value !== boardLogic.playerColor.value) {
        const uci = move.from + move.to + (move.promotion || '')
        const recommended = engineStore.suggestedMove
        if (recommended) {
          antiCheat.recordEngineMatch(uci === recommended)
        }
      }

      // 3. Trigger downstream effects (clocks, bot responses)
      handleMove(move)
    }
    return move
  }

  function handleMove(move: any) {
    if (move && typeof move === 'object' && mode.value === 'vs-computer' && !boardLogic.isGameOver.value) {
      clock.applyIncrement(move.color)
      
      // If it's now the bot's turn, trigger it
      if (boardLogic.turn.value !== boardLogic.playerColor.value) {
        triggerBotMove()
      }
    }
  }

  const engineStore = useEngineStore()

  function triggerBotMove() {
    if (boardLogic.isGameOver.value) return
    
    boardLogic.isThinking.value = true
    const activeBot = bots.activeBot.value
    
    logger.info(`[Bot] ${activeBot.name} is thinking (Depth: ${activeBot.depth})...`)
    
    // Synchronize Mortal Archetype with the active bot
    engineStore.setMortalArchetype(activeBot.mortalArchetype || null)
    
    // Trigger analysis with bot-specific personality
    engineStore.analyze(boardLogic.fen.value, activeBot.depth, activeBot)
  }

  // Watch for bot move completion
  watch(() => engineStore.bestMove, (newMove) => {
    if (newMove && boardLogic.isThinking.value && mode.value === 'vs-computer') {
      const turn = boardLogic.turn.value
      // Ensure it's actually the bot's turn to move
      if (turn !== boardLogic.playerColor.value) {
        boardLogic.makeMove(newMove)
        boardLogic.isThinking.value = false
        engineStore.stop()
        
        // Handle post-move clock synchronization
        clock.applyIncrement(turn)
      }
    }
  })

  // SAFETY: If the engine stops analyzing for ANY reason (crash, stop) 
  // but we are still "thinking", reset the UI state.
  watch(() => engineStore.isAnalyzing, (isAnalyzing) => {
    if (!isAnalyzing && boardLogic.isThinking.value) {
      // Small delay to allow bestMove watcher to fire first if it was a success
      setTimeout(() => {
        if (!engineStore.isAnalyzing) {
          boardLogic.isThinking.value = false
        }
      }, 50)
    }
  })

  function handleFlag(loser: 'w' | 'b') {
    clock.timeOutWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
    boardLogic.boardTrigger.value++
  }

  function resign(loser: 'w' | 'b') {
    resignationWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
    boardLogic.boardTrigger.value++
  }

   /**
    * Populates the Chess.js instance with standard PGN headers based on current match context.
    */
   function injectPgnHeaders() {
     const isWhite = playerColor.value === 'w'
     const pName = userStore.profile?.username || 'Guest'
     const oName = mode.value === 'vs-computer' ? bots.activeBot.value.name : 'Player 2'
     
     const defaultHeaders: Record<string, string> = {
       'Event': mode.value === 'vs-computer' ? `Match vs ${oName}` : 'Local Match',
       'Site': 'Knightfall',
       'Date': new Date().toISOString().split('T')[0].replace(/-/g, '.'),
       'White': (mode.value === 'local' || isWhite) ? pName : oName,
       'Black': (mode.value === 'local' || isWhite) ? oName : pName,
       'Result': gameResult.value || '*',
       'WhiteElo': String((mode.value === 'local' || isWhite) ? (userStore.profile?.rating || 1200) : bots.activeBot.value.rating),
       'BlackElo': String((mode.value === 'local' || isWhite) ? bots.activeBot.value.rating : (userStore.profile?.rating || 1200)),
     }
     
     const currentHeaders = boardLogic.chess.value.header()
     
     Object.entries(defaultHeaders).forEach(([k, v]) => {
       const current = currentHeaders[k]
       // Only inject if the current header is missing, '?', or 'Unknown'
       if (!current || current === '?' || current === 'Unknown') {
         boardLogic.chess.value.header(k, v)
       }
     })
     boardLogic.boardTrigger.value++
   }

   /**
    * Manually updates a specific PGN header.
    */
   function updateHeader(key: string, value: string) {
     boardLogic.chess.value.header(key, value)
     boardLogic.boardTrigger.value++
   }

   /**
    * Batch updates multiple PGN headers.
    */
    /**
     * Batch updates multiple PGN headers.
     * If the game is currently loaded from the library, this will also trigger a library update.
     */
    async function setHeaders(headers: Record<string, string>) {
      Object.entries(headers).forEach(([k, v]) => {
        boardLogic.chess.value.header(k, v)
      })
      boardLogic.boardTrigger.value++

      // PERSISTENCE BRIDGE: If we are in analysis mode and have a loaded ID, 
      // we sync back to the library immediately.
      if (mode.value === 'analysis' && loadedGameId.value) {
        const libraryStore = (await import('./libraryStore')).useLibraryStore()
        const game = libraryStore.gamesMap.get(loadedGameId.value)
        if (game) {
          const updatedPgn = boardLogic.chess.value.pgn()
          await libraryStore.persistGameUpdate(loadedGameId.value, { 
            pgn: updatedPgn,
            white: headers.White || game.white,
            black: headers.Black || game.black,
            whiteElo: headers.WhiteElo || game.whiteElo,
            blackElo: headers.BlackElo || game.blackElo,
            event: headers.Event || game.event,
            date: headers.Date || game.date
          })
          logger.info(`[GameStore] Metadata synced to library for game ${loadedGameId.value}`)
        }
      }
    }

  async function saveGame() {
    // A. Ensure headers are baked in (without overwriting manual edits)
    injectPgnHeaders()

    // B. Collect Telemetry
    const telemetry = {
      blurCount: antiCheat.blurCount.value,
      suspicionScore: antiCheat.suspicionScore.value,
      isBusted: antiCheat.isCheaterBusted.value
    }
    const tags = mode.value === 'vs-computer' ? ['Bot Match', 'My Games'] : ['Local', 'My Games']
    
    // C. Persist to Library
    if (loadedGameId.value) {
      // Update existing
      const libraryStore = (await import('./libraryStore')).useLibraryStore()
      await libraryStore.persistGameUpdate(loadedGameId.value, { 
        pgn: boardLogic.pgn.value,
        telemetry 
      })
      logger.info(`[GameStore] Game updated in library: ${loadedGameId.value}`)
    } else {
      // Create new
      await analysis.saveMatch(boardLogic.pgn.value, tags, telemetry)
    }
  }

  // --- AUTO-ARCHIVE WATCHER ---
  watch(isGameOver, (isOver) => {
    // We only auto-archive matches that have actually started and progressed
    if (isOver && gameStarted.value && boardLogic.moveHistory.value.length > 0) {
      if (mode.value === 'vs-computer' || mode.value === 'local') {
        logger.info('[GameStore] Game over. Executing silent archival...')
        saveGame()
      }
    }
  })

  // --- PERSISTENCE WATCHER ---
  watch(() => boardLogic.boardTrigger.value, () => {
    if (mode.value === 'analysis' && boardLogic.fen.value) {
      Storage.set(StorageKey.LAST_ANALYSIS_PGN, boardLogic.chess.value.pgn())
    }
  })

  return {
    // Actions first to avoid spread collisions
    setHeaders,
    updateHeader,

    // Expose Pillars
    ...boardLogic,
    ...clock,
    ...bots,
    ...analysis,

    // Orchestration
    mode,
    gameStarted,
    forceGameOver,
    resignationWinner,
    loadedGameId,
    gameActive,
    isPlayersTurn,
    gameResult,
    newGame,
    startClock,
    stopClock,
    pauseClock,
    resumeClock,
    computerMove,
    startMatch,
    makeMove,
    handleMove,
    handleFlag,
    resign,
    isGameOver,
    saveGame,
    loadPgn(pgn: string, newMode: GameMode = 'live', id?: string, extra?: any) {
      logger.info(`[GameStore] Loading PGN. Mode: ${newMode}, ID: ${id}`)
      mode.value = newMode
      loadedGameId.value = id || null
      
      const success = boardLogic.loadPgn(pgn, newMode as any, id, extra)
      
      if (success) {
        gameStarted.value = true
        forceGameOver.value = false
        resignationWinner.value = null
        boardLogic.viewIndex.value = -1
        
        // Cache the ID and PGN for session restoration
        if (id) {
          Storage.set(StorageKey.LAST_ANALYSIS_ID, id)
        }
        Storage.set(StorageKey.LAST_ANALYSIS_PGN, pgn)
      }
      return success
    },
    loadPosition(fen: string, newMode: GameMode = 'live') {
      logger.info(`[GameStore] Loading position. Mode: ${newMode}, FEN: ${fen}`)
      mode.value = newMode
      loadedGameId.value = null // Position load is always unsaved
      boardLogic.loadPosition(fen, newMode as any)
      
      // CRITICAL: Synchronize the store's playerColor with the board's turn
      // This ensures that for puzzles/drills, the store knows who the player is.
      playerColor.value = boardLogic.playerColor.value
      
      gameStarted.value = true
      forceGameOver.value = false
      resignationWinner.value = null
      boardLogic.viewIndex.value = -1
      
      // Ensure any computer responses are triggered if necessary
      if (newMode === 'vs-computer') {
        computerMove()
      }
    },
    selectSquare,
    undoMove() {
      if (mode.value === 'vs-computer') {
        // In bot matches, undo both the bot's response and the user's move
        boardLogic.undoMove()
        boardLogic.undoMove()
      } else {
        boardLogic.undoMove()
      }
      // Stop the bot if it was thinking
      boardLogic.isThinking.value = false
      engineStore.stop()
    },

    // Drill Mode
    drillIndex: boardLogic.drillIndex,
    setDrill: boardLogic.setDrill,
    mistakeCount: boardLogic.mistakeCount,
    currentDrill: boardLogic.drillSolution,
    
    // Pillars
    antiCheat,
    boardLogic,
    clock,
    bots,
    analysis,
    engine: engineStore,

    // Anti-Cheat Direct (Aliases)
    registerBlur: antiCheat.registerBlur,
    isCheaterBusted: antiCheat.isCheaterBusted,
    blurCount: antiCheat.blurCount,
    suspicionScore: antiCheat.suspicionScore,
    suspicionBreakdown: computed(() => ({
      blurs: antiCheat.blurCount.value,
      robotic: Math.round(antiCheat.roboticScore.value),
      correlation: Math.round(antiCheat.correlationScore.value)
    })),
    sessionDuration: computed(() => Math.round((Date.now() - sessionStartTime.value) / 1000)),
    lastMoveDuration
  }
})
// HMR trigger
