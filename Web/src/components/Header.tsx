import { NavLink } from 'react-router-dom'
import Particles from './Particles'

const navItems = [
  { label: 'Home', to: '/', end: true },
  { label: 'Courses', to: '/courses' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/goals' },
  { label: 'Contact', to: '/about' },
]

export default function Header() {
  return (
    <header className="site-header">
      <Particles className="particles-bar" />
      <div className="site-brand">
        <span className="site-logo">📖</span>
        <span className="site-name">Courses</span>
      </div>

      <nav className="site-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'site-link active' : 'site-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="site-actions">
        <button type="button" className="btn-join">
          Join
        </button>
        <button type="button" className="btn-login">
          Log In
        </button>
      </div>
    </header>
  )
}
