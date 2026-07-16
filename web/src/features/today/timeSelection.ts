export function hourFromPointer(clientY: number, top: number, height: number, startHour = 8, slots = 13) {
  if (height <= 0) return startHour
  const index = Math.max(0, Math.min(slots - 1, Math.floor((clientY - top) / (height / slots))))
  return startHour + index
}

export function selectedTimeRange(anchor: number, current: number) {
  const start = Math.min(anchor, current)
  const end = Math.max(anchor, current)
  return { time: `${String(start).padStart(2, '0')}:00`, durationMinutes: (end - start + 1) * 60 }
}
