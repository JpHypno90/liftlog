import { describe, it, expect } from 'vitest'
import { CURRENT_VERSION, emptyAppData, migrate } from '@/lib/migrations'

describe('migrate — garbage input', () => {
  it('returns a valid empty dataset for non-objects', () => {
    for (const garbage of [null, undefined, 42, 'nope', true, [1, 2, 3]]) {
      expect(migrate(garbage)).toEqual(emptyAppData())
    }
  })

  it('tolerates wrong field types', () => {
    const result = migrate({ phases: 'not-an-array', sessions: 5, athlete: 99 })
    expect(result).toEqual(emptyAppData())
  })

  it('stamps the current version', () => {
    expect(migrate({}).version).toBe(CURRENT_VERSION)
  })
})

describe('migrate — legacy single comp object', () => {
  it('promotes `comp` to a one-element competitions array', () => {
    const result = migrate({
      version: 1,
      comp: { id: 'c1', name: 'Nationals', date: '2026-09-01' },
    })
    expect(result.competitions).toEqual([{ id: 'c1', name: 'Nationals', date: '2026-09-01' }])
  })

  it('prefers an existing competitions array over `comp`', () => {
    const result = migrate({
      comp: { id: 'old', name: 'Old', date: '2020-01-01' },
      competitions: [{ id: 'c2', name: 'Regionals', date: '2026-05-01' }],
    })
    expect(result.competitions).toEqual([{ id: 'c2', name: 'Regionals', date: '2026-05-01' }])
  })
})

describe('migrate — v1 shape & days backfill', () => {
  it('backfills the default split for a phase missing days', () => {
    const result = migrate({
      version: 1,
      phases: [{ id: 'p1', name: 'Block A', weeks: 8, startDate: '2026-01-01' }],
    })
    expect(result.version).toBe(CURRENT_VERSION)
    expect(result.phases[0].days.map((d) => d.name)).toEqual(['Pull', 'Push', 'Events'])
    expect(result.phases[0].compId).toBeNull()
    expect(result.phases[0].copyFrom).toBeNull()
  })

  it('keeps existing days untouched', () => {
    const days = [{ id: 'd1', name: 'Squat' }]
    const result = migrate({ phases: [{ id: 'p1', name: 'P', days }] })
    expect(result.phases[0].days).toEqual(days)
  })
})

describe('migrate — idempotency', () => {
  it('migrating twice yields an identical result', () => {
    const once = migrate({
      version: 1,
      comp: { id: 'c1', name: 'Comp', date: '2026-09-01' },
      phases: [{ id: 'p1', name: 'Block', weeks: 6, startDate: '2026-01-01' }],
      sessions: [],
      templates: [],
    })
    const twice = migrate(once)
    expect(twice).toEqual(once)
  })
})
