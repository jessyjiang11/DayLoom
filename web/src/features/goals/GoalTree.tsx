import { useState } from 'react'
import { formatScheduleLabel } from '../../lib/schedule'
import type { PlanItem } from '../../types/domain'
import { roleLabel, statusLabel } from './goalLabels'

type Props = { items: PlanItem[]; selectedId?: string; onSelect: (item: PlanItem) => void; onAddChild: (item: PlanItem) => void }

export function GoalTree({ items, selectedId, onSelect, onAddChild }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const roots = items.filter((item) => !item.parent_id)

  function branch(item: PlanItem, depth = 0) {
    const children = items.filter((child) => child.parent_id === item.id)
    const isCollapsed = collapsed.has(item.id)
    return <li key={item.id}>
      <div className={`goal-node ${selectedId === item.id ? 'is-selected' : ''}`} style={{ '--depth': depth } as React.CSSProperties}>
        <button className="goal-node__toggle" aria-label={isCollapsed ? `展开${item.title}` : `收起${item.title}`} disabled={!children.length} onClick={() => setCollapsed((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next })}>{children.length ? (isCollapsed ? '›' : '⌄') : '·'}</button>
        <button className="goal-node__main" onClick={() => onSelect(item)}><strong>{item.title}{item.show_on_home && <em>首页</em>}</strong><small>{roleLabel[item.kind]} · {statusLabel[item.status]} · {formatScheduleLabel(item)}</small></button>
        <button className="goal-node__add" aria-label={`为${item.title}添加子计划`} onClick={() => onAddChild(item)}>＋</button>
      </div>
      {!isCollapsed && children.length > 0 && <ul>{children.map((child) => branch(child, depth + 1))}</ul>}
    </li>
  }
  return <ul className="goal-tree-list">{roots.map((item) => branch(item))}</ul>
}
