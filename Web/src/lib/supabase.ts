import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Shared Supabase client, typed against our `Database` schema.
 *
 * Configure via a `.env.local` file at the `Web/` root (see `.env.example`):
 *   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon-public-key>
 *
 * Vite exposes only variables prefixed with `VITE_` to the browser, so the
 * anon key here is the *public* key (safe to ship) — never the service role key.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both env vars are present, so callers can fall back to localStorage. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Not fatal — the app can still run on the localStorage store during migration.
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'The Supabase data layer is disabled; the app will use localStorage.',
  )
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'public-anon-key',
)
