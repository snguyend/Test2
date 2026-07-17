/**
 * Firebase Authentication helpers (Google, Microsoft, Email/Password).
 *
 * Swap-ready scaffold: mirrors what `auth.tsx` does for Supabase. Wire these into
 * a Firebase-backed auth provider, or add the social buttons to the Login screen.
 * See Firebase_Architecture.md §4.
 */
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from './firebase'
import { ensureUserProfile, getOrCreateFamily, setActiveFamily } from '../utils/firebaseStore'

export function signInWithGoogle() {
  return signInWithPopup(firebaseAuth(), new GoogleAuthProvider())
}

export function signInWithMicrosoft() {
  const provider = new OAuthProvider('microsoft.com')
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(firebaseAuth(), provider)
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth(), email, password)
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const cred = await createUserWithEmailAndPassword(firebaseAuth(), email, password)
  if (displayName) await updateProfile(cred.user, { displayName })
  return cred
}

export function signOutFirebase() {
  setActiveFamily(null)
  return signOut(firebaseAuth())
}

export function onFirebaseAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth(), cb)
}

/** Ensure profile + family exist for a signed-in user; returns the family id. */
export async function bootstrapFirebaseUser(user: User): Promise<string> {
  await ensureUserProfile({
    id: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
  })
  return getOrCreateFamily(user.uid)
}
