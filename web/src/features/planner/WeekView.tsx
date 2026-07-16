import { addDays, format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getWeekRange } from '../../lib/schedule'
import type { PlanItem } from '../../types/domain'
import { DropZone, TaskChip } from './PlannerParts'

export function WeekView({ referenceDate, items, onAdd }: { referenceDate: string; items: PlanItem[]; onAdd?: (date: string) => void }) {
  const range = getWeekRange(referenceDate); const days = Array.from({ length: 7 }, (_, index) => addDays(parseISO(range.start), index))
  const weekItems = items.filter((item) => item.schedule_granularity === 'week' && item.schedule_period_start === range.start)
  return <div className="week-view"><DropZone id={`week:${referenceDate}`} className="period-plan" label="本周计划"><div><strong>本周计划</strong><small>拖到这里，仅安排到本周</small></div><div className="period-plan__items">{weekItems.map((item) => <TaskChip key={item.id} item={item} />)}</div></DropZone>
    <div className="week-focus"><span>本周重点</span><p>完成一件真正重要的事，也给变化留一点空间。</p></div><div className="week-grid">{days.map((day) => { const date = format(day, 'yyyy-MM-dd'); return <DropZone key={date} id={`day:${date}`} className="week-day" label={`${format(day, 'M月d日 EEEE', { locale: zhCN })}计划`}><header><strong>{format(day, 'EEE', { locale: zhCN })}</strong><span>{format(day, 'd')}</span><button aria-label={`在${format(day, 'M月d日')}添加任务`} onClick={() => onAdd?.(date)}>＋</button></header>{items.filter((item) => item.schedule_date === date).map((item) => <TaskChip key={item.id} item={item} />)}</DropZone> })}</div></div>
}
