import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLibraryStore } from './libraryStore'
import { useUserStore } from './userStore'
import { supabase } from '../api/supabaseClient'

/**
 * A Prescription (Rx) represents a specific piece of coaching advice
 * derived from analyzing the player's game data.
 */
export interface Prescription {
  id: string
  icon: string
  title: string
  desc: string
  link: string
  linkText: string
  severity: 'critical' | 'warning' | 'good' | 'info'
  category: 'dna' | 'opening' | 'tactics' | 'endgame'
}

export const useCoachStore = defineStore('coach', () => {
  const libraryStore = useLibraryStore()
  const userStore = useUserStore()

  /**
   * THE ARCHETYPE ENGINE (The Brain)
   * This is the single source of truth for the player's identity.
   * It calculates the primary weakness, radar chart scores, and 
   * personality archetype in one unified report.
   */
  const archetypeReport = computed(() => {
    const labels: Record<string, string> = {
      'endgame': 'Endgame Technique',
      'tactics': 'Tactical Vision',
      'opening': 'Opening Theory',
      'mixed': 'Overall Play'
    }
    const categories = ['opening', 'tactics', 'endgame', 'mixed']
    const scores: Record<string, number> = { endgame: 0, tactics: 0, opening: 0, mixed: 0 }

    // --- Signal 1: Puzzle failures ---
    const failures = userStore.puzzleAttempts.filter(a => !a.solved)
    let totalSignals = 0
    failures.forEach(a => {
      a.themes.forEach(t => {
        const cat = ['endgame', 'opening'].includes(t) ? t
          : ['mate', 'tactics', 'middlegame', 'backRankMate'].includes(t) ? 'tactics'
          : 'mixed'
        scores[cat] += 1.0
        totalSignals++
      })
    })

    // --- Signal 2: Game losses ---
    libraryStore.games.forEach(g => {
      if (g.result === '1/2-1/2') return
      
      const myName = userStore.profile?.username?.toLowerCase() || ''
      const isWhite = g.white.toLowerCase() === myName
      const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
      
      if (!won) {
        if (g.eco) scores['opening'] += 2.0
        else scores['tactics'] += 2.0
        totalSignals += 2
      }
    })

    if (totalSignals === 0) {
      return {
        category: 'mixed',
        title: 'The Unwritten Page',
        label: 'Balanced Initiate',
        missRate: 0,
        radarScores: { opening: 0.7, tactics: 0.7, endgame: 0.7, mixed: 0.7, time: 0.8 }
      }
    }

    let topCat = 'mixed'
    let topScore = 0
    for (const cat of categories) {
      if (scores[cat] > topScore) { topScore = scores[cat]; topCat = cat }
    }

    const titles: Record<string, string> = {
      'opening': 'Theoretical Specialist',
      'tactics': 'Tactical Opportunist',
      'endgame': 'Technical Grindmaster',
      'mixed': 'Versatile General'
    }

    return {
      category: topCat,
      title: titles[topCat],
      label: labels[topCat],
      missRate: Math.round((topScore / totalSignals) * 100),
      radarScores: {
        opening: Math.max(0.3, 1 - (scores['opening'] / (totalSignals || 1))),
        tactics: Math.max(0.3, 1 - (scores['tactics'] / (totalSignals || 1))),
        endgame: Math.max(0.3, 1 - (scores['endgame'] / (totalSignals || 1))),
        mixed: 0.75,
        time: 0.85
      }
    }
  })

  async function syncArchetypeToCloud() {
    if (!userStore.session) return
    const report = archetypeReport.value
    await supabase.from('profiles').update({
      metadata: {
        archetype: report.title,
        primary_weakness: report.category,
        dna_sync_at: new Date().toISOString()
      }
    }).eq('id', userStore.session.user.id)
  }

  /**
   * GENERAL DNA PRESCRIPTIONS
   * Broad strategic analysis based on overall performance patterns.
   * Ensures at least 3 items, max 6.
   */
  const dnaPrescriptions = computed<Prescription[]>(() => {
    const allGames = libraryStore.games
    const myName = userStore.profile?.username?.toLowerCase() || ''
    const myChessCom = userStore.profile?.chessComUsername?.toLowerCase() || ''
    const rx: Prescription[] = []
    
    if (allGames.length === 0) {
      rx.push({ id: 'import', icon: '📥', title: 'Import Your Games', desc: 'Link your Chess.com account to get personalized prescriptions.', link: '/profile', linkText: 'Set Up Profile →', severity: 'info', category: 'dna' })
      rx.push({ id: 'play', icon: '⚔️', title: 'Play Some Games', desc: 'We need at least a few games to analyze your patterns.', link: '/play', linkText: 'Play Now →', severity: 'info', category: 'dna' })
      rx.push({ id: 'puzzles-base', icon: '🧩', title: 'Tactical Foundation', desc: 'While we wait for games, solve puzzles to sharpen your vision.', link: '/puzzles', linkText: 'Solve 10 Puzzles →', severity: 'info', category: 'dna' })
      return rx
    }

    // --- Signal 1: Color Imbalance ---
    let whiteWins = 0, whiteLosses = 0, blackWins = 0, blackLosses = 0
    allGames.forEach(g => {
      const pWhite = g.white.toLowerCase()
      const isWhite = pWhite === myName || (myChessCom && pWhite === myChessCom)
      const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
      const lost = (g.result === '0-1' && isWhite) || (g.result === '1-0' && !isWhite)
      if (isWhite) { if (won) whiteWins++; if (lost) whiteLosses++ }
      else         { if (won) blackWins++; if (lost) blackLosses++ }
    })
    const whiteGames = whiteWins + whiteLosses
    const blackGames = blackWins + blackLosses
    const whiteWinPct = whiteGames > 0 ? Math.round((whiteWins / whiteGames) * 100) : 50
    const blackWinPct = blackGames > 0 ? Math.round((blackWins / blackGames) * 100) : 50
    const colorGap = whiteWinPct - blackWinPct

    if (colorGap > 15) {
      rx.push({ id: 'black-weak', icon: '⬛', title: 'Black Side Weakness', desc: `Your win rate as Black is ${blackWinPct}% vs ${whiteWinPct}% as White. Study solid defensive systems.`, link: '/opening-lab', linkText: 'Opening Lab →', severity: 'warning', category: 'dna' })
    } else if (colorGap < -15) {
      rx.push({ id: 'white-weak', icon: '⬜', title: 'White Side Weakness', desc: `Your win rate as White is ${whiteWinPct}% vs ${blackWinPct}% as Black. Focus on building a sharper repertoire.`, link: '/opening-lab', linkText: 'Opening Lab →', severity: 'warning', category: 'dna' })
    }

    // --- Signal 2: Game Length (Phase Vulnerability) ---
    const losses = allGames.filter(g => {
      const pWhite = g.white.toLowerCase()
      const isWhite = pWhite === myName || (myChessCom && pWhite === myChessCom)
      return (g.result === '0-1' && isWhite) || (g.result === '1-0' && !isWhite)
    })
    if (losses.length > 0) {
      const avgLossMoves = Math.round(losses.reduce((s, g) => s + g.movesCount, 0) / losses.length)
      if (avgLossMoves < 25) {
        rx.push({ id: 'opening-vuln', icon: '🎬', title: 'Opening Vulnerability', desc: `Critical: Your losses average only ${avgLossMoves} moves. You are likely falling into opening traps.`, link: '/opening-lab', linkText: 'Study Openings →', severity: 'critical', category: 'dna' })
      } else if (avgLossMoves > 55) {
        rx.push({ id: 'endgame-leaks', icon: '🏁', title: 'Endgame Leaks', desc: `Your losses happen in deep endgames (${avgLossMoves} moves). Practice R+P and K+P technique.`, link: '/puzzles', linkText: 'Endgame Drills →', severity: 'warning', category: 'dna' })
      }
    }

    // --- Signal 3: Aggression Check ---
    const decisiveGames = allGames.filter(g => g.result !== '1/2-1/2').length
    const drawPct = allGames.length > 0 ? Math.round(((allGames.length - decisiveGames) / allGames.length) * 100) : 0
    if (drawPct < 5 && allGames.length > 10) {
      rx.push({ id: 'aggressive-play', icon: '⚔️', title: 'Aggressive Stylist', desc: `Only ${drawPct}% of your games end in draws. You take big risks — focus on "safety-first" calculation.`, link: '/puzzles', linkText: 'Defense Training →', severity: 'info', category: 'dna' })
    }

    // --- Fallbacks: Maintenance Prescriptions (to hit min 3) ---
    if (rx.length < 3) {
      rx.push({ id: 'tactics-maintenance', icon: '🧩', title: 'Tactical Maintenance', desc: 'Maintain your tactical vision by solving 5 high-rated puzzles today.', link: '/puzzles', linkText: 'Start Drills →', severity: 'good', category: 'dna' })
    }
    if (rx.length < 3) {
      rx.push({ id: 'repertoire-review', icon: '📚', title: 'Repertoire Review', desc: 'Review your main lines in the Opening Lab to ensure no "rust" is building up.', link: '/opening-lab', linkText: 'Review Lines →', severity: 'good', category: 'dna' })
    }

    return rx.slice(0, 6)
  })

  /**
   * OPENING REPERTOIRE PRESCRIPTIONS
   * Specific coaching advice based on opening performance and diversity.
   * Ensures at least 3 items, max 6.
   */
  const openingPrescriptions = computed<Prescription[]>(() => {
    const stats = libraryStore.openingStats
    const rx: Prescription[] = []

    if (stats.length === 0) {
      rx.push({ id: 'op-import', icon: '📥', title: 'No Repertoire Data', desc: 'We need your games to analyze your openings.', link: '/profile', linkText: 'Link Account →', severity: 'info', category: 'opening' })
      rx.push({ id: 'op-theory', icon: '📖', title: 'Study the Classics', desc: 'Start by learning the Italian Game or the Ruy Lopez.', link: '/opening-lab', linkText: 'Explore Theory →', severity: 'info', category: 'opening' })
      rx.push({ id: 'op-play', icon: '⚔️', title: 'Establish a Line', desc: 'Pick one opening (e.g. 1.e4) and play it 5 times today.', link: '/play', linkText: 'Play Now →', severity: 'info', category: 'opening' })
      return rx
    }

    const viable = stats.filter(s => s.games >= 2)

    // --- Signal 1: Bleeding in a specific opening ---
    if (viable.length > 0) {
      const worst = [...viable].sort((a, b) => a.winPct - b.winPct)[0]
      if (worst.winPct < 40) {
        rx.push({ id: 'opening-bleed', icon: '🩸', title: `Bleeding: ${worst.name}`, desc: `You have a ${worst.winPct}% win rate in the ${worst.name}. This is a critical weakness.`, link: '/opening-lab', linkText: 'Fix Repertoire →', severity: 'critical', category: 'opening' })
      }
    }

    // --- Signal 2: Strength to lean on ---
    const best = [...viable].sort((a, b) => b.winPct - a.winPct)[0]
    if (best && best.winPct >= 60) {
      rx.push({ id: 'opening-weapon', icon: '💪', title: `Weapon: ${best.name}`, desc: `You dominate in the ${best.name} (${best.winPct}% win rate). Consider playing this more often.`, link: '/opening-lab', linkText: 'Master This →', severity: 'good', category: 'opening' })
    }

    // --- Signal 3: One-trick pony detection ---
    const totalGames = stats.reduce((s, o) => s + o.games, 0)
    const topPct = stats.length > 0 ? Math.round((stats[0].games / totalGames) * 100) : 0
    if (topPct > 60 && totalGames > 10) {
      rx.push({ id: 'one-trick', icon: '🔁', title: 'Predictable Repertoire', desc: `${topPct}% of your repertoire is ${stats[0].name}. You are becoming too easy to prepare against.`, link: '/opening-lab', linkText: 'Expand Repertoire →', severity: 'warning', category: 'opening' })
    }

    // --- Fallbacks to hit min 3 ---
    if (rx.length < 3) {
      rx.push({ id: 'op-exploration', icon: '🔭', title: 'Explore New Systems', desc: 'Try playing a new Flank opening (1.c4 or 1.Nf3) to broaden your understanding.', link: '/opening-lab', linkText: 'Browse Openings →', severity: 'info', category: 'opening' })
    }
    if (rx.length < 3) {
      rx.push({ id: 'op-drill', icon: '🧩', title: 'Opening Puzzles', desc: 'Practice tactics specifically from the positions you reach most often.', link: '/puzzles', linkText: 'Train Tactics →', severity: 'good', category: 'opening' })
    }

    return rx.slice(0, 6)
  })

  /**
   * PLAYSTYLE NARRATIVE
   * Converts raw DNA stats into a human-readable story about the player's identity.
   */
  const playstyleNarrative = computed(() => {
    const report = archetypeReport.value
    const allGames = libraryStore.games
    if (allGames.length === 0) return { 
      title: "The Unwritten Page", 
      desc: "We haven't detected your playstyle signature yet. Play or import games to see your DNA." 
    }

    const narratives: Record<string, { title: string, desc: string }> = {
      'mixed': {
        title: "The Versatile General",
        desc: `You exhibit a balanced approach to the game. With a ${report.missRate}% deviation in accuracy, your play is structural rather than erratic.`
      },
      'opening': {
        title: "The Theoretical Specialist",
        desc: `You thrive in prepared lines. However, your ${report.missRate}% weakness in opening theory suggests you may be memorizing moves without internalizing the underlying structures.`
      },
      'tactics': {
        title: "The Tactical Opportunist",
        desc: `You have a sharp eye for the immediate. Your ${report.missRate}% tactical vulnerability indicates a tendency to play 'hope chess'—relying on your opponent missing your threats rather than objective truth.`
      },
      'endgame': {
        title: "The Technical Grindmaster",
        desc: `You excel in simplified positions, but your ${report.missRate}% endgame technique gap shows you are letting winning advantages slip when the queens come off.`
      }
    }

    const base = narratives[report.category] || narratives['mixed']
    
    // Add a modifier based on aggression (draw %)
    const decisiveGames = allGames.filter(g => g.result !== '1/2-1/2').length
    const drawPct = allGames.length > 0 ? Math.round(((allGames.length - decisiveGames) / allGames.length) * 100) : 0
    
    let modifier = ""
    if (drawPct < 5) modifier = " Your extremely low draw rate suggests a high-risk approach—you play for the 'kill' in every position."
    else if (drawPct > 15) modifier = " Your high draw rate indicates a prophylactic style—you are difficult to beat but may miss chances to push for more."

    return {
      title: base.title,
      desc: `${base.desc}${modifier}`
    }
  })

  return { 
    archetypeReport, 
    dnaPrescriptions, 
    openingPrescriptions, 
    playstyleNarrative, 
    syncArchetypeToCloud 
  }
})
