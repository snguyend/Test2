import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * Firebase client bootstrap (alternative backend — see Firebase_Architecture.md).
 *
 * Configure via `.env.local` at the `Web/` root (see `.env.example`). Only
 * `VITE_`-prefixed vars reach the browser, which is correct for Firebase web
 * config (these values are public by design; security lives in Firestore Rules).
 *
 *   VITE_FIREBASE_API_KEY=...
 *   VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID=<project>
 *   VITE_FIREBASE_APP_ID=...
 *   VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com        (optional)
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=...                     (optional)
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** True when the required Firebase config is present. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

if (isFirebaseConfigured) {
  app = initializeApp(config as Required<typeof config>)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
} else {
  // Not fatal — the app runs on Supabase/localStorage until Firebase is configured.
  console.warn(
    '[firebase] config not set (VITE_FIREBASE_*). The Firebase data layer is disabled.',
  )
}

/** Throws if accessed while Firebase is not configured — guard with isFirebaseConfigured. */
export function firebaseAuth(): Auth {
  if (!authInstance) throw new Error('[firebase] not configured')
  return authInstance
}

export function firebaseDb(): Firestore {
  if (!dbInstance) throw new Error('[firebase] not configured')
  return dbInstance
}

export { app as firebaseApp }
