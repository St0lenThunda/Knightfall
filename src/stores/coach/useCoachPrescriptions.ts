import { computed, type Ref } from 'vue'
import type { LibraryGame, OpeningStat } from '../library/types'
import type { Prescription } from '../coachStore'
import type { Puzzle } from '../../api/puzzleApi'
import type { PuzzleAttempt } from '../userStore'

/**
 * Coach Prescriptions Composable
 * 
 * Translates statistical anomalies and tactical performance into actionable advice.
 */
export function useCoachPrescriptions(
  games: Ref<LibraryGame[]>,
  openingStats: Ref<OpeningStat[]>,
  personalPuzzles: Ref<Puzzle[]>,
  puzzleAttempts: Ref<PuzzleAttempt[]>,
  isMe: (name: string) => boolean
) {
  
  /** DNA-level strategic advice based on overall performance patterns. */
  const dnaPrescriptions = computed<Prescription[]>(() => {
    const allGames = games.value
    const rx: Prescription[] = []
    
    // --- Signal 0: The Shadow Realm (High Priority) ---
    // If we have harvested mistakes from the user's games, prioritize fixing them.
    if (personalPuzzles.value.length > 0) {
      const blunderCount = personalPuzzles.value.filter(p => p.severity === 'blunder').length
      rx.push({ 
        id: 'shadow-realm', 
        icon: '👻', 
        title: 'Conquer Your Ghosts', 
        desc: blunderCount > 0 
          ? `We've harvested ${blunderCount} critical blunders from your recent games.` 
          : `You have ${personalPuzzles.value.length} tactical ghosts waiting in the Shadow Realm.`, 
        link: '/puzzles?mode=personal', 
        linkText: 'Enter Shadow Realm →', 
        severity: blunderCount > 0 ? 'critical' : 'warning', 
        category: 'tactics' 
      })
    }

    if (allGames.length === 0) {
      rx.push({ id: 'import', icon: '📥', title: 'Import Your Games', desc: 'Link your Chess.com account to get personalized prescriptions.', link: '/profile', linkText: 'Set Up Profile →', severity: 'info', category: 'dna' })
      rx.push({ id: 'play', icon: '⚔️', title: 'Play Some Games', desc: 'We need at least a few games to analyze your patterns.', link: '/play', linkText: 'Play Now →', severity: 'info', category: 'dna' })
      rx.push({ id: 'puzzles-base', icon: '🧩', title: 'Tactical Foundation', desc: 'While we wait for games, solve puzzles to sharpen your vision.', link: '/puzzles', linkText: 'Solve 10 Puzzles →', severity: 'info', category: 'dna' })
      return rx
    }

    // --- Signal 1: Tactical Accuracy (from Puzzle History) ---
    if (puzzleAttempts.value.length > 5) {
      const recent = puzzleAttempts.value.slice(0, 10)
      const successRate = Math.round((recent.filter(a => a.solved).length / recent.length) * 100)
      
      if (successRate < 50) {
        rx.push({ 
          id: 'tactical-blindness', 
          icon: '👁️', 
          title: 'Tactical Blindness', 
          desc: `You've missed ${100 - successRate}% of your recent puzzles. Slow down!`, 
          link: '/puzzles', 
          linkText: 'Slow Drills →', 
          severity: 'critical', 
          category: 'tactics' 
        })
      }
    }

    // --- Signal 2: Color Imbalance ---
    let whiteWins = 0, whiteLosses = 0, blackWins = 0, blackLosses = 0
    allGames.forEach(g => {
      const amWhite = isMe(g.white)
      const amBlack = isMe(g.black)
      
      if (!amWhite && !amBlack) return

      const won = (g.result === '1-0' && amWhite) || (g.result === '0-1' && amBlack)
      const lost = (g.result === '0-1' && amWhite) || (g.result === '1-0' && amBlack)
      
      if (amWhite) { if (won) whiteWins++; if (lost) whiteLosses++ }
      else if (amBlack) { if (won) blackWins++; if (lost) blackLosses++ }
    })
    const whiteGames = whiteWins + whiteLosses
    const blackGames = blackWins + blackLosses
    const whiteWinPct = whiteGames > 0 ? Math.round((whiteWins / whiteGames) * 100) : 50
    const blackWinPct = blackGames > 0 ? Math.round((blackWins / blackGames) * 100) : 50
    const colorGap = whiteWinPct - blackWinPct

    if (colorGap > 15) {
      rx.push({ id: 'black-weak', icon: '⬛', title: 'Black Side Weakness', desc: `Your win rate as Black is ${blackWinPct}% vs ${whiteWinPct}% as White.`, link: '/opening-lab', linkText: 'Study Sicilian →', severity: 'warning', category: 'dna' })
    } else if (colorGap < -15) {
      rx.push({ id: 'white-weak', icon: '⬜', title: 'White Side Weakness', desc: `Your win rate as White is ${whiteWinPct}% vs ${blackWinPct}% as Black.`, link: '/opening-lab', linkText: 'Study Openings →', severity: 'warning', category: 'dna' })
    }

    // --- Signal 3: Game Length (Phase Vulnerability) ---
    const losses = allGames.filter(g => {
      const amWhite = isMe(g.white)
      return (g.result === '0-1' && amWhite) || (g.result === '1-0' && !amWhite)
    })
    if (losses.length > 0) {
      const avgLossMoves = Math.round(losses.reduce((s, g) => s + g.movesCount, 0) / losses.length)
      if (avgLossMoves < 25) {
        rx.push({ id: 'opening-vuln', icon: '🎬', title: 'Opening Vulnerability', desc: `Critical: Your losses average only ${avgLossMoves} moves.`, link: '/opening-lab', linkText: 'Study Openings →', severity: 'critical', category: 'dna' })
      } else if (avgLossMoves > 55) {
        rx.push({ id: 'endgame-leaks', icon: '🏁', title: 'Endgame Leaks', desc: `Your losses happen in deep endgames (${avgLossMoves} moves).`, link: '/lesson/pawn-promotion', linkText: 'Endgame Drills →', severity: 'warning', category: 'dna' })
      }
    }

    // --- Fallbacks: Maintenance Prescriptions ---
    if (rx.length < 3) {
      rx.push({ id: 'tactics-maintenance', icon: '🧩', title: 'Tactical Maintenance', desc: 'Maintain your tactical vision by solving 5 puzzles.', link: '/lesson/forks-101', linkText: 'Start Drills →', severity: 'good', category: 'dna' })
    }
    if (rx.length < 3) {
      rx.push({ id: 'repertoire-review', icon: '📚', title: 'Repertoire Review', desc: 'Review your main lines in the Opening Lab.', link: '/opening-lab', linkText: 'Review Lines →', severity: 'good', category: 'dna' })
    }

    return rx.slice(0, 6)
  })

  /** Opening-specific repertoire advice. */
  const openingPrescriptions = computed<Prescription[]>(() => {
    const rx: Prescription[] = []
    const stats = openingStats.value || []

    if (stats.length === 0) {
      rx.push({ id: 'op-import', icon: '📥', title: 'No Repertoire Data', desc: 'We need your games to analyze your openings.', link: '/profile', linkText: 'Link Account →', severity: 'info', category: 'opening' })
      rx.push({ id: 'op-theory', icon: '📖', title: 'Study the Classics', desc: 'Start by learning the Italian Game or the Ruy Lopez.', link: '/opening-lab', linkText: 'Explore Theory →', severity: 'info', category: 'opening' })
      rx.push({ id: 'op-play', icon: '⚔️', title: 'Establish a Line', desc: 'Pick one opening and play it 5 times today.', link: '/play', linkText: 'Play Now →', severity: 'info', category: 'opening' })
      return rx
    }

    const viable = stats.filter((s: OpeningStat) => s.games >= 2)
    if (viable.length > 0) {
      const worst = [...viable].sort((a, b) => a.winPct - b.winPct)[0]
      if (worst.winPct < 40) {
        rx.push({ 
          id: 'opening-bleed', 
          icon: '🩸', 
          title: `Bleeding: ${worst.name}`, 
          desc: `You have a ${worst.winPct}% win rate in the ${worst.name}.`, 
          link: '/opening-lab', 
          linkText: 'Fix Repertoire →', 
          severity: 'critical', 
          category: 'opening' 
        })
      }
    }

    // Signal 2: Strength to lean on
    const best = [...viable].sort((a, b) => b.winPct - a.winPct)[0]
    if (best && best.winPct >= 60) {
      rx.push({ id: 'opening-weapon', icon: '💪', title: `Weapon: ${best.name}`, desc: `You dominate in the ${best.name}.`, link: '/opening-lab', linkText: 'Master This →', severity: 'good', category: 'opening' })
    }

    // Signal 3: One-trick pony detection
    const totalGames = stats.reduce((s: number, o: OpeningStat) => s + o.games, 0)
    const topPct = stats.length > 0 ? Math.round((stats[0].games / totalGames) * 100) : 0
    if (topPct > 60 && totalGames > 10) {
      rx.push({ id: 'one-trick', icon: '🔁', title: 'Predictable Repertoire', desc: `${topPct}% of your repertoire is ${stats[0].name}.`, link: '/opening-lab', linkText: 'Expand Repertoire →', severity: 'warning', category: 'opening' })
    }

    // Fallbacks
    if (rx.length < 3) {
      rx.push({ id: 'op-exploration', icon: '🔭', title: 'Explore New Systems', desc: 'Try playing a new Flank opening.', link: '/opening-lab', linkText: 'Browse Openings →', severity: 'info', category: 'opening' })
    }

    return rx.slice(0, 6)
  })

  return { dnaPrescriptions, openingPrescriptions }
}
