type SyncState = 'saved' | 'saving' | 'offline' | 'reconnecting' | 'error'

const labels: Record<SyncState, string> = {
  saved: '已保存',
  saving: '正在保存',
  offline: '离线，只读',
  reconnecting: '正在重新连接',
  error: '保存失败',
}

export function SyncStatus({ state = 'saved' }: { state?: SyncState }) {
  return <span className={`sync-status sync-status--${state}`} role="status">{labels[state]}</span>
}
