import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client Initialization
 *
 * Reads the project URL and anonymous key from environment variables.
 * In development, we fail fast with a clear error message so the developer
 * knows exactly what's missing. In production, the app should never reach
 * this point without valid env vars (CI/CD should enforce it).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL_HERE')
) {
  if (import.meta.env.DEV) {
    throw new Error(
      '[Knightfall] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase project credentials.'
    )
  }
  // In production, warn but don't crash — the user may be offline
  console.warn(
    '[Knightfall] Supabase credentials are missing. Backend features will be unavailable.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
