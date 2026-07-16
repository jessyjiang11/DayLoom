import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { PlanItem } from '../../types/domain'

export function TaskChip({ item }: { item: PlanItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
  return <button ref={setNodeRef} className={`plan-chip ${isDragging ? 'is-dragging' : ''}`} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }} {...listeners} {...attributes}><span>{item.title}</span>{item.schedule_start_time && <small>{item.schedule_start_time.slice(0, 5)}</small>}</button>
}

export function DropZone({ id, className = '', children, label }: { id: string; className?: string; children: ReactNode; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return <section ref={setNodeRef} className={`${className} drop-zone ${isOver ? 'is-over' : ''}`} aria-label={label}>{children}</section>
}
