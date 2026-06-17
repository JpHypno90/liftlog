import { describe, it, expect } from 'vitest'
import { addDays, mondayOf, weekIndex } from '@/lib/date'

describe('addDays', () => {
  it('adds and subtracts days across month boundaries', () => {
    expect(addDays('2026-01-30', 2)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-01-01', 0)).toBe('2026-01-01')
  })

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('mondayOf', () => {
  it('returns the Monday of the containing week', () => {
    // 2026-06-17 is a Wednesday
    expect(mondayOf('2026-06-17')).toBe('2026-06-15')
  })

  it('is idempotent on a Monday', () => {
    expect(mondayOf('2026-06-15')).toBe('2026-06-15')
  })

  it('treats Sunday as the end of the week', () => {
    // 2026-06-21 is a Sunday → Monday is the 15th
    expect(mondayOf('2026-06-21')).toBe('2026-06-15')
  })
})

describe('weekIndex', () => {
  it('is week 1 on the start date and within the first 6 days', () => {
    expect(weekIndex('2026-01-01', '2026-01-01')).toBe(1)
    expect(weekIndex('2026-01-07', '2026-01-01')).toBe(1)
  })

  it('rolls to week 2 after 7 days', () => {
    expect(weekIndex('2026-01-08', '2026-01-01')).toBe(2)
    expect(weekIndex('2026-01-22', '2026-01-01')).toBe(4)
  })

  it('clamps to 1 for dates before the start', () => {
    expect(weekIndex('2025-12-25', '2026-01-01')).toBe(1)
  })
})
