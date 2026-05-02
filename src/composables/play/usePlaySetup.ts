import { ref } from 'vue'
import type { Color } from 'chess.js'
import { TIME_CONTROLS, type GameMode, type TimeControl } from '../../stores/gameStore'

/**
 * Pillar Composable: usePlaySetup
 * 
 * Manages the state and configuration for the New Game setup process.
 * Separates the UI selection state from the core game engine.
 */
export function usePlaySetup() {
  const selectedMode = ref<GameMode>('local')
  const selectedColor = ref<Color>('w')
  const selectedTc = ref<TimeControl>(TIME_CONTROLS[3])

  const modes: { id: GameMode; icon: string; label: string }[] = [
    { id: 'local', icon: '🤝', label: 'Pass & Play' },
    { id: 'vs-computer', icon: '🤖', label: 'vs Computer' },
  ]

  const colors: { value: Color; icon: string; label: string }[] = [
    { value: 'b', icon: '♚', label: 'Black side' },
    { value: 'w', icon: '♔', label: 'White side' },
  ]

  return {
    selectedMode,
    selectedColor,
    selectedTc,
    modes,
    colors
  }
}
