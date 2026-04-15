import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chess } from 'chess.js'
import type { Square, PieceSymbol, Color } from 'chess.js'
import nedImg from '../assets/ned.png'
import tanyaImg from '../assets/tanya.png'
import garyImg from '../assets/gary.png'
import { initAudio } from '../utils/audio'
import { useSettingsStore } from './settingsStore'
import { useLibraryStore } from './libraryStore'
import { useUserStore } from './userStore'
import { supabase } from '../api/supabaseClient'

export type GameMode = 'local' | 'vs-computer' | 'analysis' | 'puzzle'
export type TimeControl = { label: string; minutes: number; increment: number }

export interface Bot {
  id: string
  name: string
  rating: number
  description: string
  avatar: string
  depth: number
  skillLevel: number
}

export const BOTS: Bot[] = [
  { id: 'ned', name: 'Novice Ned', rating: 600, description: 'Friendly and chaotic. Hangs pieces often.', avatar: nedImg, depth: 1, skillLevel: 0 },
  { id: 'tanya', name: 'Tactical Tanya', rating: 1400, description: 'Sharp and aggressive. Look out for forks.', avatar: tanyaImg, depth: 5, skillLevel: 10 },
  { id: 'gary', name: 'Grandmaster Gary', rating: 2800, description: 'An absolute beast. Flawless positional play.', avatar: garyImg, depth: 15, skillLevel: 20 },
]

export interface HistoryEntry {
  san: string
  fen: string
  from: Square
  to: Square
  moveNumber: number
  isCapture: boolean
  isCheck: boolean
}

export const TIME_CONTROLS: TimeControl[] = [
  { label: '1+0',   minutes: 1,  increment: 0 },
  { label: '2+1',   minutes: 2,  increment: 1 },
  { label: '3+0',   minutes: 3,  increment: 0 },
  { label: '5+0',   minutes: 5,  increment: 0 },
  { label: '10+0',  minutes: 10, increment: 0 },
  { label: '10+5',  minutes: 10, increment: 5 },
  { label: '15+10', minutes: 15, increment: 10 },
]

