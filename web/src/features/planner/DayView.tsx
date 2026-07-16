import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { PlanItem } from '../../types/domain'
import { DropZone, TaskChip } from './PlannerParts'

export function DayView({ referenceDate, items, onAdd }: { referenceDate: string; items: PlanItem[]; onAdd?: (date: string) => void }) {
  const dayItems = items.filter((item) => item.schedule_date === referenceDate)
  const untimed = dayItems.filter((item) => !item.schedule_start_time); const timed = dayItems.filter((item) => item.schedule_start_time)
  return <div className="day-view"><DropZone id={`day:${referenceDate}`} className="day-board" label="当天未定时间计划"><header><strong>{format(parseISO(referenceDate), 'M月d日 EEEE', { locale: zhCN })}</strong><button onClick={() => onAdd?.(referenceDate)}>＋ 添加当天任务</button></header><div className="day-untimed">{untimed.map((item) => <TaskChip key={item.id} item={item} />)}</div><div className="hour-list">{Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => <div className="hour-row" key={hour}><time>{String(hour).padStart(2, '0')}:00</time><div>{timed.filter((item) => Number(item.schedule_start_time?.slice(0, 2)) === hour).map((item) => <TaskChip key={item.id} item={item} />)}</div></div>)}</div></DropZone></div>
}
