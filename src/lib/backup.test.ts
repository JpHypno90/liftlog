import { describe, it, expect } from 'vitest'
import { exportData, importData } from '@/lib/backup'
import { CURRENT_VERSION } from '@/lib/migrations'
import type { AppData } from '@/types'

function sampleData(): AppData {
  return {
    version: CURRENT_VERSION,
    athlete: 'Jp',
    phases: [
      {
        id: 'p1',
        name: 'Comp Prep',
        weeks: 8,
        startDate: '2026-01-05',
        compId: 'c1',
        copyFrom: null,
        seed: true,
        days: [
          { id: 'pull', name: 'Pull' },
          { id: 'push', name: 'Push' },
        ],
      },
    ],
    sessions: [
      {
        id: 's1',
        phaseId: 'p1',
        week: 1,
        dayId: 'pull',
        date: '2026-01-05',
        exercises: [{ id: 'e1', name: 'Deadlift', scheme: '3×3', cue: 'brace', warmup: true }],
        entries: {
          e1: { sets: [{ w: 200, r: 3 }, { w: 220, r: 1 }], notes: 'felt heavy', done: true },
        },
      },
    ],
    templates: [
      {
        id: 't1',
        name: 'Pull day',
        createdAt: '2026-01-01',
        exercises: [{ id: 'te1', name: 'Row', scheme: '4×8', cue: '', warmup: false }],
      },
    ],
    competitions: [{ id: 'c1', name: 'Nationals', date: '2026-03-01' }],
  }
}

describe('backup round-trip', () => {
  it('export → import restores the data losslessly', () => {
    const data = sampleData()
    const restored = importData(exportData(data))
    expect(restored).toEqual(data)
  })

  it('re-export is byte-identical (export → wipe → import → export)', () => {
    const data = sampleData()
    const json1 = exportData(data)

    // wipe
    let current = importData('garbage that does not parse')
    expect(current.phases).toHaveLength(0)

    // restore from the backup
    current = importData(json1)
    const json2 = exportData(current)

    expect(json2).toBe(json1)
  })

  it('produces stable output regardless of key order', () => {
    const data = sampleData()
    const reordered = JSON.parse(
      JSON.stringify({
        competitions: data.competitions,
        sessions: data.sessions,
        athlete: data.athlete,
        version: data.version,
        templates: data.templates,
        phases: data.phases,
      }),
    )
    expect(exportData(reordered)).toBe(exportData(data))
  })
})
