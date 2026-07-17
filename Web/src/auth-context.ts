import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { MigrationSummary } from './utils/supabaseStore'

export interface AuthState {
  /** True when Supabase env vars are set; false means the app runs on localStorage. */
  enabled: boolean
  /** Still resolving the initial session. */
  loading: boolean
  user: User | null
  session: Session | null
  /** The user's family id once signed in and bootstrapped (null in localStorage mode). */
  familyId: string | null
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>
  signOut: () => Promise<void>
  /** Copy this browser's localStorage data into the signed-in family. */
  importLocalData: () => Promise<MigrationSummary>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
