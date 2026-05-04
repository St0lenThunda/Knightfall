/**
 * Tactical Heuristics & Coaching Engine
 * 
 * Provides automated rationales and scoring bonuses based on 
 * tactical motifs, patterns, and performance metrics.
 */

import type { Puzzle } from '../api/puzzleApi';

/**
 * Generates a context-aware "Coach's Insight" for a solved puzzle.
 * 
 * @param puzzle - The puzzle that was just solved
 * @param userArchetype - (Optional) User's defensive DNA category for personalized feedback
 * @returns string - A formatted educational explanation
 */
export function getPuzzleExplanation(puzzle: Puzzle | null): string {
  if (!puzzle) return "Excellent tactical vision.";
  if (puzzle.explanation) return puzzle.explanation;

  const title = (puzzle.title || '').toLowerCase();
  const themes = (puzzle.themes || []).map(t => t.toLowerCase());
  const combined = (title + ' ' + themes.join(' ')).toLowerCase();

  // 1. Personalized Coaching (DNA Integration)
  if (puzzle.category === 'Personal Mistake') {
    const motif = themes.find(t => t !== 'personal' && t !== 'personal mistake') || 'tactical';
    return `This ${motif} pattern has been a recurring blind spot in your recent matches. By finding the solution here, you're actively recalibrating your pattern recognition to prevent this specific material loss in the future.`;
  }

  // 2. Tactical Motif Detection (Heuristic Engine)
  if (combined.includes('zwischenzug') || combined.includes('intermezzo')) {
    return "You executed a 'Zwischenzug' (Intermediate Move). By delaying the expected response to play a more forcing threat first, you disrupted the opponent's rhythm and gained a decisive tempo.";
  }
  
  if (combined.includes('discovered attack')) {
    return "Devastating discovered attack! By moving one piece, you've unleashed a hidden threat from a piece behind it, creating a dual-threat that is almost impossible to defend.";
  }

  if (combined.includes('x-ray')) {
    return "Powerful X-Ray attack. Your piece is exerting pressure through an enemy unit, targeting a critical square or piece behind it—a sophisticated form of tactical geometry.";
  }

  if (combined.includes('desperado')) {
    return "A 'Desperado' sacrifice! Since your piece was lost anyway, you sold its life as dearly as possible, capturing an enemy unit or creating a major weakness before being taken.";
  }

  if (themes.includes('mate') || combined.includes('checkmate')) {
    return "Inescapable checkmate sequence. You've identified the 'Mating Net'—the specific coordinate where the enemy king has no flight squares and no defenders left.";
  }
  
  if (combined.includes('fork')) {
    return "Lethal fork! You've utilized a single unit to strike multiple high-value targets simultaneously. The opponent is forced to choose which concession to make.";
  }

  if (combined.includes('pin')) {
    return "You've successfully established a pin. By targeting a piece in front of a more valuable objective, you've effectively paralyzed that unit and stripped it of its defensive power.";
  }

  if (combined.includes('skewer')) {
    return "Surgical skewer! You've attacked a high-value piece, forcing it to move and exposing a secondary target directly behind it on the same line.";
  }

  // 3. Opening/Context Awareness
  if (combined.includes('philidor')) {
    return "This drill focuses on the structural vulnerabilities of the Philidor Defense. You've exploited the cramped nature of the black position to create a central breakthrough.";
  }

  if (combined.includes('sicilian')) {
    return "Classic Sicilian tactics. You've utilized the semi-open c-file or the dynamic central tension to launch a counter-attack against the white king.";
  }
  
  return "Excellent tactical vision. You identified the critical 'imbalance' in the position and executed the most precise sequence to exploit it.";
}

/**
 * Calculates XP and performance bonuses based on solve speed.
 * 
 * @param seconds - Time taken to solve the puzzle
 * @returns Object - Bonus amount and label
 */
export function calculateTimeBonus(seconds: number) {
  if (seconds < 5) return { amount: 10, label: 'Lightning!' };
  if (seconds < 15) return { amount: 5, label: 'Quick!' };
  if (seconds < 30) return { amount: 2, label: 'Solid.' };
  return { amount: 0, label: '' };
}

/**
 * Calculates the total XP gain for a successfully solved puzzle.
 * 
 * @param rating - The puzzle's difficulty rating
 * @param seconds - Time taken to solve
 * @returns Object - Total XP and individual bonus breakdown
 */
export function calculatePuzzleXP(seconds: number): { totalXp: number, bonus: number } {
  const base = 15;
  const timeBonus = calculateTimeBonus(seconds);
  
  // We double the bonus in the final score as a 'reward multiplier' 
  // to make quick solves feel significantly more impactful.
  return {
    totalXp: base + (timeBonus.amount * 2),
    bonus: timeBonus.amount
  };
}
