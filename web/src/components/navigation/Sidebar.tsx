import { NavLink } from 'react-router-dom'
import { SyncStatus } from '../ui/SyncStatus'
import type { SyncState } from '../../features/sync/syncContext'
import { navigationItems } from './navigation'

export function Sidebar({ syncState }: { syncState: SyncState }) {
  return (
    <aside className="app-sidebar">
      <a className="app-brand" href="#/today" aria-label="不秃首页">
        <span className="app-brand__seal">不</span>
        <span><strong>不秃</strong><small>DayLoom</small></span>
      </a>
      <nav className="sidebar-nav" aria-label="主导航">
        {navigationItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
            <span aria-hidden="true">{item.mark}</span>{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <p>先做能完成的，<br />再慢慢长成理想的样子。</p>
        <SyncStatus state={syncState} />
      </div>
    </aside>
  )
}
