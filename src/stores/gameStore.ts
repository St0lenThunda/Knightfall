import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Chess } from 'chess.js'
import type { Square, PieceSymbol, Color } from 'chess.js'

export type GameMode = 'local' | 'vs-computer' | 'analysis' | 'puzzle'
export type TimeControl = { label: string; minutes: number; increment: number }

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
    if (!isGameOver.value) return null
    if (isCheckmate.value) return turn.value === 'w' ? '0-1' : '1-0'
    if (isDraw.value || isStalemate.value) return '½-½'
    return null
  })

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
  }

  function loadPosition(fenStr: string, m: GameMode = 'local', tc?: TimeControl) {
    newGame(m, 'w', tc)
    chess.value = new Chess(fenStr)
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
    if (!gameStarted.value) gameStarted.value = true
    const result = chess.value.move({ from, to, promotion })
    if (!result) return
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

  // Simple random computer move
  async function computerMove() {
    if (isGameOver.value) return
    isThinking.value = true
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600))
    const moves = chess.value.moves({ verbose: true })
    if (moves.length > 0) {
      // Slightly prefer captures
      const captures = moves.filter(m => m.captured)
      const pool = captures.length > 0 && Math.random() > 0.4 ? captures : moves
      const m = pool[Math.floor(Math.random() * pool.length)]
      makeMove(m.from as Square, m.to as Square)
    }
    isThinking.value = false
  }

  return {
    chess, mode, selectedSquare, legalMoveSquares, lastMove,
    moveHistory, viewIndex, playerColor, isThinking, promotionPending,
    timeControl, whiteTime, blackTime, gameStarted, forceGameOver,
    fen, turn, board, isGameOver, isCheck, isCheckmate, isStalemate,
    isDraw, gameResult,
    newGame, loadPosition, selectSquare, makeMove, completePromotion,
    goToMove, stepBack, stepForward, undoMove, computerMove,
  }
})
