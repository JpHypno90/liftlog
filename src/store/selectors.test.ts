import { describe, it, expect } from 'vitest'
import { resolveDay, lastLogged, baseExercisesFor, type DataSlice } from '@/store/selectors'
import type { Phase, Session } from '@/types'

const phase: Phase = {
  id: 'p1',
  name: 'P',
  weeks: 8,
  startDate: '2026-01-01',
  compId: null,
  copyFrom: null,
  seed: false,
  days: [
    { id: 'pull', name: 'Pull' },
    { id: 'push', name: 'Push' },
  ],
}

function session(week: number, date: string): Session {
  return {
    id: `s${week}`,
    phaseId: 'p1',
    week,
    dayId: 'pull',
    date,
    exercises: [{ id: 'e1', name: 'Deadlift', scheme: '3×3', cue: '', warmup: false }],
    entries: { e1: { sets: [{ w: 100 + week, r: 5 }], notes: '', done: true } },
  }
}

describe('resolveDay', () => {
  it('finds a day by id, undefined otherwise', () => {
    expect(resolveDay(phase, 'push')?.name).toBe('Push')
    expect(resolveDay(phase, 'nope')).toBeUndefined()
  })
})

describe('lastLogged', () => {
  const state: DataSlice = {
    phases: [phase],
    sessions: [session(1, '2026-01-05'), session(2, '2026-01-12'), session(3, '2026-01-19')],
  }

  it('returns the most recent entry strictly before the target week', () => {
    const r = lastLogged(state, 'p1', 'pull', 'e1', 3)
    expect(r?.week).toBe(2)
    expect(r?.entry.sets[0].w).toBe(102)
  })

  it('is undefined when no earlier session exists', () => {
    expect(lastLogged(state, 'p1', 'pull', 'e1', 1)).toBeUndefined()
  })
})

describe('baseExercisesFor', () => {
  it('returns blank for an unknown phase', () => {
    expect(baseExercisesFor({ phases: [], sessions: [] }, 'missing', 'pull', 1)).toEqual([])
  })
})
