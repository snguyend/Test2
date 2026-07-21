import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Particles from './Particles'
import AuthModal from './AuthModal'
import { useAuth } from '../auth-context'
import { PUBLIC_FAMILY_ID } from '../lib/supabase'

const navItems = [
  { label: 'Home', to: '/', end: true, icon: '🏠' },
  { label: 'Courses', to: '/courses', icon: '📚' },
  { label: 'About', to: '/about', icon: '💡' },
  { label: 'Blog', to: '/blog', icon: '✍️' },
  { label: 'Contact', to: '/contact', icon: '✉️' },
]

export default function Header() {
  const { user, signOut } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null)

  return (
    <header className="site-header">
      <Particles className="particles-bar" />
      <div className="site-brand">
        <span className="site-logo">🌱</span>
      </div>

      <nav className="site-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'site-link active' : 'site-link')}
          >
            <span className="site-link-icon" aria-hidden>
              {item.icon}
            </span>
            <span className="site-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="site-actions">
        {PUBLIC_FAMILY_ID ? (
          // No-login public sharing: everyone is the shared family, so no auth UI.
          <span className="site-account-badge" title="Shared with your family">
            <span className="site-account-avatar">☁️</span>
            <span className="site-account-email">Family</span>
          </span>
        ) : user ? (
          <div className="site-account">
            <span className="site-account-badge" title={user.email ?? 'Signed in'}>
              <span className="site-account-avatar">
                {(user.email ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="site-account-email">{user.email}</span>
            </span>
            <button type="button" className="btn-login" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <button type="button" className="btn-join" onClick={() => setAuthMode('signup')}>
              Join
            </button>
            <button type="button" className="btn-login" onClick={() => setAuthMode('signin')}>
              Log In
            </button>
          </>
        )}
      </div>

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
    </header>
  )
}
