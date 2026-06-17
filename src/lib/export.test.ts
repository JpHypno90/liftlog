import { describe, it, expect } from 'vitest'
import { exportWeekText, exportWeekFilename, weekSheet } from '@/lib/export'
import type { AppData } from '@/types'

function data(): Pick<AppData, 'athlete' | 'phases' | 'sessions'> {
  return {
    athlete: 'Jp',
    phases: [
      {
        id: 'p1',
        name: 'Comp Prep',
        weeks: 8,
        startDate: '2026-01-05', // Monday → week 3 starts 2026-01-19
        compId: null,
        copyFrom: null,
        seed: false,
        days: [
          { id: 'd1', name: 'Squat' },
          { id: 'd2', name: 'Bench' }, // no session this week → omitted
          { id: 'd3', name: 'Pull' },
        ],
      },
    ],
    sessions: [
      {
        id: 's1',
        phaseId: 'p1',
        week: 3,
        dayId: 'd1',
        date: '2026-01-19',
        exercises: [
          { id: 'e1', name: 'Back Squat', scheme: '3×5', cue: '', warmup: true },
          { id: 'e2', name: 'Leg Press', scheme: '3×12', cue: '', warmup: false },
        ],
        entries: {
          e1: { sets: [{ w: 200, r: 5 }, { w: 200, r: 5 }], notes: 'felt strong', done: true },
          e2: { sets: [{ w: '', r: '' }], notes: '', done: false },
        },
      },
      {
        id: 's2',
        phaseId: 'p1',
        week: 3,
        dayId: 'd3',
        date: '2026-01-21',
        exercises: [{ id: 'e3', name: 'Deadlift', scheme: '1×3', cue: '', warmup: false }],
        entries: { e3: { sets: [{ w: 250, r: 3 }], notes: '', done: true } },
      },
    ],
  }
}

describe('exportWeekText', () => {
  it('renders a multi-day logged week with warm-ups, sets, and notes', () => {
    const out = exportWeekText(data(), 'p1', 3)
    expect(out).toContain('IRON LOG — Jp')
    expect(out).toContain('Comp Prep — Week 3 of 8')
    // only days with a session appear, in phase.days order
    expect(out).toContain('== Squat ==')
    expect(out).toContain('== Pull ==')
    expect(out).not.toContain('== Bench ==')
    // warm-up marker + logged sets + notes
    expect(out).toContain('Back Squat (3×5) [warm-up]')
    expect(out).toContain('200×5 · 200×5')
    expect(out).toContain('notes: felt strong')
    // an exercise with no logged sets has no set line
    expect(out).toContain('Leg Press (3×12)')
    expect(out).toContain('250×3')
  })

  it('reports an empty week', () => {
    expect(exportWeekText(data(), 'p1', 7)).toContain('No sessions logged this week.')
  })

  it('returns empty string for an unknown phase', () => {
    expect(exportWeekText(data(), 'nope', 1)).toBe('')
  })
})

describe('weekSheet', () => {
  it('includes only days with sessions', () => {
    const sheet = weekSheet(data(), 'p1', 3)!
    expect(sheet.days.map((d) => d.name)).toEqual(['Squat', 'Pull'])
    expect(sheet.days[0].exercises[0].warmup).toBe(true)
    expect(sheet.days[0].exercises[1].sets).toBe('') // blank set not shown
  })
})

describe('exportWeekFilename', () => {
  it('slugifies the phase name', () => {
    expect(exportWeekFilename('Comp Prep', 3)).toBe('ironlog-comp-prep-wk3.txt')
    expect(exportWeekFilename('Pull & Accessories!', 12)).toBe('ironlog-pull-accessories-wk12.txt')
    expect(exportWeekFilename('   ', 1)).toBe('ironlog-phase-wk1.txt')
  })
})
