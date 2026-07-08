import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/students', label: 'Students', icon: '👥' },
  { to: '/add-score', label: 'Add Score', icon: '➕' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/goals', label: 'Goals', icon: '🏆' },
]

export default function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">🎓 Education Growth</span>
      </header>

      <main className="content">
        <Outlet />
      </main>

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
    </div>
  )
}
