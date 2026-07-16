import { describe, expect, it } from 'vitest'
import { hourFromPointer, selectedTimeRange } from './timeSelection'

describe('time selection', () => {
  it('maps pointer position and supports dragging upward', () => {
    expect(hourFromPointer(168, 100, 884)).toBe(9)
    expect(selectedTimeRange(11, 9)).toEqual({ time: '09:00', durationMinutes: 180 })
  })
})
