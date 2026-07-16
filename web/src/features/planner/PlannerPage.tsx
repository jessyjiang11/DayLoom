import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { addDays, addMonths, format, parseISO } from 'date-fns'
import { useState } from 'react'
import { createItem, itemKeys, rescheduleItem, type ItemCreateInput } from '../../repositories/itemRepository'
import { ItemEditor, type InitialSchedule } from '../items/ItemEditor'
import { useWorkspaceItems } from '../items/useWorkspaceItems'
import { DayView } from './DayView'
import { MonthView } from './MonthView'
import { DropZone, TaskChip } from './PlannerParts'
import { scheduleFromDropId } from './plannerSchedule'
import { WeekView } from './WeekView'
import './planner.css'

type View = 'month' | 'week' | 'day'

export function PlannerPage() {
  const { items, client, user, sync } = useWorkspaceItems()
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [editorSchedule, setEditorSchedule] = useState<InitialSchedule | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }), useSensor(KeyboardSensor))
  const unscheduled = items.filter((item) => !item.schedule_granularity && item.status !== 'done')
  const step = (amount: number) => setDate(format(view === 'month' ? addMonths(parseISO(date), amount) : addDays(parseISO(date), amount * (view === 'week' ? 7 : 1)), 'yyyy-MM-dd'))

  async function dragEnd(event: DragEndEvent) {
    const target = event.over?.id
    if (!target || !client || !user || sync.readOnly) return
    const item = items.find((candidate) => candidate.id === event.active.id)
    const schedule = scheduleFromDropId(String(target))
    if (!item || !schedule) return
    await rescheduleItem(client, user.id, item, schedule)
    await queryClient.invalidateQueries({ queryKey: itemKeys.list(user.id) })
  }

  async function createScheduled(value: ItemCreateInput) {
    if (!client || !user) return
    await createItem(client, user.id, value)
    await queryClient.invalidateQueries({ queryKey: itemKeys.list(user.id) })
  }

  const addToDay = (day: string) => setEditorSchedule({ granularity: 'day', date: day })

  return <div className="planner-page"><header className="section-heading"><div><p>计划</p><h1>把以后，放到看得见的地方。</h1><span>先安排到一个大概周期，再慢慢具体到某一天。</span></div><div className="view-tabs">{(['month','week','day'] as View[]).map((name) => <button className={view === name ? 'is-active' : ''} key={name} onClick={() => setView(name)}>{({ month: '月', week: '周', day: '日' })[name]}</button>)}</div></header>
    <DndContext sensors={sensors} onDragEnd={(event) => void dragEnd(event)}><div className="planner-layout"><section className="planner-board"><header className="planner-toolbar"><button aria-label="上一个周期" onClick={() => step(-1)}>‹</button><strong>{view === 'month' ? format(parseISO(date), 'yyyy年 M月') : date}</strong><button aria-label="下一个周期" onClick={() => step(1)}>›</button><button onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}>今天</button></header>{view === 'month' && <MonthView referenceDate={date} items={items} onAdd={addToDay} />}{view === 'week' && <WeekView referenceDate={date} items={items} onAdd={addToDay} />}{view === 'day' && <DayView referenceDate={date} items={items} onAdd={addToDay} />}</section><DropZone id="unscheduled" className="backlog" label="待安排"><header><strong>待安排</strong><span>{unscheduled.length}</span></header><div className="backlog-items">{unscheduled.map((item) => <TaskChip key={item.id} item={item} />)}</div></DropZone></div></DndContext>
    <ItemEditor open={Boolean(editorSchedule)} initialSchedule={editorSchedule} onClose={() => setEditorSchedule(null)} onSave={createScheduled} />
  </div>
}
