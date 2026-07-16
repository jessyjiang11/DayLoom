import { ProtectedRoute } from '../features/auth/ProtectedRoute'

export function WorkspacePlaceholder() {
  return (
    <ProtectedRoute>
      <main className="foundation-page">
        <p className="eyebrow">不秃 · DayLoom</p>
        <h1>账户已经连接。</h1>
        <p className="intro">下一阶段会在这里加入首次使用设置、目标树与真实排期。</p>
      </main>
    </ProtectedRoute>
  )
}
