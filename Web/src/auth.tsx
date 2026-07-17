import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  ensureUserProfile,
  getOrCreateFamily,
  migrateLocalStorageToSupabase,
} from './utils/supabaseStore'
import { AuthContext, type AuthState } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const bootstrappingFor = useRef<string | null>(null)

  // Resolve a signed-in user into a profile row + family id.
  const bootstrap = useCallback(async (u: User) => {
    if (bootstrappingFor.current === u.id) return
    bootstrappingFor.current = u.id
    try {
      await ensureUserProfile({
        id: u.id,
        email: u.email ?? '',
        displayName: (u.user_metadata?.display_name as string | undefined) ?? null,
      })
      const fid = await getOrCreateFamily(u.id)
      setFamilyId(fid)
    } catch (err) {
      console.error('[auth] bootstrap failed', err)
      bootstrappingFor.current = null
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setUser(data.session?.user ?? null)
        if (data.session?.user) void bootstrap(data.session.user)
      })
      .finally(() => setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      if (next?.user) {
        void bootstrap(next.user)
      } else {
        setFamilyId(null)
        bootstrappingFor.current = null
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [bootstrap])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName ?? '' } },
      })
      if (error) return { error: error.message }
      // When email confirmation is on, there is no active session yet.
      return { needsConfirmation: !data.session }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setFamilyId(null)
    bootstrappingFor.current = null
  }, [])

  const importLocalData = useCallback(async () => {
    if (!familyId) throw new Error('Not signed in to a family yet.')
    return migrateLocalStorageToSupabase(familyId)
  }, [familyId])

  const value = useMemo<AuthState>(
    () => ({
      enabled: isSupabaseConfigured,
      loading,
      user,
      session,
      familyId,
      signInWithPassword,
      signUp,
      signOut,
      importLocalData,
    }),
    [loading, user, session, familyId, signInWithPassword, signUp, signOut, importLocalData],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
