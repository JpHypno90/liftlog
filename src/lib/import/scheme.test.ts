import { describe, it, expect } from 'vitest'
import { normalizeScheme } from '@/lib/import/scheme'

describe('normalizeScheme', () => {
  it('sets × reps: "3x5"', () => {
    expect(normalizeScheme('3x5')).toEqual({
      scheme: '3×5',
      sets: [
        { w: '', r: 5 },
        { w: '', r: 5 },
        { w: '', r: 5 },
      ],
    })
  })

  it('normalises spacing and the × glyph: "3 × 5"', () => {
    expect(normalizeScheme('3 × 5').scheme).toBe('3×5')
    expect(normalizeScheme('3 × 5').sets).toHaveLength(3)
  })

  it('per-set reps list with slashes: "5/5/5"', () => {
    expect(normalizeScheme('5/5/5')).toEqual({
      scheme: '5/5/5',
      sets: [
        { w: '', r: 5 },
        { w: '', r: 5 },
        { w: '', r: 5 },
      ],
    })
  })

  it('per-set reps list with commas: "5,5,5"', () => {
    expect(normalizeScheme('5,5,5').sets).toHaveLength(3)
  })

  it('sets × reps with weight: "3x5 @100kg"', () => {
    expect(normalizeScheme('3x5 @100kg').sets).toEqual([
      { w: 100, r: 5 },
      { w: 100, r: 5 },
      { w: 100, r: 5 },
    ])
  })

  it('weight × reps single set: "100kg x5"', () => {
    expect(normalizeScheme('100kg x5').sets).toEqual([{ w: 100, r: 5 }])
  })

  it('reps with RPE keeps text but extracts reps: "5 reps @ RPE8"', () => {
    const r = normalizeScheme('5 reps @ RPE8')
    expect(r.sets).toEqual([{ w: '', r: 5 }])
    expect(r.scheme).toBe('5 reps @ RPE8')
  })

  it('lone weight: "100kg"', () => {
    expect(normalizeScheme('100kg').sets).toEqual([{ w: 100, r: '' }])
  })

  it('ambiguous text → no sets', () => {
    expect(normalizeScheme('AMRAP')).toEqual({ scheme: 'AMRAP' })
    expect(normalizeScheme('work up to a heavy single').sets).toBeUndefined()
  })

  it('empty → empty scheme', () => {
    expect(normalizeScheme('')).toEqual({ scheme: '' })
    expect(normalizeScheme('   ')).toEqual({ scheme: '' })
  })
})
