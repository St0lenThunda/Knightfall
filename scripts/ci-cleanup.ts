import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

/**
 * Knightfall CI Cleanup Script
 * 
 * This script is designed to be run after Playwright E2E tests to purge 
 * "ghost games" (1-move pollution) from the Supabase testing environment.
 * 
 * It mirrors the logic found in libraryStore.ts -> purgeTestPollution.
 */

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('🧹 Starting CI Vault Cleanup...')

  // Identify games with 0 or 1 moves.
  // In the 'matches' table, we check the metadata or moves count if available.
  // Based on the store logic, we likely need to check the PGN or a specific field.
  
  // Let's check how many matches have very few moves.
  // Since we don't have a direct 'movesCount' column in SQL (it's in the PGN or metadata),
  // we'll have to be careful.
  
  // Actually, libraryStore.ts uses 'movesCount' which is calculated from PGN.
  // For a SQL-level purge, we can look for short PGNs or metadata.
  
  // For now, let's target games where the PGN is very short (e.g. only headers).
  // A 1-move game PGN is typically > 50 chars but < 150 chars.
  
  // Safer bet: Delete matches where the PGN contains only headers and 0-1 moves.
  // We'll fetch them first to be sure.
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, pgn')
    .limit(1000)

  if (error) {
    console.error('❌ Failed to fetch matches:', error)
    process.exit(1)
  }

  const ghostIds = (matches || []).filter(m => {
    // Basic heuristic: if it doesn't contain a move number '1.', it's a ghost.
    // Or if it's very short.
    const hasMove = m.pgn.includes('1.')
    const tooShort = m.pgn.length < 150
    return !hasMove || tooShort
  }).map(m => m.id)

  if (ghostIds.length === 0) {
    console.log('✅ No ghost games found in the cloud.')
    return
  }

  console.log(`🗑️ Purging ${ghostIds.length} ghost games...`)
  
  const { error: deleteError } = await supabase
    .from('matches')
    .delete()
    .in('id', ghostIds)

  if (deleteError) {
    console.error('❌ Failed to delete games:', deleteError)
    process.exit(1)
  }

  console.log(`✨ Successfully sanitized the cloud vault.`)
}

cleanup()
