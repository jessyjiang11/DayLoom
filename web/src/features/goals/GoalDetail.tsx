import { Button } from '../../components/ui/Button'
import { formatScheduleLabel } from '../../lib/schedule'
import type { PlanItem } from '../../types/domain'
import { roleLabel, statusLabel } from './goalLabels'

export function GoalDetail({ item, childCount, onEdit, onDelete }: { item: PlanItem | null; childCount: number; onEdit: () => void; onDelete: () => void }) {
  if (!item) return <section className="goal-detail goal-detail--empty"><p>从左侧选择一个目标，或添加新的目标。</p></section>
  return <section className="goal-detail">
    <div className="goal-detail__actions"><Button variant="secondary" onClick={onEdit}>编辑</Button><Button variant="quiet" onClick={onDelete}>删除</Button></div>
    <p className="goal-detail__path">{roleLabel[item.kind]}</p><h1>{item.title}</h1><p className="goal-detail__description">{item.description || '还没有写说明。可以先从一句“为什么想做这件事”开始。'}</p>
    <dl><div><dt>角色</dt><dd>{roleLabel[item.kind]}</dd></div><div><dt>状态</dt><dd>{statusLabel[item.status]}</dd></div><div><dt>当前排期</dt><dd>{formatScheduleLabel(item)}</dd></div><div><dt>子计划</dt><dd>{childCount} 项</dd></div></dl>
  </section>
}
