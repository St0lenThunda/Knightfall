/**
 * Knightfall Shadow Realm Harvester
 * 
 * Programmatically harvests tactical mistakes and blunders from the user's analyzed
 * matches in Supabase and populates the SRS puzzle queue.
 * 
 * This bridges the gap between historical game data and the persistent training system.
 */

import { createClient } from '@supabase/supabase-js'
import { Chess } from 'chess.js'
import crypto from 'crypto'
import fs from 'fs'

// --- Configuration ---
const SUPABASE_URL = 'https://qingaoyjdkiiexwmybps.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmdhb3lqZGtpaWV4d215YnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDA2NTAsImV4cCI6MjA5MTYxNjY1MH0.9elMh96FcfXSAjSnR60Rrq7GTSe0zi_6dQ1hFQwf8YM'
const USER_ID = 'dc5ac645-9286-4b7a-a066-f64050b51762'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Mirror of TaggingService material calculation.
 */
function calculateMaterial(fen) {
  const board = fen.split(' ')[0]
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 }
  let white = 0, black = 0
  for (const char of board) {
    if (values[char]) {
      if (char === char.toUpperCase()) white += values[char]
      else black += values[char]
    }
  }
  return { white, black }
}

/**
 * Mirror of TaggingService mistake identification logic.
 */
function identifyMistake(fenBefore, fenAfter, evalBefore, evalAfter, movePlayed, bestMove) {
  const evalDrop = Math.abs(evalAfter - evalBefore)
  
  let severity = 'inaccuracy'
  if (evalDrop > 2.5) severity = 'blunder'
  else if (evalDrop > 0.9) severity = 'mistake'
  else if (evalDrop < 0.4) return null

  const chess = new Chess(fenBefore)
  const turn = chess.turn()
  const moveCount = Math.ceil(chess.moveNumber())
  
  const materialBefore = calculateMaterial(fenBefore)
  const materialAfter = calculateMaterial(fenAfter)
  const materialLoss = turn === 'w' 
    ? materialBefore.white - materialAfter.white 
    : materialBefore.black - materialAfter.black

  // Opening Traps
  if (moveCount <= 10 && evalDrop > 1.5) {
    return {
      category: 'opening',
      severity,
      theme: 'Opening Trap',
      evalDrop,
      explanation: `${movePlayed} deviates from theory. ${bestMove} was better.`
    }
  }

  // Tactical Oversight
  if (materialLoss > 0) {
    return {
      category: 'tactics',
      severity,
      theme: materialLoss >= 3 ? 'Major Piece Hang' : 'Tactical Oversight',
      evalDrop,
      explanation: `${movePlayed} loses material. Always scan for undefended pieces.`
    }
  }

  // Missed Wins
  if (Math.abs(evalBefore) > 3.0 && Math.abs(evalAfter) < 1.0) {
    return {
      category: 'missed_win',
      severity: 'blunder',
      theme: 'Missed Winning Opportunity',
      evalDrop,
      explanation: `You were winning, but ${movePlayed} let the advantage slip.`
    }
  }

  // Default to Positional
  return {
    category: moveCount > 40 ? 'endgame' : 'positional',
    severity,
    theme: moveCount > 40 ? 'Endgame Technique' : 'Positional Inaccuracy',
    evalDrop,
    explanation: `${movePlayed} weakens the position. ${bestMove} was more accurate.`
  }
}

/**
 * Generates a stable hash for the position.
 */
function generateHash(fen, theme) {
  const normalizedFen = fen.split(' ').slice(0, 4).join(' ')
  return crypto.createHash('sha256').update(`${normalizedFen}|${theme}`).digest('hex')
}

