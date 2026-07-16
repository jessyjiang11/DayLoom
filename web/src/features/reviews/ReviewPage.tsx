import { useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isWithinInterval, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { periodNoteKeys, reviewKeys, listPeriodNotes, listReviews, savePeriodNote, saveReview } from '../../repositories/reviewRepository'
import type { PeriodNote, Review } from '../../types/domain'
import { useAuth } from '../auth/useAuth'
import { useWorkspaceItems } from '../items/useWorkspaceItems'
import { useSync } from '../sync/useSync'
import './reviews.css'

type PeriodType = 'day' | 'week' | 'month'
type ReviewDraft = Pick<Review, 'summary' | 'went_well' | 'blocked' | 'next_step'> & Pick<PeriodNote, 'focus_text' | 'note_text'>

const emptyDraft: ReviewDraft = { focus_text: '', note_text: '', summary: '', went_well: '', blocked: '', next_step: '' }

export function ReviewEditor({ initial = emptyDraft, readOnly = false, onSave }: { initial?: ReviewDraft; readOnly?: boolean; onSave: (draft: ReviewDraft) => Promise<void> }) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const field = (name: keyof ReviewDraft) => ({ value: draft[name], onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setDraft((current) => ({ ...current, [name]: event.target.value })) })
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setMessage(null); try { await onSave(draft); setMessage('已经保存到云端') } catch { setMessage('保存失败，请检查网络后重试') } finally { setSaving(false) } }
  return <form className="review-editor" onSubmit={submit}>
    <section className="review-focus-card"><label htmlFor="review-focus">这一阶段最重要的一句话</label><textarea id="review-focus" placeholder="例如：完成能用的第一版，也给自己留一点余地。" {...field('focus_text')} disabled={readOnly} /></section>
    <div className="review-writing-grid"><label className="review-field review-field--wide"><span>发生了什么</span><small>不用写得完整，先记住真正发生的事。</small><textarea aria-label="发生了什么" placeholder="这一阶段完成了……" {...field('summary')} disabled={readOnly} /></label>
      <label className="review-field"><span>做得好的</span><small>哪些选择值得下次继续？</small><textarea aria-label="做得好的" placeholder="我做对了……" {...field('went_well')} disabled={readOnly} /></label>
      <label className="review-field"><span>遇到的阻碍</span><small>不是责备自己，只是看清问题。</small><textarea aria-label="遇到的阻碍" placeholder="我卡在……" {...field('blocked')} disabled={readOnly} /></label>
      <label className="review-field review-field--next"><span>下一步</span><small>只写一个足够小、能够开始的动作。</small><textarea aria-label="下一步" placeholder="接下来先……" {...field('next_step')} disabled={readOnly} /></label>
      <label className="review-field"><span>留给自己的话</span><small>感受、灵感或不想忘记的小事。</small><textarea aria-label="留给自己的话" placeholder="此刻我想记住……" {...field('note_text')} disabled={readOnly} /></label>
    </div><footer className="review-editor__footer">{message && <p role="status" className={message.startsWith('保存失败') ? 'is-error' : ''}>{message}</p>}<Button type="submit" loading={saving} disabled={readOnly}>保存复盘</Button></footer>
  </form>
}

function periodStart(type: PeriodType, reference: Date) {
  if (type === 'week') return startOfWeek(reference, { weekStartsOn: 1 })
  if (type === 'month') return startOfMonth(reference)
  return reference
}

function periodEnd(type: PeriodType, start: Date) {
  if (type === 'week') return endOfWeek(start, { weekStartsOn: 1 })
  if (type === 'month') return endOfMonth(start)
  return start
}

function periodLabel(type: PeriodType, start: Date) {
  if (type === 'day') return format(start, 'M月d日 EEEE', { locale: zhCN })
  if (type === 'week') return `${format(start, 'M月d日')} — ${format(endOfWeek(start, { weekStartsOn: 1 }), 'M月d日')}`
  return format(start, 'yyyy年 M月')
}