export const useGameStore = defineStore('game', () => {
  const chess = ref(new Chess())
  const mode = ref<GameMode>('local')
  const selectedSquare = ref<Square | null>(null)
  const legalMoveSquares = ref<Square[]>([])
  const lastMove = ref<{ from: Square; to: Square } | null>(null)
  const moveHistory = ref<HistoryEntry[]>([])
  const viewIndex = ref(-1) // -1 = current position
  const playerColor = ref<Color>('w')
  const isThinking = ref(false)
  const promotionPending = ref<{ from: Square; to: Square } | null>(null)
  const timeControl = ref<TimeControl>(TIME_CONTROLS[3]) // 5+0 default
  const whiteTime = ref(0) // seconds
  const blackTime = ref(0)
  const gameStarted = ref(false)
  const forceGameOver = ref(false) // For puzzle completion lock
  const timeOutWinner = ref<Color | null>(null)
  const resignationWinner = ref<Color | null>(null)
  const activeBot = ref<Bot>(BOTS[1])
  const loadedGameId = ref<string | null>(null)
  let sfx: ReturnType<typeof initAudio> | null = null

  // Anti-cheat tracking
  const cheatMetrics = ref({
    blurCount: 0,
    moveTimes: [] as number[],
    lastTurnStartTimestamp: 0
  })

  let botWorker: Worker | null = null
  function initBot() {
    if (!botWorker) {
      botWorker = new Worker('/engine/stockfish.js')
      botWorker.postMessage('uci')
    }
  }

  // Derived
  const fen = computed(() => chess.value.fen())
  const turn = computed(() => chess.value.turn())
  const board = computed(() => chess.value.board())
  const isGameOver = computed(() => forceGameOver.value || chess.value.isGameOver())
  const isCheck = computed(() => chess.value.isCheck())
  const isCheckmate = computed(() => chess.value.isCheckmate())
  const isStalemate = computed(() => chess.value.isStalemate())
  const isDraw = computed(() => chess.value.isDraw())
  const gameResult = computed(() => {
    if (resignationWinner.value) return resignationWinner.value === 'w' ? '1-0 (Resignation)' : '0-1 (Resignation)'
    if (timeOutWinner.value) return timeOutWinner.value === 'w' ? '1-0 (Timeout)' : '0-1 (Timeout)'
    if (!isGameOver.value) return null
    if (isCheckmate.value) return turn.value === 'w' ? '0-1 (Checkmate)' : '1-0 (Checkmate)'
    if (isDraw.value || isStalemate.value) return '½-½ (Draw)'
    return null
  })

  function registerBlur() {
    if (gameStarted.value && !isGameOver.value && mode.value === 'vs-computer') {
      if (turn.value === playerColor.value) {
        cheatMetrics.value.blurCount += 1
      }
    }
  }

  const suspicionScore = computed(() => {
    let score = cheatMetrics.value.blurCount * 26
    const times = cheatMetrics.value.moveTimes
    if (times.length > 4) {
      const mean = times.reduce((a,b)=>a+b, 0) / times.length
      const avgDeviation = times.reduce((a,b)=>a+Math.abs(b-mean), 0) / times.length
      // If average human deviation is < 500ms over 5 moves, it's highly robotic
      if (avgDeviation < 500) score += 40
    }
    return Math.min(score, 100)
  })

  const isCheaterBusted = computed(() => suspicionScore.value > 75)

  function newGame(m: GameMode = 'local', color: Color = 'w', tc?: TimeControl) {
    chess.value = new Chess()
    selectedSquare.value = null
    legalMoveSquares.value = []
    lastMove.value = null
    moveHistory.value = []
    viewIndex.value = -1
    mode.value = m
    playerColor.value = color
    isThinking.value = false
    promotionPending.value = null
    if (tc) timeControl.value = tc
    whiteTime.value = timeControl.value.minutes * 60
    blackTime.value = timeControl.value.minutes * 60
    gameStarted.value = false
    forceGameOver.value = false
    timeOutWinner.value = null
    resignationWinner.value = null
    loadedGameId.value = null
    cheatMetrics.value = { blurCount: 0, moveTimes: [], lastTurnStartTimestamp: 0 }
  }

  function loadPosition(fenStr: string, m: GameMode = 'local', tc?: TimeControl) {
    newGame(m, 'w', tc)
    chess.value = new Chess(fenStr)
  }

  function loadPgn(pgn: string, m: GameMode = 'analysis', gameId: string | null = null) {
    newGame(m)
    loadedGameId.value = gameId
    chess.value.loadPgn(pgn)
    
    // Reconstruct move history from the loaded game
    const history = chess.value.history({ verbose: true })
    const startingFen = chess.value.header()['FEN'] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const tempChess = new Chess(startingFen)
    moveHistory.value = history.map((move, i) => {
      tempChess.move(move.san)
      return {
        san: move.san,
        fen: tempChess.fen(),
        from: move.from as Square,
        to: move.to as Square,
        moveNumber: Math.ceil((i + 1) / 2),
        isCapture: !!move.captured,
        isCheck: move.san.includes('+') || move.san.includes('#')
      }
    })
    
    // Set view to the last move by default
    viewIndex.value = moveHistory.value.length - 1
  }

  function selectSquare(sq: Square) {
    if (isGameOver.value) return
    if (viewIndex.value !== -1) return // don't allow moves in replay mode

    const piece = chess.value.get(sq)
    // If a square is already selected
    if (selectedSquare.value) {
      if (legalMoveSquares.value.includes(sq)) {
        // check promotion
        const fromPiece = chess.value.get(selectedSquare.value)
        if (fromPiece?.type === 'p') {
          const toRank = sq[1]
          if ((fromPiece.color === 'w' && toRank === '8') || (fromPiece.color === 'b' && toRank === '1')) {
            promotionPending.value = { from: selectedSquare.value, to: sq }
            selectedSquare.value = null
            legalMoveSquares.value = []
            return
          }
        }
        makeMove(selectedSquare.value, sq)
      } else if (piece && piece.color === turn.value) {
        selectedSquare.value = sq
        legalMoveSquares.value = chess.value.moves({ square: sq, verbose: true }).map(m => m.to as Square)
      } else {
        selectedSquare.value = null
        legalMoveSquares.value = []
      }
    } else {
      if (piece && piece.color === turn.value) {
        // In vs-computer mode only allow player's color
        if (mode.value === 'vs-computer' && piece.color !== playerColor.value) return
        selectedSquare.value = sq
        legalMoveSquares.value = chess.value.moves({ square: sq, verbose: true }).map(m => m.to as Square)
      }
    }
  }

  function makeMove(from: Square, to: Square, promotion: PieceSymbol = 'q') {
    if (!gameStarted.value) {
      gameStarted.value = true
      cheatMetrics.value.lastTurnStartTimestamp = Date.now()
    }

    // Capture anti-cheat variance before moving
    if (mode.value === 'vs-computer' && turn.value === playerColor.value && cheatMetrics.value.lastTurnStartTimestamp > 0) {
       const delta = Date.now() - cheatMetrics.value.lastTurnStartTimestamp
       cheatMetrics.value.moveTimes.push(delta)
    }

    const result = chess.value.move({ from, to, promotion })
    if (!result) return
    
    // Audio SFX
    const settings = useSettingsStore()
    if (settings.soundEnabled) {
      try {
        if (!sfx) sfx = initAudio()
        if (result.san.includes('+') || result.san.includes('#')) sfx.check()
        else if (result.captured) sfx.capture()
        else sfx.move()
      } catch (e) {
        // block user interaction audio errors silently
      }
    }

    const moveNum = Math.ceil(moveHistory.value.length / 2) + 1
    moveHistory.value.push({
      san: result.san,
      fen: chess.value.fen(),
      from,
      to,
      moveNumber: moveNum,
      isCapture: !!result.captured,
      isCheck: result.san.includes('+'),
    })
    lastMove.value = { from, to }
    selectedSquare.value = null
    legalMoveSquares.value = []
    viewIndex.value = -1

    // Reset timestamp for next player
    if (mode.value === 'vs-computer' && turn.value === playerColor.value) {
       cheatMetrics.value.lastTurnStartTimestamp = Date.now()
    }

    // Add increment
    if (timeControl.value.increment > 0) {
      if (result.color === 'w') whiteTime.value += timeControl.value.increment
      else blackTime.value += timeControl.value.increment
    }
  }

  function completePromotion(piece: PieceSymbol) {
    if (!promotionPending.value) return
    makeMove(promotionPending.value.from, promotionPending.value.to, piece)
    promotionPending.value = null
  }

  function goToMove(index: number) {
    if (index < 0 || index >= moveHistory.value.length) {
      viewIndex.value = -1
      chess.value.load(moveHistory.value[moveHistory.value.length - 1]?.fen || new Chess().fen())
    } else {
      viewIndex.value = index
      chess.value.load(moveHistory.value[index].fen)
    }
  }

  function stepBack() {
    const cur = viewIndex.value === -1 ? moveHistory.value.length - 1 : viewIndex.value
    if (cur > 0) goToMove(cur - 1)
  }

  function stepForward() {
    if (viewIndex.value === -1) return
    if (viewIndex.value < moveHistory.value.length - 1) {
      goToMove(viewIndex.value + 1)
    } else {
      viewIndex.value = -1
    }
  }

  function undoMove() {
    if (moveHistory.value.length === 0) return
    chess.value.undo()
    moveHistory.value.pop()
    lastMove.value = moveHistory.value.length > 0
      ? { from: moveHistory.value[moveHistory.value.length - 1].from, to: moveHistory.value[moveHistory.value.length - 1].to }
      : null
    viewIndex.value = -1
  }

  async function computerMove() {
    if (isGameOver.value) return
    isThinking.value = true
    initBot()
    
    await new Promise(r => setTimeout(r, 600))

    return new Promise<void>(resolve => {
      botWorker!.onmessage = (e) => {
        const msg = e.data
        if (typeof msg === 'string' && msg.startsWith('bestmove')) {
          const mainMove = msg.split(' ')[1]
          if (mainMove && mainMove !== '(none)') {
            const from = mainMove.substring(0, 2) as Square
            const to = mainMove.substring(2, 4) as Square
            const promotion = mainMove.length > 4 ? mainMove[4] as PieceSymbol : undefined
            makeMove(from, to, promotion)
          }
          isThinking.value = false
          resolve()
        }
      }
      botWorker!.postMessage(`setoption name Skill Level value ${activeBot.value.skillLevel}`)
      botWorker!.postMessage(`position fen ${fen.value}`)
      botWorker!.postMessage(`go depth ${activeBot.value.depth}`)
    })
  }

  function resign(loser: Color) {
    resignationWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
  }

  function handleFlag(loser: Color) {
    timeOutWinner.value = loser === 'w' ? 'b' : 'w'
    forceGameOver.value = true
  }

  watch(isGameOver, async (over) => {
    if (over && gameStarted.value && (mode.value === 'vs-computer' || mode.value === 'local')) {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      
      const isWhite = playerColor.value === 'w'
      // Pass & Play mode: white always starts first, playerColor is 'w' by default
      const playerName = userStore.profile?.username || 'Guest'
      const oppName = mode.value === 'vs-computer' ? activeBot.value.name : 'Player 2'
      
      // Set PGN headers for the capture
      const headers = {
        'Event': mode.value === 'vs-computer' ? `Match vs ${oppName}` : 'Local Match',
        'Site': 'Knightfall',
        'Date': new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        'Round': '1',
        'White': (mode.value === 'local' || isWhite) ? playerName : oppName,
        'Black': (mode.value === 'local' || isWhite) ? oppName : playerName,
        'Result': gameResult.value || '*',
        'WhiteElo': ((mode.value === 'local' || isWhite) ? userStore.profile?.rating?.toString() : activeBot.value.rating.toString()) || '1200',
        'BlackElo': ((mode.value === 'local' || isWhite) ? activeBot.value.rating.toString() : userStore.profile?.rating?.toString()) || '1200',
        'PlyCount': (chess.value.history().length).toString()
      }
      Object.entries(headers).forEach(([k, v]) => chess.value.setHeader(k, v))
      
      const pgn = chess.value.pgn()
      
      // 1. Save to local Vault
      await libraryStore.saveGameToLibrary(pgn, ['My Games'])

      // 2. Save to cloud (vs-computer only)
      if (mode.value === 'vs-computer') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('matches').insert({
            white_id: isWhite ? session.user.id : null,
            black_id: !isWhite ? session.user.id : null,
            pgn: pgn,
            result: gameResult.value
          })
        }
      }
    }
  })

  return {
    chess, mode, selectedSquare, legalMoveSquares, lastMove,
    moveHistory, viewIndex, playerColor, isThinking, promotionPending,
    timeControl, whiteTime, blackTime, gameStarted, forceGameOver,
    fen, turn, board, isGameOver, isCheck, isCheckmate, isStalemate, activeBot,
    isDraw, gameResult, timeOutWinner, resignationWinner, cheatMetrics, suspicionScore, isCheaterBusted, loadedGameId,
    newGame, loadPosition, loadPgn, selectSquare, makeMove, completePromotion,
    goToMove, stepBack, stepForward, undoMove, computerMove, resign, handleFlag, registerBlur
  }
})
