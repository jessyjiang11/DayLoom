import { Button } from '../../components/ui/Button'
import { formatScheduleLabel } from '../../lib/schedule'
import type { PlanItem } from '../../types/domain'
import { roleLabel, statusLabel } from './goalLabels'

export function GoalDetail({ item, childCount, readOnly, onEdit, onDelete, onToggleActionable, onToggleHome }: { item: PlanItem | null; childCount: number; readOnly: boolean; onEdit: () => void; onDelete: () => void; onToggleActionable: () => void; onToggleHome: () => void }) {
  if (!item) return <section className="goal-detail goal-detail--empty"><p>从左侧选择一个目标，或添加新的目标。</p></section>
  return <section className="goal-detail">
    <div className="goal-detail__actions"><Button variant="secondary" onClick={onEdit}>编辑</Button><Button variant="quiet" onClick={onDelete}>删除</Button></div>
    <p className="goal-detail__path">{roleLabel[item.kind]}</p><h1>{item.title}</h1><p className="goal-detail__description">{item.description || '还没有写说明。可以先从一句“为什么想做这件事”开始。'}</p>
    <dl><div><dt>角色</dt><dd>{roleLabel[item.kind]}</dd></div><div><dt>状态</dt><dd>{statusLabel[item.status]}</dd></div><div><dt>当前排期</dt><dd>{formatScheduleLabel(item)}</dd></div><div><dt>子计划</dt><dd>{childCount} 项</dd></div></dl>
    <section className="goal-display-panel"><header><strong>呈现与执行</strong><small>目标本身和要做的事可以分开</small></header><button type="button" role="switch" aria-checked={item.is_actionable} disabled={readOnly} onClick={onToggleActionable}><span><strong>作为执行项</strong><small>{item.is_actionable ? '会进入待安排和日程' : '只保留目标周期，由子计划推动'}</small></span><i aria-hidden="true" /></button><button type="button" role="switch" aria-checked={item.show_on_home} disabled={readOnly} onClick={onToggleHome}><span><strong>显示在首页</strong><small>{item.show_on_home ? '首页会展示进度和下一项子计划' : '只在目标树中显示'}</small></span><i aria-hidden="true" /></button></section>
  </section>
}
