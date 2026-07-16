import { endOfMonth, format, parseISO } from 'date-fns'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field } from '../../components/ui/Field'
import { getWeekRange } from '../../lib/schedule'
import type { ItemCreateInput } from '../../repositories/itemRepository'
import type { PlanItem } from '../../types/domain'

type EditorValue = ItemCreateInput & { parent_id?: string | null }
export type InitialSchedule = { granularity: 'month' | 'week' | 'day' | 'time'; date: string; time?: string; durationMinutes?: number }
type Props = { open: boolean; item?: PlanItem | null; parentId?: string | null; initialSchedule?: InitialSchedule | null; onClose: () => void; onSave: (value: EditorValue) => Promise<void> }

export function ItemEditor({ open, item, parentId = null, initialSchedule = null, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<PlanItem['kind']>('task')
  const [status, setStatus] = useState<PlanItem['status']>('todo')
  const [isActionable, setIsActionable] = useState(true)
  const [showOnHome, setShowOnHome] = useState(false)
  const [granularity, setGranularity] = useState<PlanItem['schedule_granularity']>(null)
  const [reference, setReference] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(item?.title ?? '')
    setDescription(item?.description ?? '')
    setKind(item?.kind ?? (parentId || initialSchedule ? 'task' : 'goal'))
    setStatus(item?.status ?? 'todo')
    setIsActionable(item?.is_actionable ?? (item ? (item.kind === 'project' || item.kind === 'task') : Boolean(parentId || initialSchedule)))
    setShowOnHome(item?.show_on_home ?? false)
    setGranularity(item?.schedule_granularity ?? initialSchedule?.granularity ?? null)
    setReference(item?.schedule_date ?? item?.schedule_period_start?.slice(0, 7) ?? initialSchedule?.date ?? '')
    setTime(item?.schedule_start_time?.slice(0, 5) ?? initialSchedule?.time ?? '09:00')
    setDuration(item?.duration_minutes ?? initialSchedule?.durationMinutes ?? 60)
    setError(null)
  }, [initialSchedule, item, open, parentId])

  function changeKind(nextKind: PlanItem['kind']) {
    setKind(nextKind)
    if (!item) setIsActionable(nextKind === 'project' || nextKind === 'task')
  }

  function changeActionable(nextValue: boolean) {
    setIsActionable(nextValue)
    if (!nextValue && (granularity === 'day' || granularity === 'time')) setGranularity(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) { setError('请写下名称'); return }
    let schedule: Partial<PlanItem> = {
      schedule_granularity: granularity, schedule_date: null, schedule_start_time: null,
      schedule_period_start: null, schedule_period_end: null,
      duration_minutes: granularity === 'time' ? duration : null,
    }
    if (granularity === 'month' && reference) {
      const start = `${reference.slice(0, 7)}-01`
      schedule = { ...schedule, schedule_period_start: start, schedule_period_end: format(endOfMonth(parseISO(start)), 'yyyy-MM-dd') }
    } else if (granularity === 'week' && reference) {
      const range = getWeekRange(reference)
      schedule = { ...schedule, schedule_period_start: range.start, schedule_period_end: range.end }
    } else if ((granularity === 'day' || granularity === 'time') && reference) {
      schedule = { ...schedule, schedule_date: reference, schedule_start_time: granularity === 'time' ? time : null }
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ parent_id: item?.parent_id ?? parentId, title: title.trim(), description, kind, status, is_actionable: isActionable, show_on_home: showOnHome, ...schedule })
      onClose()
    } catch {
      setError('没有保存成功，请稍后重试。')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} title={item ? '编辑计划项' : '添加计划项'} onClose={onClose} footer={<><Button variant="secondary" type="button" onClick={onClose}>取消</Button><Button form="item-editor-form" type="submit" loading={saving}>保存</Button></>}>
      <form id="item-editor-form" className="item-editor-form" onSubmit={submit}>
        <Field label="名称" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        <label className="ui-field"><span className="ui-field__label">说明</span><textarea className="ui-field__control item-editor__textarea" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="item-editor__pair">
          <label className="ui-field"><span className="ui-field__label">角色</span><select aria-label="角色" className="ui-field__control" value={kind} onChange={(event) => changeKind(event.target.value as PlanItem['kind'])}><option value="direction">人生方向</option><option value="goal">阶段目标</option><option value="project">项目</option><option value="task">普通任务</option></select></label>
          <label className="ui-field"><span className="ui-field__label">状态</span><select aria-label="状态" className="ui-field__control" value={status} onChange={(event) => setStatus(event.target.value as PlanItem['status'])}><option value="todo">待办</option><option value="doing">进行中</option><option value="done">已完成</option><option value="abandoned">已放弃</option></select></label>
        </div>
        <fieldset className="display-fieldset"><legend>呈现与执行</legend><label><input type="checkbox" checked={isActionable} onChange={(event) => changeActionable(event.target.checked)} /><span><strong>作为执行项</strong><small>进入待安排和日程，可以直接完成</small></span></label><label><input type="checkbox" checked={showOnHome} onChange={(event) => setShowOnHome(event.target.checked)} /><span><strong>显示在首页</strong><small>显示目标进度与下一项子计划，不显示复选框</small></span></label></fieldset>
        <fieldset className="schedule-fieldset"><legend>{isActionable ? '执行排期' : '目标周期'}</legend><p>{isActionable ? '目标归属与时间安排彼此独立' : '非执行目标只记录大致周期，不进入每日待办'}</p><div className="schedule-options">{([['', '暂不安排'], ['month', '某个月'], ['week', '某一周'], ...(isActionable ? [['day', '某一天'], ['time', '具体时间']] : [])] as string[][]).map(([value, label]) => <label key={label}><input type="radio" name="schedule" checked={(granularity ?? '') === value} onChange={() => setGranularity((value || null) as PlanItem['schedule_granularity'])} />{label}</label>)}</div>
          {granularity === 'month' && <Field label="选择月份" type="month" value={reference.slice(0, 7)} onChange={(event) => setReference(event.target.value)} />}
          {granularity === 'week' && <Field label="选择这一周中的任意一天" type="date" value={reference.length === 10 ? reference : ''} onChange={(event) => setReference(event.target.value)} />}
          {granularity === 'day' && <Field label="选择日期" type="date" value={reference.length === 10 ? reference : ''} onChange={(event) => setReference(event.target.value)} />}
          {granularity === 'time' && <><div className="item-editor__pair"><Field label="选择日期" type="date" value={reference.length === 10 ? reference : ''} onChange={(event) => setReference(event.target.value)} /><Field label="开始时间" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div><Field label="预计分钟" type="number" min={15} max={1440} step={15} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></>}
        </fieldset>
        {error && <p className="item-editor__error" role="alert">{error}</p>}
      </form>
    </Dialog>
  )
}