async function runHarvest() {
  console.log('--- Knightfall Shadow Realm Harvest ---')
  console.log(`Target User: ${USER_ID}`)
  
  // 1. Fetch matches with evaluations
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .or(`white_id.eq.${USER_ID},black_id.eq.${USER_ID}`)
    .not('metadata->evals', 'is', null)

  if (error) {
    console.error('[Error] Failed to fetch matches:', error)
    return
  }

  console.log(`[Status] Processing ${matches.length} analyzed matches...`)

  const puzzleQueueEntries = []
  const coachingCacheEntries = []
  let totalMistakesFound = 0

  for (const match of matches) {
    const evals = match.metadata.evals
    if (!evals || !Array.isArray(evals)) continue

    const chess = new Chess()
    try {
      chess.loadPgn(match.pgn)
    } catch (e) {
      continue
    }

    const moves = chess.history({ verbose: true })
    const isWhite = match.white_id === USER_ID

    evals.forEach((ev, i) => {
      // evals[i] corresponds to the evaluation AFTER moves[i] has been played.
      // Therefore, the 'bestMove' for the mistake at index 'i' is actually
      // found in the evaluation record for the position BEFORE that move.
      const prevEval = i > 0 ? evals[i-1] : { score: 30, bestMove: null }
      
      if (!prevEval || !prevEval.bestMove || i >= moves.length) return
      
      const turn = moves[i].color // 'w' or 'b'
      if ((turn === 'w' && !isWhite) || (turn === 'b' && isWhite)) return

      const fenBefore = moves[i].before
      const fenAfter = moves[i].after
      const evalBefore = (prevEval.score || 0) / 100
      const evalAfter = (ev.score || 0) / 100

      const tag = identifyMistake(fenBefore, fenAfter, evalBefore, evalAfter, moves[i].lan, prevEval.bestMove)

      if (tag) {
        totalMistakesFound++
        const puzzleId = `personal-${match.id}-${i}`
        const posHash = generateHash(fenBefore, tag.theme)

        puzzleQueueEntries.push({
          user_id: USER_ID,
          puzzle_id: puzzleId,
          next_review: new Date().toISOString(),
          repetition: 0,
          interval_days: 0,
          ease_factor: 2.5
        })

        coachingCacheEntries.push({
          position_hash: posHash,
          fen: fenBefore,
          theme: tag.theme,
          mistake_type: tag.category,
          explanation_text: tag.explanation,
          metadata: { 
            match_id: match.id, 
            move_index: i, 
            best_move: ev.bestMove, 
            severity: tag.severity,
            eval_drop: tag.evalDrop
          }
        })
      }
    })
  }

  console.log(`[Status] Identified ${totalMistakesFound} personal mistakes.`)

  if (puzzleQueueEntries.length === 0) {
    console.log('[Status] No new mistakes found to harvest.')
    return
  }

  // Sort by severity (blunder > mistake > inaccuracy) and eval drop
  const severityMap = { blunder: 3, mistake: 2, inaccuracy: 1 }
  const combined = puzzleQueueEntries.map((pq, i) => ({ pq, cc: coachingCacheEntries[i] }))
  combined.sort((a, b) => {
    const sA = severityMap[a.cc.metadata.severity] || 0
    const sB = severityMap[b.cc.metadata.severity] || 0
    if (sA !== sB) return sB - sA
    return (b.cc.metadata.eval_drop || 0) - (a.cc.metadata.eval_drop || 0)
  })

  // Limit to top 1000
  const topEntries = combined.slice(0, 1000)
  const finalPQ = topEntries.map(e => e.pq)
  const finalCC = topEntries.map(e => e.cc)

  console.log(`[Action] Saving top ${finalPQ.length} results to scripts/harvest_results.json...`)
  
  fs.writeFileSync('scripts/harvest_results.json', JSON.stringify({
    puzzle_queue: finalPQ,
    coaching_cache: finalCC
  }, null, 2))

  console.log('--- Harvest Data Preparation Complete ---')
  console.log(`Data saved to scripts/harvest_results.json`)
}

runHarvest().catch(err => {
  console.error('[Fatal] Harvest failed:', err)
})
