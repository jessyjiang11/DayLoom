import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRef, useState, type PointerEvent } from 'react'
import { createItem, itemKeys, type ItemCreateInput } from '../../repositories/itemRepository'
import { ItemEditor, type InitialSchedule } from '../items/ItemEditor'
import { useWorkspaceItems } from '../items/useWorkspaceItems'
import { hourFromPointer, selectedTimeRange } from './timeSelection'
import './today.css'

export function TodayPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { items, isLoading, client, user } = useWorkspaceItems()
  const queryClient = useQueryClient()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<{ anchor: number; current: number } | null>(null)
  const [editorSchedule, setEditorSchedule] = useState<InitialSchedule | null>(null)
  const todayItems = items.filter((item) => item.schedule_date === today)
  const focus = items.filter((item) => item.is_focus && item.status !== 'done').slice(0, 3)
  const untimed = todayItems.filter((item) => !item.schedule_start_time)
  const timed = todayItems.filter((item) => item.schedule_start_time).sort((a,b) => (a.schedule_start_time ?? '').localeCompare(b.schedule_start_time ?? ''))
  const inbox = items.filter((item) => !item.parent_id && !item.schedule_granularity && item.kind === 'task')

  function pointerHour(event: PointerEvent<HTMLDivElement>) {
    const rect = timelineRef.current?.getBoundingClientRect()
    return rect ? hourFromPointer(event.clientY, rect.top, rect.height) : 8
  }
  function startSelection(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('article')) return
    const hour = pointerHour(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelection({ anchor: hour, current: hour })
  }
  function moveSelection(event: PointerEvent<HTMLDivElement>) {
    if (selection) setSelection((current) => current ? { ...current, current: pointerHour(event) } : null)
  }
  function finishSelection(event: PointerEvent<HTMLDivElement>) {
    if (!selection) return
    const range = selectedTimeRange(selection.anchor, pointerHour(event))
    setSelection(null)
    setEditorSchedule({ granularity: 'time', date: today, ...range })
  }
  async function createTimed(value: ItemCreateInput) {
    if (!client || !user) return
    await createItem(client, user.id, value)
    await queryClient.invalidateQueries({ queryKey: itemKeys.list(user.id) })
  }

  if (isLoading) return <p role="status">正在准备今天…</p>
  const selectedRange = selection ? selectedTimeRange(selection.anchor, selection.current) : null
  return <div className="today-page"><header className="section-heading"><div><p>{format(new Date(), 'M月d日 EEEE', { locale: zhCN })}</p><h1>今天，慢慢来。</h1><span>先把最重要的一小步完成。</span></div></header><section className="today-focus"><header><strong>今日重点</strong><span>{focus.length}/3</span></header><div>{focus.length ? focus.map((item) => <article key={item.id}><small>{item.parent_id ? '来自目标' : '独立任务'}</small><strong>{item.title}</strong></article>) : <p>从今天的任务里选出最多三件重点。</p>}</div></section><div className="today-layout"><section className="today-timeline"><header><strong>今天的时间</strong><small>在时间轴空白处按住拖动，即可新建时间段</small></header><div className="today-untimed">{untimed.map((item) => <span key={item.id}>{item.title}</span>)}</div><div ref={timelineRef} className="today-hour-list" aria-label="今日小时轴" onPointerDown={startSelection} onPointerMove={moveSelection} onPointerUp={finishSelection}>{Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => { const selected = selection && hour >= Math.min(selection.anchor, selection.current) && hour <= Math.max(selection.anchor, selection.current); return <div className={`today-hour ${selected ? 'is-selecting' : ''}`} key={hour}><time>{String(hour).padStart(2,'0')}:00</time><div>{timed.filter((item) => Number(item.schedule_start_time?.slice(0,2)) === hour).map((item) => <article key={item.id}><strong>{item.title}</strong><small>{item.schedule_start_time?.slice(0,5)}</small></article>)}</div></div> })}{selectedRange && <div className="time-selection-label">{selectedRange.time} · {selectedRange.durationMinutes} 分钟</div>}</div></section><aside className="today-rail"><header><strong>收集箱</strong><span>{inbox.length}</span></header>{inbox.length ? inbox.map((item) => <article key={item.id}>{item.title}</article>) : <p>临时记下的事情会在这里等你整理。</p>}</aside></div><ItemEditor open={Boolean(editorSchedule)} initialSchedule={editorSchedule} onClose={() => setEditorSchedule(null)} onSave={createTimed} /></div>
}
