import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { logger } from '../utils/logger'
import { useAntiCheat } from '../composables/useAntiCheat'
import { Storage, StorageKey } from '../utils/storage'
import { Chess, type Square, type PieceSymbol, type Move } from 'chess.js'
import type { MoveEvaluation } from './library/types'

// Pillars
import { useBoardLogic } from './game/useBoardLogic'
import { useGameClock } from './game/useGameClock'
import { useBotEngine } from './game/useBotEngine'
import { useGameAnalysis } from './game/useGameAnalysis'
import { useEngineStore } from './engineStore'
import { useUiStore } from './uiStore'
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
  const sessionStartTime = ref(Date.now())
  const lastMoveDuration = ref(0)

  const gameActive = computed(() => {
    // In local or analysis mode, the game is active as long as it has started and not been forced over.
    // This allows free piece movement and exploration even if the position is technically a game over.
    if (mode.value === 'local' || mode.value === 'analysis') {
      return gameStarted.value && !forceGameOver.value
    }

    const active = gameStarted.value && !forceGameOver.value && !boardLogic.isGameOver.value
    if (!active && gameStarted.value) {
      logger.warn(`[GameStore] Game inactive! Started: ${gameStarted.value}, ForceGameOver: ${forceGameOver.value}, BoardGameOver: ${boardLogic.isGameOver.value}, FEN: ${boardLogic.fen.value}`)
    }
    return active
  })

  const isBotTurn = computed(() => {
    return mode.value === 'vs-computer' && boardLogic.turn.value !== boardLogic.playerColor.value
  })

  /**
   * Computes whether it is currently the user's turn to play.
   * 
   * In local/analysis modes, the user can move at any time.
   * In vs-computer or puzzle/drill modes, the user can only move if the current
   * board turn matches the user's player color.
   */
  const isPlayersTurn = computed(() => {
    if (!gameStarted.value || forceGameOver.value) return false
    
    // In local or analysis mode, the user can always move and interact
    if (mode.value === 'local' || mode.value === 'analysis') return true
    
    // For competitive/puzzle modes, if the board says the game is over, they cannot move
    if (boardLogic.isGameOver.value) return false
    
    // In vs-computer or puzzle mode, user can only move if it's their color's turn
    if (mode.value === 'vs-computer' || mode.value === 'puzzle') {
      // Single Source of Truth (SSOT): We check the board logic's playerColor directly
      // to avoid any race conditions or asynchronous desync between store variables.
      return boardLogic.turn.value === boardLogic.playerColor.value
    }
    
    return false
  })

  const isGameOver = computed(() => boardLogic.isGameOver.value || forceGameOver.value)

  const gameResult = computed(() => {
    // 1. Resignation/Timeout take priority
    if (resignationWinner.value) return resignationWinner.value === 'w' ? '1-0' : '0-1'
    if (clock.timeOutWinner.value) return clock.timeOutWinner.value === 'w' ? '1-0' : '0-1'
    
    // 2. Board-level terminal states
    if (boardLogic.isGameOver.value) {
      if (boardLogic.isCheckmate.value) {
        // If it's White's turn and they are in checkmate, Black won (0-1)
        return boardLogic.turn.value === 'w' ? '0-1' : '1-0'
      }
      if (boardLogic.isDraw.value || boardLogic.isStalemate.value) return '1/2-1/2'
    }
    
    return '*'
  })

  /**
   * Computes a human-readable reason for the match completion.
   * Helps differentiate between resignation, timeout, checkmate, stalemate, and draw in overlays.
   * 
   * @returns string | null - Human-readable reason or null if match is active
   */
  const gameOverReason = computed(() => {
    // Resignation takes priority over board logic end states
    if (resignationWinner.value) return 'Resignation'
    // Time out flags are tracked on the clock pillar
    if (clock.timeOutWinner.value) return 'Time Out'
    
    // Fall back to specific chess rules checked by the board engine
    if (boardLogic.isGameOver.value) {
      if (boardLogic.isCheckmate.value) return 'Checkmate'
      if (boardLogic.isStalemate.value) return 'Stalemate'
      if (boardLogic.isDraw.value) return 'Draw'
    }
    
    return null
  })

  // --- DEBUG WATCHERS ---
  if (import.meta.env.DEV) {
    watch(mode, (newMode) => {
      logger.info(`[GameStore] Mode changed: ${newMode}`)
    })
    
    watch(loadedGameId, (newId) => {
      logger.info(`[GameStore] LoadedGameId changed: ${newId || 'N/A'}`)
    })
  }

  // No sync needed: boardLogic.playerColor is the Single Source of Truth

  // --- ACTIONS ---

  /**
   * Initializes and starts a new game with the specified mode and player color.
   * 
   * @param newMode - The gameplay mode (local, vs-computer, etc.)
   * @param color - The user's player color ('w' or 'b')
   * @param tc - Optional time control configuration
   */
  function newGame(newMode: GameMode, color: 'w' | 'b' = 'w', tc?: TimeControl) {
    mode.value = newMode
    // Single Source of Truth (SSOT): Directly set the board logic player color
    boardLogic.playerColor.value = color
    
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
   * Emergency Resuscitation
   * 
   * This is a "Big Red Button" for the gameplay engine. If a race condition or
   * state desync occurs (e.g. Stockfish worker crashes or gets stuck in a handshake),
   * this method forces a hard reboot of the engine and re-evaluates the board state.
   * 
   * It provides user feedback via toasts so they know the system is self-healing.
   */
  function resuscitate() {
    const uiStore = useUiStore()
    const engineStore = useEngineStore()
    
    uiStore.addToast('Emergency Resuscitation: Re-syncing engine state...', 'info')
    
    // Reboot engine if vs computer
    if (mode.value === 'vs-computer') {
      engineStore.resetRebootCount()
      engineStore.reboot(true) // Force reboot even if count is high
    }
    
    // Hard reset of flags
    gameStarted.value = true
    forceGameOver.value = false
    
    // Force turn evaluation after a short delay to allow reboot
    setTimeout(() => {
      if (isBotTurn.value) {
        triggerBotMove()
      } else {
        uiStore.addToast('Resuscitation Complete: Player turn active.', 'success')
      }
    }, 1000)
  }

  /**
   * Orchestrates square selection and move execution.
   * If a square is already selected and the new square is a legal move, execute it.
   */
  function selectSquare(sq: Square) {
    if (!isPlayersTurn.value) return
    
    if (boardLogic.selectedSquare.value && boardLogic.legalMoveSquares.value.includes(sq)) {
      makeMove(boardLogic.selectedSquare.value, sq)
    } else {
      boardLogic.selectSquare(sq)
      
      // Sandbox Free Movement: Show legal moves for out-of-turn pieces in analysis mode
      if (mode.value === 'analysis') {
        const piece = boardLogic.chess.value.get(sq)
        if (piece && piece.color !== boardLogic.chess.value.turn()) {
          const tempChess = new Chess(boardLogic.chess.value.fen())
          const fenParts = tempChess.fen().split(' ')
          fenParts[1] = piece.color
          // Disable castling rights if we flip turn to avoid chess.js load errors
          fenParts[2] = '-'
          tempChess.load(fenParts.join(' '))
          boardLogic.legalMoveSquares.value = tempChess.moves({ square: sq, verbose: true }).map((m: any) => m.to)
        }
      }
    }
  }

  /**
   * High-level move execution. 
   * Orchestrates the move, clock updates, and Anti-Cheat tracking.
   */
  function makeMove(fromOrUci: Square | string, to?: Square, promotion?: PieceSymbol) {
    // Only allow moves if the game is active and it's the player's turn
    if (!gameActive.value) return null
    
    // If the player makes a move while the engine was thinking, stop it
    if (engineStore.isAnalyzing) {
      engineStore.stop()
    }

    // Sandbox Free Movement: Force turn alignment before executing move
    if (mode.value === 'analysis') {
      let fromSq = typeof fromOrUci === 'string' && !to ? (fromOrUci.slice(0, 2) as Square) : (fromOrUci as Square)
      const piece = boardLogic.chess.value.get(fromSq)
      if (piece && piece.color !== boardLogic.chess.value.turn()) {
        const fenParts = boardLogic.chess.value.fen().split(' ')
        fenParts[1] = piece.color
        // Strip castling rights to prevent strict FEN validation errors on turn flip
        fenParts[2] = '-'
        const savedHistory = [...boardLogic.moveHistory.value]
        boardLogic.chess.value.load(fenParts.join(' '))
        boardLogic.moveHistory.value = savedHistory
      }
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

  function handleMove(move: Move) {
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
    logger.warn(`[GameStore] Time out! Loser: ${loser}`)
    clock.timeOutWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
    injectPgnHeaders() // Force result update
    boardLogic.boardTrigger.value++
  }

  function resign(loser: 'w' | 'b') {
    resignationWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
    injectPgnHeaders() // Immediately update result in PGN
    boardLogic.boardTrigger.value++
  }

   /**
    * Populates the Chess.js instance with standard PGN headers based on current match context.
    */
    function injectPgnHeaders() {
      // Access the board logic's playerColor as the Single Source of Truth
      const isWhite = boardLogic.playerColor.value === 'w'
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
       // Force overwrite the Result if the game is definitively over
       if (k === 'Result' && v !== '*') {
         boardLogic.chess.value.header(k, v)
       }
       // Only inject if the current header is missing, '?', or 'Unknown'
       else if (!current || current === '?' || current === 'Unknown') {
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

  async function saveGame(forceSave: boolean = false) {
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
      return loadedGameId.value
    } else {
      // Create new
      const savedGame = await analysis.saveMatch(boardLogic.pgn.value, tags, telemetry, forceSave)
      if (savedGame) {
        loadedGameId.value = savedGame.id
        return savedGame.id
      }
      return null
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

    // Orchestration State
    mode,
    playerColor: boardLogic.playerColor, // Expose boardLogic's playerColor directly as the Single Source of Truth
    gameStarted,
    forceGameOver,
    resignationWinner,
    loadedGameId,
    gameActive,
    isPlayersTurn,
    isBotTurn,
    gameResult,
    gameOverReason,
    dummyKingSquares: boardLogic.dummyKingSquares,

    // Orchestration Actions
    newGame,
    startClock,
    stopClock,
    pauseClock,
    resumeClock,
    computerMove,
    startMatch,
    resuscitate,
    makeMove,
    handleMove,
    handleFlag,
    resign,
    isGameOver,
    saveGame,
    loadPgn(pgn: string, newMode: GameMode = 'live', id?: string, extra?: { evals?: MoveEvaluation[], tags?: string[], moveTags?: string[] }) {
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
    /**
     * Loads a specific chess position from a FEN string.
     * 
     * @param fen - The FEN string representing the position
     * @param newMode - The game mode for the loaded position (defaults to 'live')
     */
    loadPosition(fen: string, newMode: GameMode = 'live') {
      logger.info(`[GameStore] Loading position. Mode: ${newMode}, FEN: ${fen}`)
      mode.value = newMode
      loadedGameId.value = null // Position load is always unsaved
      
      // boardLogic.loadPosition automatically sets boardLogic.playerColor to the FEN's starting turn
      boardLogic.loadPosition(fen, newMode as any)
      
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
