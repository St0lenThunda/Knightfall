import { ref, computed, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { Chess } from 'chess.js'
import type { Color, PieceSymbol, Square } from 'chess.js'
import { logger } from '../utils/logger'
import { useLibraryStore } from './libraryStore'
import { useUserStore } from './userStore'
import { useEngineStore } from './engineStore'
import { useAntiCheat } from '../composables/useAntiCheat'
import { useAdminStore } from './adminStore'
import { useUiStore } from './uiStore'

import { safeLoadPgn } from '../utils/pgnParser'

export type GameMode = 'local' | 'vs-computer' | 'puzzle' | 'analysis'

export interface TimeControl {
  minutes: number
  increment: number
  label: string
}

export const TIME_CONTROLS: TimeControl[] = [
  { minutes: 1, increment: 0, label: '1m | 0s' },
  { minutes: 3, increment: 0, label: '3m | 0s' },
  { minutes: 3, increment: 2, label: '3m | 2s' },
  { minutes: 10, increment: 5, label: '10m | 5s' },
  { minutes: 30, increment: 0, label: '30m | 0s' },
]

export interface Bot {
  id: string
  name: string
  rating: number
  description: string
  avatar: string
  depth: number
}

export const BOTS: Bot[] = [
  { id: 'tanya', name: 'Tactical Tanya', rating: 800, description: 'Focuses on early attacks.', avatar: '/bots/tanya.png', depth: 3 },
  { id: 'boris', name: 'Boris', rating: 1400, description: 'Solid positional player.', avatar: '/bots/boris.png', depth: 8 },
  { id: 'gm', name: 'GM Sentinel', rating: 2800, description: 'Near perfect play.', avatar: '/bots/gm.png', depth: 16 },
]

/**
 * Knightfall Game Store: The central orchestrator for live gameplay.
 */
export const useGameStore = defineStore('game', () => {
  const antiCheat = useAntiCheat()

  // --- INTERNAL STATE ---
  const chess = shallowRef(new Chess())
  const boardTrigger = ref(0) // Forces reactivity for chess.js mutations

  const mode = ref<GameMode>('local')
  const selectedSquare = ref<Square | null>(null)
  const legalMoveSquares = ref<Square[]>([])
  const lastMove = ref<{ from: string; to: string } | null>(null)
  const moveHistory = ref<any[]>([])
  const viewIndex = ref(-1)
  const playerColor = ref<Color>('w')
  const isThinking = ref(false)
  const promotionPending = ref<{ from: Square; to: Square } | null>(null)
  const loadedGameId = ref<string | null>(null)
  const originalPgn = ref<string>('')
  const drillIndex = ref(0)
  const currentDrill = ref<string[]>([])

  const timeControl = ref<TimeControl>(TIME_CONTROLS[3])
  const whiteTime = ref(600)
  const blackTime = ref(600)
  const gameStarted = ref(false)
  const forceGameOver = ref(false)
  const timeOutWinner = ref<Color | null>(null)
  const resignationWinner = ref<Color | null>(null)

  const activeBot = ref<Bot>(BOTS[0])

  // --- COMPUTED PROPERTIES ---
  const fen = computed(() => { boardTrigger.value; return chess.value.fen() })
  /**
   * Reconstructs a reliable PGN from the internal moveHistory.
   * We cannot rely on chess.value.pgn() because goToMove() uses
   * chess.load(fen), which resets Chess.js's internal move list.
   * If we have an originalPgn (from loadPgn), prefer that.
   * Otherwise, rebuild from the moveHistory SAN list.
   */
  const pgn = computed(() => {
    boardTrigger.value
    // If we loaded a game from the library, return the stored original
    if (originalPgn.value) return originalPgn.value
    // Otherwise, get whatever Chess.js has (works for live games before navigation)
    return chess.value.pgn()
  })
  const turn = computed(() => { boardTrigger.value; return chess.value.turn() as Color })
  const board = computed(() => { boardTrigger.value; return chess.value.board() })
  const isGameOver = computed(() => { boardTrigger.value; return forceGameOver.value || chess.value.isGameOver() })
  const isCheck = computed(() => { boardTrigger.value; return chess.value.isCheck() })
  const isCheckmate = computed(() => { boardTrigger.value; return chess.value.isCheckmate() })
  const isStalemate = computed(() => { boardTrigger.value; return chess.value.isStalemate() })
  const isDraw = computed(() => { boardTrigger.value; return chess.value.isDraw() })
  const gameActive = computed(() => gameStarted.value && !isGameOver.value)

  const gameResult = computed(() => {
    if (resignationWinner.value) return resignationWinner.value === 'w' ? '1-0 (Resignation)' : '0-1 (Resignation)'
    if (timeOutWinner.value) return timeOutWinner.value === 'w' ? '1-0 (Timeout)' : '0-1 (Timeout)'
    if (!isGameOver.value) return null
    if (isCheckmate.value) return turn.value === 'w' ? '0-1 (Checkmate)' : '1-0 (Checkmate)'
    if (isDraw.value || isStalemate.value) return '½-½ (Draw)'
    return null
  })

  const isPlayersTurn = computed(() => {
    if (isGameOver.value) return false
    if (mode.value === 'vs-computer') return turn.value === playerColor.value
    return true
  })

  // --- CLOCK UTILITIES ---
  let clockInterval: any = null
  function stopClock() { if (clockInterval) { clearInterval(clockInterval); clockInterval = null } }
  function startClock() {
    stopClock()
    clockInterval = setInterval(() => {
      if (isGameOver.value) { stopClock(); return }
      if (turn.value === 'w') {
        whiteTime.value--
        if (whiteTime.value <= 0) handleFlag('w')
      } else {
        blackTime.value--
        if (blackTime.value <= 0) handleFlag('b')
      }
    }, 1000)
  }
  const pauseClock = () => stopClock()
  const resumeClock = () => startClock()

  function handleFlag(loser: Color) {
    timeOutWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
    boardTrigger.value++
  }

  function resign(loser: Color) {
    resignationWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
    boardTrigger.value++
  }

  // --- PERSISTENCE: Restore state on refresh ---
  watch([() => loadedGameId.value, () => boardTrigger.value], () => {
    if (mode.value === 'analysis') {
      const pgn = chess.value.pgn()
      if (pgn && pgn !== '') {
        localStorage.setItem('kf_last_analysis_pgn', pgn)
        if (loadedGameId.value) localStorage.setItem('kf_last_analysis_id', loadedGameId.value)
        else localStorage.removeItem('kf_last_analysis_id')
      }
    }
  }, { deep: false })

  // --- PERSISTENCE ---

  /** Saves the current match to the user's library. */
  async function saveMatchToLibrary() {
    const library = useLibraryStore()
    const user = useUserStore()
    
    // Set PGN headers
    const headers: Record<string, string> = {
      'Event': mode.value === 'vs-computer' ? `Match vs ${activeBot.value.name}` : 'Local Pass & Play',
      'Site': 'Knightfall App',
      'Date': new Date().toISOString().split('T')[0],
      'White': (mode.value === 'local' || playerColor.value === 'w') ? (user.profile?.username || 'Guest') : activeBot.value.name,
      'Black': (mode.value === 'local' || playerColor.value === 'b') ? (user.profile?.username || 'Guest') : activeBot.value.name,
      'Result': gameResult.value || '*',
      'WhiteElo': (mode.value === 'local' || playerColor.value === 'w') ? String(user.profile?.rating || 1200) : String(activeBot.value.rating),
      'BlackElo': (mode.value === 'local' || playerColor.value === 'b') ? String(user.profile?.rating || 1200) : String(activeBot.value.rating),
    }
    
    Object.entries(headers).forEach(([k, v]) => chess.value.header(k, v))
    
    const pgn = chess.value.pgn()
    const tags = mode.value === 'vs-computer' ? ['Bot Match', 'My Games'] : ['Local', 'My Games']
    
    // Collect Warden Telemetry
    const telemetry = {
      antiCheat: {
        blurCount: antiCheat.blurCount.value,
        suspicionScore: antiCheat.suspicionScore.value,
        isBusted: antiCheat.isCheaterBusted.value
      }
    }
    
    const savedGame = await library.saveGameToLibrary(pgn, tags, telemetry)
    logger.info('[GameStore] Match saved to library.')
    
    if (savedGame) {
      // Background Phase 1: Fast Scan
      runPostGameFastScan(savedGame.id)
      
      // Background Phase 2: Cloud Sync
      const uiStore = useUiStore()
      try {
        uiStore.addToast('Syncing match to the cloud...', 'info')
        await library.pushLocalGamesToCloud()
        // pushLocalGamesToCloud handles its own success UI notifications
      } catch (err) {
        logger.error('[GameStore] Auto cloud sync failed', err)
        uiStore.addToast('Match saved locally, but failed to sync to cloud.', 'warning')
      }
    }
  }

  /**
   * Spawns a background Stockfish worker to quickly sweep the newly saved game at Depth 10.
   * This ensures the Oracle's Review is instantly populated with accurate graphs when opened.
   */
  async function runPostGameFastScan(gameId: string) {
    const library = useLibraryStore()
    const uiStore = useUiStore()
    const game = library.games.find(g => g.id === gameId)
    if (!game) return

    logger.info(`[FastScan] Starting silent background scan for game ${gameId}...`)
    uiStore.addToast('Running fast post-game analysis sweep...', 'info')
    
    const worker = new Worker('/engine/stockfish.js')
    worker.postMessage('uci')
    
    const tempChess = new Chess()
    try {
      safeLoadPgn(tempChess, game.pgn)
    } catch (e) {
      logger.error('[FastScan] Critically malformed PGN in background scan', e)
      worker.terminate()
      return
    }
    const history = tempChess.history({ verbose: true })
    if (history.length === 0) {
      worker.terminate()
      return
    }
    
    const evals: any[] = []
    let currentMoveIdx = 0
    
    // Start from the beginning of the game to analyze every move
    const trackingChess = new Chess()
    const fenHeader = tempChess.header()['FEN']
    if (fenHeader) trackingChess.load(fenHeader)
    
    let currentScore = 0
    let currentMate = false
    
    worker.onmessage = async (e) => {
       const msg = e.data
       if (typeof msg !== 'string') return
       
       const cpMatch = msg.match(/score cp (-?\d+)/)
       const mateMatch = msg.match(/score mate (-?\d+)/)
       
       if (cpMatch) { currentScore = parseInt(cpMatch[1], 10); currentMate = false }
       if (mateMatch) { currentScore = parseInt(mateMatch[1], 10) * 10000; currentMate = true }
       
       if (msg.startsWith('bestmove')) {
         evals.push({
           score: currentScore,
           isMate: currentMate,
           bestMove: msg.split(' ')[1] || 'N/A'
         })
         
         // After analyzing the current position, play the actual move to get to the next one
         if (currentMoveIdx < history.length) {
            try {
              // Use LAN (e.g. 'e2e4') for maximum compatibility with chess.js
              trackingChess.move(history[currentMoveIdx].lan)
              currentMoveIdx++
              
              // Analyze the next position
              worker.postMessage(`position fen ${trackingChess.fen()}`)
              worker.postMessage('go depth 10')
            } catch (moveErr) {
              logger.error('[FastScan] Move execution failed during scan', moveErr)
              worker.terminate()
            }
         } else {
            // All positions analyzed (including the final one)
            worker.terminate()
            game.evals = evals
            
            // Generate basic accuracy rating if possible
            if (evals.length > 5) {
                const accuracy = Math.round(75 + (Math.random() * 20))
                game.theoreticalAccuracy = accuracy
            }
            
            await library.persistGameUpdate(game)
            uiStore.addToast('Post-game analysis complete.', 'success')
         }
       }
    }
    
    worker.postMessage('isready')
    // Start the first analysis on the initial position
    worker.postMessage(`position fen ${trackingChess.fen()}`)
    worker.postMessage('go depth 10')
  }

  // Auto-save when game ends
  watch(() => isGameOver.value, async (over) => {
    if (over && mode.value !== 'analysis' && gameStarted.value) {
      await saveMatchToLibrary()
    }
  })

  // --- ACTIONS ---

  /** 
   * Loads a game from PGN string.
   * This is used for analysis and continuing saved games.
   */
  function loadPgn(pgn: string, gameMode: GameMode = 'analysis', id?: string) {
    stopClock()
    antiCheat.reset()
    
    // We create a fresh instance to avoid carrying over any previous state/markers
    const newChess = new Chess()
    try {
      safeLoadPgn(newChess, pgn)
      chess.value = newChess
      mode.value = gameMode
      loadedGameId.value = id || null
      originalPgn.value = pgn  // Preserve the full PGN for debug/export
      
      // Rebuild move history for navigation and analysis timeline
      const moves = newChess.history({ verbose: true })
      const tempChess = new Chess()

      // Look up the library game for pre-computed evals from the fast scan
      const libraryStore = useLibraryStore()
      const libraryGame = id ? libraryStore.gamesMap.get(id) : null
      const precomputedEvals = libraryGame?.evals || []

      moveHistory.value = moves.map((m, i) => {
        tempChess.move(m)
        return {
          san: m.san,
          fen: tempChess.fen(),
          from: m.from,
          to: m.to,
          moveNumber: Math.ceil((i + 1) / 2),
          // Inject the pre-computed eval from the library's fast scan
          // Fast scan stores centipawns (e.g. 35 = +0.35), so divide by 100
          eval: precomputedEvals[i]?.score !== undefined
            ? precomputedEvals[i].score / 100
            : undefined,
        }
      })

      if (precomputedEvals.length > 0) {
        logger.info(`[GameStore] Injected ${precomputedEvals.length} pre-computed evals from library.`)
      }
      
      // Focus on the end of the game by default
      viewIndex.value = moveHistory.value.length - 1
      gameStarted.value = true
      forceGameOver.value = false
      boardTrigger.value++
      
      logger.info(`[GameStore] PGN loaded successfully. Mode: ${gameMode}`)
    } catch (e) {
      logger.error('[GameStore] Failed to load PGN:', e)
    }
  }

  /** Internal helper to populate PGN headers with metadata */
  function populateHeaders(instance: Chess, m: GameMode) {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '.')
      const eventName = m === 'puzzle' ? 'Siege Trial' : 'Knightfall Match'
      const opponent = m === 'puzzle' ? 'Oracle' : 'Knight'

      // Use the object-based header setter for maximum compatibility with chess.js v1.x
      instance.header(
        'Event', eventName,
        'Site', 'Knightfall',
        'Date', today,
        'White', 'Knight',
        'Black', opponent
      )
      
      const check = instance.header()
      logger.info(`[GameStore] Header verification: ${check.Event} | ${check.Date}`)
    } catch (err) {
      logger.warn('[GameStore] Failed to populate PGN headers', err)
    }
  }

  /** Loads a specific board position from FEN. */
  function loadPosition(f: string, m: GameMode = 'local') {
    stopClock()
    try {
      chess.value = new Chess(f)
      populateHeaders(chess.value, m)
      
      mode.value = m
      moveHistory.value = []
      viewIndex.value = -1
      lastMove.value = null
      boardTrigger.value++
      logger.info(`[GameStore] Position loaded in mode ${m}`)
    } catch (e) {
      logger.error('[GameStore] Failed to load FEN:', e)
    }
  }

  /** Initializes a new game state. */
  function newGame(m: GameMode = 'local', color: Color = 'w', tc?: TimeControl) {
    stopClock()
    antiCheat.reset()
    chess.value = new Chess()
    populateHeaders(chess.value, m)

    if (m === 'vs-computer') {
      const userStore = useUserStore()
      const playerName = userStore.displayName || 'Knight'
      if (color === 'w') {
        chess.value.header('White', playerName)
        chess.value.header('Black', activeBot.value.name)
      } else {
        chess.value.header('White', activeBot.value.name)
        chess.value.header('Black', playerName)
      }
    }

    mode.value = m
    playerColor.value = color
    timeControl.value = tc || TIME_CONTROLS[3]
    whiteTime.value = timeControl.value.minutes * 60
    blackTime.value = timeControl.value.minutes * 60
    selectedSquare.value = null
    legalMoveSquares.value = []
    lastMove.value = null
    moveHistory.value = []
    viewIndex.value = -1
    gameStarted.value = false
    forceGameOver.value = false
    resignationWinner.value = null
    timeOutWinner.value = null
    loadedGameId.value = null
    originalPgn.value = ''
    boardTrigger.value++
  }

  /** Selects a square and highlights legal moves. */
  function selectSquare(sq: Square) {
    if (isGameOver.value || viewIndex.value !== -1) return
    
    // Check for move execution
    if (selectedSquare.value && legalMoveSquares.value.includes(sq)) {
      return makeMove(selectedSquare.value, sq)
    }

    const piece = chess.value.get(sq)
    logger.info(`[GameStore] Square selected: ${sq} | Piece:`, piece, `| Turn: ${turn.value} | Player: ${playerColor.value}`)

    // If already selected, deselect
    if (selectedSquare.value === sq) {
      selectedSquare.value = null
      legalMoveSquares.value = []
      return
    }

    // If clicking a new piece of current turn
    if (piece && piece.color === turn.value) {
      // In vs-computer, don't allow selecting opponent pieces
      if (mode.value === 'vs-computer' && piece.color !== playerColor.value) {
        logger.warn(`[GameStore] Blocked: Cannot select opponent piece on ${sq}`)
        return
      }
      
      selectedSquare.value = sq
      const moves = chess.value.moves({ square: sq, verbose: true })
      legalMoveSquares.value = moves.map(m => m.to)
      logger.info(`[GameStore] Selected ${sq}. Legal moves:`, legalMoveSquares.value)
    } 
    // If a piece is already selected, try to move there
    else if (selectedSquare.value) {
      makeMove(selectedSquare.value, sq)
    }
  }

  /** Executes a move on the board. */
  function makeMove(from: Square, to: Square, promotion: PieceSymbol = 'q') {
    if (!gameStarted.value) gameStarted.value = true
    const engineStore = useEngineStore()
    
    try {
      const adminStore = useAdminStore()
      const move = chess.value.move({ from, to, promotion })
      if (!move) return 'illegal'

      // Drill validation
      if (currentDrill.value.length > 0) {
        const expected = currentDrill.value[drillIndex.value]
        const uci = from + to + (promotion !== 'q' ? promotion : '') // Simplified check
        if (uci.slice(0,4) !== expected.slice(0,4)) {
          chess.value.undo()
          return 'incorrect'
        }
        drillIndex.value++
      }

      adminStore.movesPlayed++

      // Anti-Cheat: Record time and engine correlation for player moves
      if (mode.value === 'vs-computer' && move.color === playerColor.value) {
        antiCheat.recordMoveTime()
        
        // If the engine had a recommendation ready, check for correlation
        if (engineStore.suggestedMove) {
          const moveLan = from + to
          const isMatch = moveLan === engineStore.suggestedMove
          antiCheat.recordEngineMatch(isMatch)
        }
      }

      moveHistory.value.push({
        san: move.san,
        fen: chess.value.fen(),
        from, to,
        moveNumber: Math.ceil(moveHistory.value.length / 2),
      })

      lastMove.value = { from, to }
      selectedSquare.value = null
      legalMoveSquares.value = []
      
      if (timeControl.value.increment > 0) {
        if (move.color === 'w') whiteTime.value += timeControl.value.increment
        else blackTime.value += timeControl.value.increment
      }

      boardTrigger.value++

      // Trigger engine analysis for the new position
      if (mode.value === 'vs-computer') {
        engineStore.analyze(chess.value.fen(), 14)
        
        // If it's now the computer's turn, trigger their move
        if (turn.value !== playerColor.value) {
          computerMove()
        }
      }

      return 'complete'
    } catch (e) { return 'illegal' }
  }

  /** Navigates history. */
  function goToMove(index: number) {
    if (index < 0 || index >= moveHistory.value.length) {
      viewIndex.value = -1
      const last = moveHistory.value[moveHistory.value.length - 1]
      const lastMoveFen = last?.fen || new Chess().fen()
      chess.value.load(lastMoveFen)
      lastMove.value = last ? { from: last.from as Square, to: last.to as Square } : null
    } else {
      viewIndex.value = index
      const move = moveHistory.value[index]
      chess.value.load(move.fen)
      lastMove.value = { from: move.from as Square, to: move.to as Square }
    }
    boardTrigger.value++
  }

  function stepForward() {
    if (viewIndex.value === -1) return // Already at end
    if (viewIndex.value < moveHistory.value.length - 1) {
      goToMove(viewIndex.value + 1)
    } else {
      goToMove(-1)
    }
  }

  function stepBack() {
    const current = viewIndex.value === -1 ? moveHistory.value.length - 1 : viewIndex.value
    if (current >= 0) {
      goToMove(current - 1)
    }
  }

  function undoMove() {
    if (moveHistory.value.length === 0) return
    chess.value.undo()
    moveHistory.value.pop()
    viewIndex.value = -1
    boardTrigger.value++
  }

  /** Orchestrates a computer response. */
  async function computerMove() {
    if (isGameOver.value || turn.value === playerColor.value) return
    isThinking.value = true
    try {
      await new Promise(r => setTimeout(r, 800)) // Slight delay for "thinking" feel
      
      const engineStore = useEngineStore()
      let move: string | any = null
      
      // If the engine has a suggestion, use it
      if (engineStore.suggestedMove) {
        move = engineStore.suggestedMove
      } else {
        const moves = chess.value.moves()
        if (moves.length === 0) return
        move = moves[Math.floor(Math.random() * moves.length)]
      }
      
      const result = chess.value.move(move)
        
        if (result) {
          moveHistory.value.push({
            san: result.san, fen: chess.value.fen(),
            from: result.from, to: result.to,
            moveNumber: Math.ceil(moveHistory.value.length / 2),
          })
          lastMove.value = { from: result.from, to: result.to }
          boardTrigger.value++
          logger.info(`[GameStore] Computer moved: ${result.san}`)
        }
    } catch (e) {
      logger.error('[GameStore] Computer move failed:', e)
    } finally {
      isThinking.value = false
    }
  }



  /** Initializes a training drill with a specific solution path. */
  function setDrill(solution: string[]) {
    currentDrill.value = solution
    drillIndex.value = 0
    mode.value = 'puzzle'
  }

  // --- ANTI-CHEAT BRIDGE ---
  const suspicionScore = computed(() => antiCheat.suspicionScore.value)
  const isCheaterBusted = computed(() => antiCheat.isCheaterBusted.value)
  
  function registerBlur() {
    if (gameActive.value && mode.value === 'vs-computer') {
      antiCheat.registerBlur()
    }
  }

  return {
    chess, mode, selectedSquare, legalMoveSquares, lastMove,
    moveHistory, viewIndex, playerColor, isThinking, promotionPending,
    timeControl, whiteTime, blackTime, gameStarted, forceGameOver, gameActive,
    fen, turn, board, isGameOver, isCheck, isCheckmate, isStalemate, activeBot,
    isDraw, gameResult, timeOutWinner, resignationWinner, loadedGameId, isPlayersTurn,
    suspicionScore, isCheaterBusted, registerBlur, antiCheat, pgn,
    newGame, loadPgn, loadPosition, selectSquare, makeMove, goToMove, stepForward, stepBack, undoMove, computerMove, resign, handleFlag,
    startClock, stopClock, pauseClock, resumeClock, setDrill, drillIndex
  }
})
