import { ref } from 'vue'
import type { Color } from 'chess.js'

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

/**
 * useGameClock
 * 
 * Manages the temporal state of a chess match.
 * Handles countdowns, increments, and flagging.
 */
export function useGameClock() {
  const timeControl = ref<TimeControl>(TIME_CONTROLS[3])
  const whiteTime = ref(600)
  const blackTime = ref(600)
  const timeOutWinner = ref<Color | null>(null)
  
  let clockInterval: ReturnType<typeof setInterval> | null = null

  function stopClock() {
    if (clockInterval) {
      clearInterval(clockInterval)
      clockInterval = null
    }
  }

  /**
   * Starts the ticking countdown for the current turn.
   */
  function startClock(turn: Color, isGameOver: boolean, onFlag: (loser: Color) => void) {
    stopClock()
    if (isGameOver) return

    clockInterval = setInterval(() => {
      if (turn === 'w') {
        whiteTime.value--
        if (whiteTime.value <= 0) onFlag('w')
      } else {
        blackTime.value--
        if (blackTime.value <= 0) onFlag('b')
      }
    }, 1000)
  }

  function resetTimes() {
    whiteTime.value = timeControl.value.minutes * 60
    blackTime.value = timeControl.value.minutes * 60
    timeOutWinner.value = null
    stopClock()
  }

  function setTimeControl(tc: TimeControl) {
    timeControl.value = tc
    resetTimes()
  }

  function applyIncrement(color: Color) {
    if (color === 'w') whiteTime.value += timeControl.value.increment
    else blackTime.value += timeControl.value.increment
  }

  return {
    timeControl,
    whiteTime,
    blackTime,
    timeOutWinner,
    startClock,
    stopClock,
    resetTimes,
    setTimeControl,
    applyIncrement
  }
}
