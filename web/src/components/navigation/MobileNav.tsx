import { NavLink } from 'react-router-dom'
import { navigationItems } from './navigation'

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="手机主导航">
      {navigationItems.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav__item ${isActive ? 'is-active' : ''}`}>
          <span aria-hidden="true">{item.mark}</span><small>{item.label}</small>
        </NavLink>
      ))}
    </nav>
  )
}
