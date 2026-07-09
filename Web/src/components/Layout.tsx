import { NavLink, Outlet } from 'react-router-dom'
import CollapsibleSection from './CollapsibleSection'
import Settings from './Settings'
import AITutor from './AITutor'
import Header from './Header'
import Particles from './Particles'
import { useAppData } from '../store-context'

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/students', label: 'Students', icon: '👥' },
  { to: '/add-score', label: 'Add Score', icon: '➕' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/goals', label: 'Goals', icon: '🏆' },
]

export default function Layout() {
  const { students } = useAppData()

  return (
    <div className="app">
      <aside className="sidebar">
        <Particles className="particles-tall" />
        <div className="sidebar-brand">
          <span className="logo">🎓 Education Growth</span>
          <span className="tagline">Family learning tracker</span>
        </div>

        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-sections">
          <CollapsibleSection title="Children" icon="👨‍👩‍👧‍👦" defaultOpen>
            <ul className="side-list">
              {students.map((s) => (
                <li key={s.id}>
                  <NavLink
                    to={`/students/${s.id}`}
                    className={({ isActive }) =>
                      isActive ? 'side-link child-link active' : 'side-link child-link'
                    }
                    style={{ ['--c' as string]: s.color } as React.CSSProperties}
                  >
                    <span className="child-avatar">{s.avatar}</span>
                    {s.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Quick Actions" icon="⚡">
            <ul className="side-list">
              <li>
                <NavLink to="/add-score" className="side-link">
                  ➕ Add a score
                </NavLink>
              </li>
              <li>
                <NavLink to="/progress" className="side-link">
                  📈 View progress
                </NavLink>
              </li>
              <li>
                <NavLink to="/goals" className="side-link">
                  🏆 Manage goals
                </NavLink>
              </li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Score Legend" icon="🎯">
            <ul className="legend">
              <li>
                <span className="legend-swatch good" /> 9 – 10 · Excellent
              </li>
              <li>
                <span className="legend-swatch ok" /> 6 – 8 · On track
              </li>
              <li>
                <span className="legend-swatch low" /> Under 6 · Needs focus
              </li>
            </ul>
          </CollapsibleSection>
        </div>

        <Settings />
      </aside>

      <main className="content">
        <Header />
        <Outlet />
      </main>

      <AITutor />
    </div>
  )
}
