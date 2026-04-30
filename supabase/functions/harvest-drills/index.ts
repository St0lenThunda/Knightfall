import { serve } from "http/server"
import { createClient } from "supabase"
import { Chess } from "chess.js"

/**
 * Knightfall Shadow Realm Edge Function
 * 
 * Automatically harvests tactical mistakes and blunders from a match record
 * after it has been analyzed. Triggered by Supabase Webhooks on 'matches' table updates.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Identifies tactical mistakes based on evaluation drops.
 */
function identifyMistake(fenBefore: string, fenAfter: string, evalBefore: number, evalAfter: number, movePlayed: string, bestMove: string) {
  const evalDrop = Math.abs(evalAfter - evalBefore)
  
  let severity: 'blunder' | 'mistake' | 'inaccuracy' = 'inaccuracy'
  if (evalDrop > 2.5) severity = 'blunder'
  else if (evalDrop > 0.9) severity = 'mistake'
  else if (evalDrop < 0.4) return null

  const chess = new Chess(fenBefore)
  const turn = chess.turn()
  const moveCount = Math.ceil(chess.moveNumber())
  
  // Basic material calculation
  const getMaterial = (f: string) => {
    const board = f.split(' ')[0]
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 }
    let w = 0, b = 0
    for (const char of board) {
      if (values[char]) {
        if (char === char.toUpperCase()) w += values[char]
        else b += values[char]
      }
    }
    return { w, b }
  }

  const matBefore = getMaterial(fenBefore)
  const matAfter = getMaterial(fenAfter)
  const matLoss = turn === 'w' ? matBefore.w - matAfter.w : matBefore.b - matAfter.b

  // Logic categories
  if (moveCount <= 10 && evalDrop > 1.5) {
    return { category: 'opening', severity, theme: 'Opening Trap', evalDrop, explanation: `${movePlayed} deviates from theory. ${bestMove} was better.` }
  }

  if (matLoss > 0) {
    return { category: 'tactics', severity, theme: matLoss >= 3 ? 'Major Piece Hang' : 'Tactical Oversight', evalDrop, explanation: `${movePlayed} loses material. Always scan for undefended pieces.` }
  }

  if (Math.abs(evalBefore) > 3.0 && Math.abs(evalAfter) < 1.0) {
    return { category: 'missed_win', severity: 'blunder', theme: 'Missed Winning Opportunity', evalDrop, explanation: `You were winning, but ${movePlayed} let the advantage slip.` }
  }

  return {
    category: moveCount > 40 ? 'endgame' : 'positional',
    severity,
    theme: moveCount > 40 ? 'Endgame Technique' : 'Positional Inaccuracy',
    evalDrop,
    explanation: `${movePlayed} weakens the position. ${bestMove} was more accurate.`
  }
}

/**
 * Generates a stable hash for the coaching cache.
 */
async function generateHash(fen: string, theme: string) {
  const normalizedFen = fen.split(' ').slice(0, 4).join(' ')
  const msgUint8 = new TextEncoder().encode(`${normalizedFen}|${theme}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // The webhook payload from Supabase
    const payload = await req.json()
    const match = payload.record // The inserted/updated match record

    // We only process if there are evaluations present
    const evals = match.metadata?.evals
    if (!evals || !Array.isArray(evals) || evals.length === 0) {
      return new Response(JSON.stringify({ message: "No evals found. Skipping." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    const chess = new Chess()
    try {
      chess.loadPgn(match.pgn)
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid PGN", details: e }), { status: 400 })
    }

    const moves = chess.history({ verbose: true })
    const whiteId = match.white_id
    const blackId = match.black_id

    const queueEntries: any[] = []
    const cacheEntries: any[] = []

    // Process every move and check for mistakes by EITHER player
    for (let i = 0; i < evals.length; i++) {
      const ev = evals[i]
      if (!ev || !ev.bestMove || i >= moves.length) continue

      const turn = moves[i].color
      const userId = turn === 'w' ? whiteId : blackId
      if (!userId) continue // Skip if we don't have a user ID (e.g. anonymous opponent)

      const fenBefore = moves[i].before
      const fenAfter = moves[i].after
      // Evaluations are stored as integers (CP) in metadata, convert to floats
      const evalBefore = i > 0 ? (evals[i-1]?.score || 30) / 100 : 0.3
      const evalAfter = (ev.score || 0) / 100

      const tag = identifyMistake(fenBefore, fenAfter, evalBefore, evalAfter, moves[i].lan, ev.bestMove)

      if (tag) {
        const puzzleId = `personal-${match.id}-${i}`
        const posHash = await generateHash(fenBefore, tag.theme)

        queueEntries.push({
          user_id: userId,
          puzzle_id: puzzleId,
          next_review: new Date().toISOString(),
          repetition: 0,
          interval_days: 0,
          ease_factor: 2.5
        })

        cacheEntries.push({
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
    }

    // Insert results into Supabase
    if (cacheEntries.length > 0) {
      // 1. Update Coaching Cache (Idempotent)
      await supabaseClient
        .from('coaching_cache')
        .upsert(cacheEntries, { onConflict: 'position_hash' })

      // 2. Add to Puzzle Queues (Idempotent)
      await supabaseClient
        .from('puzzle_queue')
        .upsert(queueEntries, { onConflict: 'user_id,puzzle_id' })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      harvested: cacheEntries.length,
      match_id: match.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
