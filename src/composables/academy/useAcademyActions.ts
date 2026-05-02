import { useRouter } from 'vue-router'
import { useLibraryStore } from '../../stores/libraryStore'
import { useCurriculumStore } from '../../stores/curriculumStore'
import { useUserStore } from '../../stores/userStore'

/**
 * Pillar Composable: useAcademyActions
 * 
 * Orchestrates user interactions in the Academy, including scanning for 
 * mistakes, recalibrating the path, and navigation.
 */
export function useAcademyActions() {
  const router = useRouter()
  const libraryStore = useLibraryStore()
  const curriculumStore = useCurriculumStore()
  const userStore = useUserStore()

  /**
   * Triggers a cloud-based scan of the user's library to harvest mistakes.
   */
  async function scanForMistakes() {
    await libraryStore.analyzeLibraryWithCloud(15)
  }

  /**
   * Recalibrates the personalized path by sequencing new puzzles.
   */
  async function recalibratePath() {
    await curriculumStore.generatePersonalPuzzles()
  }

  /**
   * Navigates to a specific lesson.
   */
  function openLesson(id: string) {
    router.push(`/lesson/${id}`)
  }

  /**
   * Navigates to the puzzle viewer with a specific personal blunder loaded.
   */
  function openPersonalPuzzle(id: string) {
    router.push(`/puzzles?personal=${id}`)
  }

  /**
   * Marks a lesson as complete.
   */
  function toggleComplete(id: string) {
    if (!userStore.completedLessons.includes(id)) {
      userStore.markLessonComplete(id)
    }
  }

  return {
    scanForMistakes,
    recalibratePath,
    openLesson,
    openPersonalPuzzle,
    toggleComplete,
    isProcessing: () => libraryStore.isProcessingIntegrity,
    isGenerating: () => curriculumStore.isGenerating
  }
}
