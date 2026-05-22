import { useRouter } from 'vue-router'
import { useLibraryStore } from '../../stores/libraryStore'
import { useCurriculumStore, type Quest } from '../../stores/curriculumStore'

/**
 * Pillar Composable: useSanctumActions
 * 
 * Orchestrates user interactions in the Sanctum, including scanning for 
 * mistakes in chess matches, generating personalized lessons, and handling
 * navigation to different types of curriculum Quests.
 */
export function useSanctumActions() {
  const router = useRouter()
  const libraryStore = useLibraryStore()
  const curriculumStore = useCurriculumStore()

  /**
   * Triggers a cloud-based scan of the user's game library to harvest new blunders.
   * This scan searches analyzed games for tactical slip-ups and saves them.
   */
  async function scanForMistakes() {
    await libraryStore.analyzeLibraryWithCloud(15)
  }

  /**
   * Recalibrates the personalized path by generating new puzzles from
   * harvested blunders.
   */
  async function recalibratePath() {
    await curriculumStore.generatePersonalPuzzles()
  }

  /**
   * Navigates the player to the appropriate view for a given Quest.
   * Chronicle (narrative-first foundations) quests route to `/learn/:id`.
   * Trial (interactive puzzle-drills) quests route to `/lesson/:id`.
   * 
   * @param quest - The learning Quest object to navigate to
   */
  function openQuest(quest: Quest) {
    if (quest.questType === 'chronicle') {
      router.push(`/learn/${quest.id}`)
    } else {
      router.push(`/lesson/${quest.id}`)
    }
  }

  /**
   * Navigates to the puzzle viewer with a specific personal blunder loaded.
   * 
   * @param id - The unique identifier of the personal blunder puzzle
   */
  function openPersonalPuzzle(id: string) {
    router.push(`/puzzles?personal=${id}`)
  }

  return {
    scanForMistakes,
    recalibratePath,
    openQuest,
    openPersonalPuzzle,
    isProcessing: () => libraryStore.isProcessingIntegrity,
    isGenerating: () => curriculumStore.isGenerating
  }
}

