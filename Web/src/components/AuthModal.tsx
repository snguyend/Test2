import { useEffect, useState } from 'react'
import { useAuth } from '../auth-context'

interface Props {
  initialMode?: 'signin' | 'signup'
  onClose: () => void
}

/**
 * Auth modal opened from the header Join / Log In buttons.
 * Includes a backend toggle: keep data on this device (Local) or sign in for
 * cloud sync (Supabase). The app itself is always usable locally.
 */
export default function AuthModal({ initialMode = 'signin', onClose }: Props) {
  const { enabled, user, signInWithPassword, signUp } = useAuth()
  const [backend, setBackend] = useState<'local' | 'cloud'>(enabled ? 'cloud' : 'local')
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Close automatically once a session is established.
  useEffect(() => {
    if (user) onClose()
  }, [user, onClose])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(email.trim(), password)
        if (error) setError(error)
      } else {
        const { error, needsConfirmation } = await signUp(
          email.trim(),
          password,
          displayName.trim() || undefined,
        )
        if (error) setError(error)
        else if (needsConfirmation)
          setInfo('Check your email to confirm your account, then sign in.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="auth-card auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="auth-brand">
          <span className="logo-badge">📈</span>
          <div>
            <strong className="auth-title">Growth Tracker</strong>
            <span className="muted">Choose where your data lives</span>
          </div>
        </div>

        {/* Backend toggle */}
        <div className="backend-toggle" role="tablist" aria-label="Data backend">
          <button
            role="tab"
            aria-selected={backend === 'local'}
            className={backend === 'local' ? 'backend-opt active' : 'backend-opt'}
            onClick={() => setBackend('local')}
          >
            💾 This device
            <span className="backend-sub">Local only</span>
          </button>
          <button
            role="tab"
            aria-selected={backend === 'cloud'}
            className={backend === 'cloud' ? 'backend-opt active' : 'backend-opt'}
            onClick={() => enabled && setBackend('cloud')}
            disabled={!enabled}
            title={enabled ? undefined : 'Cloud backend is not configured'}
          >
            ☁️ Cloud sync
            <span className="backend-sub">{enabled ? 'Sign in to sync' : 'Not configured'}</span>
          </button>
        </div>

        {backend === 'local' ? (
          <div className="backend-local">
            <p className="muted">
              Your family's data stays private on this device (browser storage). You can switch to
              cloud sync anytime to access it from other devices.
            </p>
            <button type="button" className="btn primary auth-submit" onClick={onClose}>
              Continue on this device
            </button>
          </div>
        ) : (
          <>
            <div className="auth-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={mode === 'signin'}
                className={mode === 'signin' ? 'auth-tab active' : 'auth-tab'}
                onClick={() => setMode('signin')}
              >
                Log in
              </button>
              <button
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'}
                onClick={() => setMode('signup')}
              >
                Join
              </button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {mode === 'signup' && (
                <label className="auth-field">
                  <span>Name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
              )}
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </label>

              {error && <p className="auth-error">{error}</p>}
              {info && <p className="auth-info">{info}</p>}

              <button type="submit" className="btn primary auth-submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
