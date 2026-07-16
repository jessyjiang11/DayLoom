import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PlanItem } from '../../types/domain'
import { DropZone, TaskChip } from './PlannerParts'

export function MonthView({ referenceDate, items, onAdd }: { referenceDate: string; items: PlanItem[]; onAdd?: (date: string) => void }) {
  const reference = parseISO(referenceDate)
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(reference), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(reference), { weekStartsOn: 1 }) })
  const monthItems = items.filter((item) => item.schedule_granularity === 'month' && item.schedule_period_start?.slice(0, 7) === format(reference, 'yyyy-MM'))
  return <div className="month-view"><DropZone id={`month:${format(reference, 'yyyy-MM-dd')}`} className="period-plan" label="本月计划"><div><strong>本月计划</strong><small>拖到这里，仅安排到本月</small></div><div className="period-plan__items">{monthItems.map((item) => <TaskChip key={item.id} item={item} />)}</div></DropZone><div className="month-weekdays">{['一','二','三','四','五','六','日'].map((day) => <span key={day}>周{day}</span>)}</div><div className="month-grid">{days.map((day) => {
    const date = format(day, 'yyyy-MM-dd')
    const dayItems = items.filter((item) => item.is_actionable && item.schedule_date === date)
    return <DropZone key={date} id={`day:${date}`} className={`month-day ${isSameMonth(day, reference) ? '' : 'is-outside'}`} label={`${format(day, 'M月d日', { locale: zhCN })}计划`}><header><span>{format(day, 'd')}</span><button aria-label={`在${format(day, 'M月d日')}添加任务`} onClick={() => onAdd?.(date)}>＋</button></header>{dayItems.slice(0, 4).map((item) => <TaskChip key={item.id} item={item} />)}{dayItems.length > 4 && <small>还有 {dayItems.length - 4} 项</small>}</DropZone>
  })}</div></div>
}
