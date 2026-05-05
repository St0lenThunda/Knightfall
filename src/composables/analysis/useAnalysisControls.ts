import { useGameStore } from '../../stores/gameStore'

/**
 * Pillar Composable: useAnalysisControls
 * 
 * Manages the high-level PGN import and navigation logic for 
 * the analysis session.
 */
export function useAnalysisControls() {
  const store = useGameStore()

  /**
   * Navigates to the very end of the current move history.
   */
  function goToEnd() {
    if (store.moveHistory.length > 0) {
      store.goToMove(store.moveHistory.length - 1)
    } else {
      store.goToMove(-1)
    }
  }

  /**
   * Imports a raw PGN string into the game store.
   */
  function importPgnStr(pgn: string) {
    store.loadPgn(pgn, 'analysis')
  }


  /**
   * Loads a predefined demo sequence for the Academy/Analysis showcase.
   */
  function loadDemo() {
    importPgnStr('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6')
  }

  return {
    goToEnd,
    importPgnStr,
    loadDemo
  }
}
