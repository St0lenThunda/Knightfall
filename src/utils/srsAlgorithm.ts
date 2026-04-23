/**
 * Spaced Repetition System (SRS) Logic - SM-2 Algorithm
 * 
 * Used to calculate the next review date for a puzzle or mistake
 * based on the user's performance (quality score).
 */

export interface SRSState {
  easeFactor: number    // Default 2.5
  interval: number      // Days until next review
  masteryLevel: number  // Number of successful reviews
}

export interface SRSResult extends SRSState {
  nextReviewAt: Date
}

export class SRSAlgorithm {
  /**
   * Computes the next interval and review date using the SM-2 formula.
   * 
   * @param quality - Score from 0 to 5
   * @param currentState - Current SRS properties (from DB)
   */
  static calculateNextReview(quality: number, currentState: SRSState): SRSResult {
    let { easeFactor, interval, masteryLevel } = currentState

    // 1. Calculate New Ease Factor (EF)
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // We clamp it to a minimum of 1.3
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (easeFactor < 1.3) easeFactor = 1.3

    // 2. Calculate New Interval (I)
    if (quality < 3) {
      // If failed (q < 3), reset interval but keep mastery level
      interval = 1
      masteryLevel = 0
    } else {
      // If success (q >= 3)
      if (masteryLevel === 0) {
        interval = 1
      } else if (masteryLevel === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * easeFactor)
      }
      masteryLevel++
    }

    // 3. Calculate Date
    const nextReviewAt = new Date()
    nextReviewAt.setDate(nextReviewAt.getDate() + interval)

    return {
      easeFactor,
      interval,
      masteryLevel,
      nextReviewAt
    }
  }

  /**
   * Maps Knightfall puzzle performance to SM-2 quality (0-5).
   */
  static mapPerformanceToQuality(solved: boolean, attempts: number, hintsUsed: number): number {
    if (!solved) return 1
    
    if (attempts === 1 && hintsUsed === 0) return 5 // Perfect
    if (attempts <= 2 && hintsUsed === 0) return 4  // Good
    if (hintsUsed > 0) return 3                    // Assisted
    
    return 2 // Struggled
  }
}
