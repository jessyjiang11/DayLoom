import { Outlet } from 'react-router-dom'
import { MobileNav } from '../components/navigation/MobileNav'
import { Sidebar } from '../components/navigation/Sidebar'
import { useSync } from '../features/sync/useSync'
import './app-shell.css'

export function AppShell() {
  const { state, readOnly } = useSync()
  return (
    <div className="app-layout">
      <Sidebar syncState={state} />
      <div className="app-workspace">
        <header className="capture-bar">
          <label>
            <span aria-hidden="true">＋</span>
            <input aria-label="快速记录" placeholder={readOnly ? '离线时暂不能记录' : '想到什么？先记下来…'} disabled={readOnly} />
          </label>
          <kbd>Enter</kbd>
        </header>
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
