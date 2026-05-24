import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useCoachStore } from '../stores/coachStore'
import { useUiStore } from '../stores/uiStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { fetchPuzzleBatch, fetchPuzzleById, fetchLichessDaily, type Puzzle } from '../api/puzzleApi'
import { fetchChesscomDailyPuzzle } from '../api/chesscomApi'
import { useRoute } from 'vue-router'
import { Chess, type Square, type PieceSymbol } from 'chess.js'
import { getPuzzleExplanation, calculateTimeBonus, calculatePuzzleXP } from '../utils/tacticalHeuristics'
import { logger } from '../utils/logger'

/**
 * usePuzzleLogic
 * 
 * Orchestrates the business logic for the Siege Trials (Puzzles).
 * Handles state for hints, attempts, success overlays, and puzzle transitions.
 */
export function usePuzzleLogic() {
  const store = useGameStore()
  const userStore = useUserStore()
  const coachStore = useCoachStore()
  const uiStore = useUiStore()
  const curriculumStore = useCurriculumStore()
  const route = useRoute()

  // --- STATE ---
  const currentPuzzle = ref<Puzzle | null>(null)
  const puzzleSolved = ref(false)
  const introDismissed = ref(false)
  const solutionUsed = ref(false)
  const hintLevel = ref(0)
  const maxHintLevel = ref(0)
  const attemptCount = ref(0)
  const puzzleStartTime = ref(Date.now())
  const timeTakenNow = ref(0)
  const timeTakenFinal = ref(0)
  const xpGainedFinal = ref(0)
  const bonusLabelFinal = ref('')
  const showDiscardConfirm = ref(false)
  const showSuccessOverlay = ref(false)
  const isLoading = ref(false)
  const puzzleStep = ref(0)
  const queuePuzzles = ref<Puzzle[]>([])
  const activeCat = ref(route.query.personal ? 'Personal Mistake' : (coachStore.archetypeReport.category || 'mixed'))

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let isFirstLoad = true

  // --- COMPUTED ---
  const puzzleColor = computed(() => {
    if (!currentPuzzle.value) return 'w'
    return currentPuzzle.value.fen.split(' ')[1] as 'w' | 'b'
  })

  const puzzle = computed(() => ({
    id: currentPuzzle.value?.id || '----',
    title: currentPuzzle.value?.title || 'Loading...',
    difficulty: currentPuzzle.value?.rating || '?',
    toMove: (puzzleColor.value === 'w' ? 'white' : 'black') as 'white' | 'black',
    hint: 'Look for forced moves or piece targets in ' + (currentPuzzle.value?.category || 'this position')
  }))

  const isMatePuzzle = computed(() => currentPuzzle.value?.themes?.includes('mate') || false)
  const movesToSolve = computed(() => currentPuzzle.value ? Math.ceil(currentPuzzle.value.solution.length / 2) : 0)

  const hintSquares = computed(() => {
    if (hintLevel.value < 1 || !currentPuzzle.value) return []
    const expected = currentPuzzle.value.solution[puzzleStep.value]
    return expected ? [expected.slice(0, 2)] : []
  })

  const hintArrows = computed(() => {
    if (hintLevel.value < 2 || !currentPuzzle.value) return []
    const expected = currentPuzzle.value.solution[puzzleStep.value]
    return expected ? [{ from: expected.slice(0, 2), to: expected.slice(2, 4), type: 'suggestion' as const }] : []
  })

  const weakness = computed(() => coachStore.archetypeReport)
  
  const puzzleExplanation = computed(() => 
    getPuzzleExplanation(currentPuzzle.value)
  )

  // --- ACTIONS ---

  function startTraining() {
    introDismissed.value = true
    puzzleStartTime.value = Date.now()
  }

  async function loadNextPuzzle(skipped = false) {
    if (isLoading.value) return
    isLoading.value = true
    
    try {
      if (skipped && currentPuzzle.value && !puzzleSolved.value) {
      const timeTaken = Math.round((Date.now() - puzzleStartTime.value) / 1000)
      userStore.submitPuzzleAttempt(
        currentPuzzle.value.id,
        false,
        Math.max(1, attemptCount.value),
        timeTaken,
        maxHintLevel.value,
        currentPuzzle.value.themes || []
      )
    }

    puzzleSolved.value = false
    showSuccessOverlay.value = false
    introDismissed.value = false
    solutionUsed.value = false
    hintLevel.value = 0
    maxHintLevel.value = 0
    attemptCount.value = 0
    timeTakenNow.value = 0
    puzzleStartTime.value = Date.now()
    
    // Safety check: don't load if we're already loading something else
    if (store.isThinking) return 
    store.forceGameOver = false
    
    // Check if we should automatically fetch and load today's Lichess Daily Puzzle
    let loadedDaily = false
    if (isFirstLoad && !route.query.personal) {
      // Ensure we mark isFirstLoad false immediately to avoid loops on subsequent calls
      isFirstLoad = false
      try {
        const dailyPuzzle = await fetchLichessDaily()
        if (dailyPuzzle) {
          // Check if this specific daily puzzle was already solved or attempted by the user
          const alreadyAttempted = userStore.puzzleAttempts.some(
            attempt => attempt.puzzle_id === dailyPuzzle.id
          )
          
          if (!alreadyAttempted) {
            // Load the Lichess Daily Puzzle as the active puzzle
            currentPuzzle.value = dailyPuzzle
            store.loadPosition(dailyPuzzle.fen, 'puzzle')
            store.playerColor = puzzleColor.value
            puzzleStep.value = 0
            puzzleStartTime.value = Date.now()
            loadedDaily = true
            logger.info(`[PuzzleLogic] Automatically loaded Lichess Daily Puzzle: ${dailyPuzzle.id}`)
          } else {
            logger.info(`[PuzzleLogic] Lichess Daily Puzzle ${dailyPuzzle.id} already attempted today. Skipping auto-load.`)
          }
        }
      } catch (err) {
        logger.error('[PuzzleLogic] Failed to automatically load Lichess Daily Puzzle:', err)
      }
    }

    if (!loadedDaily) {
      if (queuePuzzles.value.length === 0) {
        if (activeCat.value === 'Personal Mistake') {
          if (curriculumStore.personalPuzzles.length === 0) {
            await curriculumStore.generatePersonalPuzzles()
          }
          if (queuePuzzles.value.length === 0) {
            queuePuzzles.value = [...curriculumStore.personalPuzzles]
          }
        }

        if (queuePuzzles.value.length === 0) {
          const now = new Date()
          const queue = userStore.puzzleQueue || []
          const due = queue
            .filter(q => new Date(q.next_review) <= now)
            .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime())
            .slice(0, 10)

          if (due.length > 0) {
            uiStore.addToast(`Loading ${due.length} review puzzles...`, 'info')
            for (const item of due) {
              const p = await fetchPuzzleById(item.puzzle_id)
              if (p) queuePuzzles.value.push(p)
            }
          }
        }

        if (queuePuzzles.value.length === 0) {
          queuePuzzles.value = await fetchPuzzleBatch(activeCat.value, 4)
        }
      }
      
      currentPuzzle.value = queuePuzzles.value.shift() || null
      if (currentPuzzle.value) {
        store.loadPosition(currentPuzzle.value.fen, 'puzzle')
        store.playerColor = puzzleColor.value
      }
      puzzleStep.value = 0
      puzzleStartTime.value = Date.now()

      if (queuePuzzles.value.length < 3 && activeCat.value !== 'Personal Mistake') {
        const more = await fetchPuzzleBatch(activeCat.value, 3)
        queuePuzzles.value.push(...more)
      }
    }
    } finally {
      isLoading.value = false
    }
  }

  function showHint() {
    if (hintLevel.value >= 2 || puzzleSolved.value) return
    hintLevel.value++
    if (hintLevel.value > maxHintLevel.value) maxHintLevel.value = hintLevel.value
    
    if (hintLevel.value === 1) uiStore.addToast('💡 Piece highlighted. Look closely...', 'warning', 3000)
    else if (hintLevel.value === 2) uiStore.addToast('💡 Path revealed.', 'warning', 3000)
  }

  async function revealSolution() {
    if (!currentPuzzle.value || puzzleSolved.value) return
    solutionUsed.value = true
    
    const playRemaining = async () => {
      if (!currentPuzzle.value || puzzleSolved.value) return
      if (puzzleStep.value % 2 === 0) {
        const expected = currentPuzzle.value.solution[puzzleStep.value]
        if (expected) {
          store.makeMove(expected.slice(0,2) as Square, expected.slice(2,4) as Square, (expected[4] || 'q') as PieceSymbol)
        }
      }
      if (!puzzleSolved.value) setTimeout(playRemaining, 800)
    }

    uiStore.addToast('Oracle revealing the path...', 'info')
    playRemaining()
  }

  async function setCat(id: string) {
    activeCat.value = id
    await loadNextPuzzle()
  }

  async function importLichessDaily() {
    const dailyPuzzle = await fetchLichessDaily()
    if (dailyPuzzle) {
      currentPuzzle.value = dailyPuzzle
      activeCat.value = 'mixed'
    }
  }

  async function importChesscomDaily() {
    const data = await fetchChesscomDailyPuzzle()
    if (data) {
      // Educational Note: Chess.com returns the solution moves within a PGN string.
      // We parse this PGN with the Chess.js engine to extract the full legal move history,
      // then convert each move back to UCI coordinate format (e.g. 'e2e4') expected by Knightfall's UI.
      let solution: string[] = []
      try {
        const chess = new Chess()
        chess.loadPgn(data.pgn)
        solution = chess.history({ verbose: true }).map(
          (m) => m.from + m.to + (m.promotion || '')
        )
      } catch (err) {
        logger.error('[PuzzleLogic] Failed to parse Chess.com daily PGN:', err)
      }

      currentPuzzle.value = {
        id: `chesscom-daily`,
        title: data.title || 'Chess.com Daily Puzzle',
        rating: 1500,
        themes: ['Daily Challenge'],
        fen: data.fen,
        lastMove: '', 
        solution: solution, 
        category: 'External'
      }
      activeCat.value = 'mixed'
    }
  }

  async function confirmDiscard() {
    if (!currentPuzzle.value) return
    showDiscardConfirm.value = false
    await curriculumStore.discardPuzzle(currentPuzzle.value.id)
    loadNextPuzzle(true)
  }

  // --- LIFECYCLE & WATCHERS ---
  onMounted(async () => {
    // Initial load
    await loadNextPuzzle()

    timerInterval = setInterval(() => {
      if (!puzzleSolved.value && introDismissed.value) {
        timeTakenNow.value = Math.round((Date.now() - puzzleStartTime.value) / 1000)
      }
    }, 1000)
  })

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
  })

  watch(() => store.moveHistory.length, (newLen, oldLen) => {
    if (newLen !== oldLen) hintLevel.value = 0
    if (newLen > oldLen && currentPuzzle.value && !puzzleSolved.value && store.mode === 'puzzle') {
      const lastM = store.moveHistory[newLen - 1]
      const uci = lastM.from + lastM.to + (lastM.promotion || '') 
      const expected = currentPuzzle.value.solution[puzzleStep.value]

      logger.info(`[Puzzle] Step: ${puzzleStep.value}, UCI: ${uci}, Expected: ${expected}`)

      if (uci === expected || uci.slice(0,4) === expected.slice(0,4)) {
        puzzleStep.value++
        logger.info(`[Puzzle] Correct! Next Step: ${puzzleStep.value}`)

        if (puzzleStep.value >= currentPuzzle.value.solution.length) {
          if (puzzleSolved.value) return
          puzzleSolved.value = true
          hintLevel.value = 0
          timeTakenFinal.value = timeTakenNow.value
          const bonus = calculateTimeBonus(timeTakenFinal.value)
          
          userStore.submitPuzzleAttempt(currentPuzzle.value.id, true, Math.max(1, attemptCount.value), timeTakenFinal.value, maxHintLevel.value, currentPuzzle.value.themes || [])

          if (activeCat.value === 'Personal Mistake') {
            curriculumStore.discardPuzzle(currentPuzzle.value.id)
          }

          if (!solutionUsed.value) {
            const { totalXp } = calculatePuzzleXP(timeTakenFinal.value)
            xpGainedFinal.value = totalXp
            bonusLabelFinal.value = bonus.label
            userStore.addXP(xpGainedFinal.value)
          } else {
            xpGainedFinal.value = 0
            bonusLabelFinal.value = ''
          }
          
          store.forceGameOver = true 
          
          // Delay the success overlay slightly so the user can see the final move land.
          setTimeout(() => {
            showSuccessOverlay.value = true
          }, 1200)
        } else if (puzzleStep.value % 2 !== 0) {
          hintLevel.value = 0
          uiStore.addToast('Good move! Keep going...', 'info', 2000)
          const oppMove = currentPuzzle.value.solution[puzzleStep.value]
          
          logger.info(`[Puzzle] Triggering opponent move: ${oppMove}`)

          setTimeout(() => {
            if (!puzzleSolved.value) {
              logger.info(`[Puzzle] Executing opponent move: ${oppMove}`)
              store.makeMove(oppMove.slice(0,2) as Square, oppMove.slice(2,4) as Square, (oppMove[4] || 'q') as PieceSymbol)
            }
          }, 400)
        }
      } else if (puzzleStep.value % 2 === 0) {
        logger.warn(`[Puzzle] Incorrect move! Expected ${expected}, got ${uci}`)
        store.undoMove()
        attemptCount.value++
        uiStore.addToast('Incorrect. That move loses the advantage.', 'error')
      }
    }
  })

  return {
    store, userStore, coachStore, uiStore, curriculumStore,
    currentPuzzle, puzzleSolved, introDismissed, solutionUsed,
    hintLevel, maxHintLevel, attemptCount, puzzleStartTime,
    timeTakenNow, timeTakenFinal, xpGainedFinal, bonusLabelFinal,
    showDiscardConfirm, showSuccessOverlay, puzzleStep, queuePuzzles,
    activeCat, puzzleColor, puzzle, isMatePuzzle, movesToSolve,
    hintSquares, hintArrows, weakness, puzzleExplanation,
    startTraining, loadNextPuzzle, showHint, revealSolution,
    setCat, importLichessDaily, importChesscomDaily, confirmDiscard
  }
}