export function ReviewPage() {
  const { client, user } = useAuth(); const sync = useSync(); const queryClient = useQueryClient(); const { items } = useWorkspaceItems()
  const [type, setType] = useState<PeriodType>('week'); const [reference, setReference] = useState(new Date())
  const start = periodStart(type, reference); const startKey = format(start, 'yyyy-MM-dd'); const end = periodEnd(type, start)
  const reviews = useQuery({ queryKey: reviewKeys.list(user?.id ?? ''), enabled: Boolean(client && user), queryFn: () => listReviews(client!, user!.id) })
  const notes = useQuery({ queryKey: periodNoteKeys.list(user?.id ?? ''), enabled: Boolean(client && user), queryFn: () => listPeriodNotes(client!, user!.id) })
  const currentReview = reviews.data?.find((item) => item.period_type === type && item.period_start === startKey)
  const currentNote = notes.data?.find((item) => item.period_type === type && item.period_start === startKey)
  const initial = useMemo<ReviewDraft>(() => ({ summary: currentReview?.summary ?? '', went_well: currentReview?.went_well ?? '', blocked: currentReview?.blocked ?? '', next_step: currentReview?.next_step ?? '', focus_text: currentNote?.focus_text ?? '', note_text: currentNote?.note_text ?? '' }), [currentNote, currentReview])
  const scheduled = items.filter((item) => { const value = item.schedule_date; return value ? isWithinInterval(parseISO(value), { start, end }) : item.schedule_period_start === startKey })
  const completed = scheduled.filter((item) => item.status === 'done').length
  function move(amount: number) { setReference((date) => type === 'day' ? addDays(date, amount) : type === 'week' ? addWeeks(date, amount) : addMonths(date, amount)) }
  async function save(draft: ReviewDraft) { if (!client || !user) return; await Promise.all([saveReview(client, { user_id: user.id, period_type: type, period_start: startKey, summary: draft.summary, went_well: draft.went_well, blocked: draft.blocked, next_step: draft.next_step }), savePeriodNote(client, { user_id: user.id, period_type: type, period_start: startKey, focus_text: draft.focus_text, note_text: draft.note_text })]); await Promise.all([queryClient.invalidateQueries({ queryKey: reviewKeys.list(user.id) }), queryClient.invalidateQueries({ queryKey: periodNoteKeys.list(user.id) })]) }

  return <div className="reviews-page"><header className="section-heading review-heading"><div><p>复盘</p><h1>看见走过的路。</h1><span>不是给自己打分，而是更了解什么真正适合你。</span></div><div className="review-type-tabs">{(['day','week','month'] as PeriodType[]).map((value) => <button key={value} className={type === value ? 'is-active' : ''} onClick={() => { setType(value); setReference(new Date()) }}>{({ day: '日', week: '周', month: '月' })[value]}</button>)}</div></header>
    <div className="review-period-bar"><button aria-label="上一个周期" onClick={() => move(-1)}>‹</button><strong>{periodLabel(type, start)}</strong><button aria-label="下一个周期" onClick={() => move(1)}>›</button><button className="review-today" onClick={() => setReference(new Date())}>回到现在</button></div>
    <div className="review-overview"><div><small>已完成</small><strong>{completed}</strong></div><div><small>已安排</small><strong>{scheduled.length}</strong></div><div><small>完成比例</small><strong>{scheduled.length ? Math.round(completed / scheduled.length * 100) : 0}%</strong></div><p>{scheduled.length ? '数字只是线索。更重要的是，哪些安排真正帮到了你？' : '这一阶段还没有排期，也可以只写下生活里真实发生的事。'}</p></div>
    {(reviews.isLoading || notes.isLoading) ? <p role="status">正在读取复盘…</p> : <ReviewEditor key={`${type}:${startKey}:${currentReview?.updated_at ?? ''}:${currentNote?.updated_at ?? ''}`} initial={initial} readOnly={sync.readOnly} onSave={save} />}
  </div>
}
