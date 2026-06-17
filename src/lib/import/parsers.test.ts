import { describe, it, expect } from 'vitest'
import type { Day } from '@/types'
import { matchDay } from '@/lib/import/matchDay'
import { parseText } from '@/lib/import/text'
import { detectColumns, parseSheet } from '@/lib/import/sheet'
import { parseTable } from '@/lib/import/table'
import { sniffText } from '@/lib/import/dispatch'

const days: Day[] = [
  { id: 'd1', name: 'Pull' },
  { id: 'd2', name: 'Push / Press' },
  { id: 'd3', name: 'Events' },
]

describe('matchDay', () => {
  it('exact (case-insensitive)', () => {
    expect(matchDay('pull', days)?.id).toBe('d1')
  })
  it('substring either direction', () => {
    expect(matchDay('Pull Day', days)?.id).toBe('d1')
    expect(matchDay('press', days)?.id).toBe('d2')
  })
  it('word overlap', () => {
    expect(matchDay('Strongman Events', days)?.id).toBe('d3')
  })
  it('no match → undefined', () => {
    expect(matchDay('Cardio', days)).toBeUndefined()
  })
})

describe('parseText', () => {
  it('groups lines under day-name headers', () => {
    const raw = [
      '== Pull ==',
      'Deadlift | 3x5 | brace hard',
      'Row | 4x8',
      '# Events',
      'Yoke | 20m | fast',
      '',
      '----',
    ].join('\n')
    const out = parseText(raw, 'Fallback')
    expect(out.Pull.map((e) => e.name)).toEqual(['Deadlift', 'Row'])
    expect(out.Pull[0].cue).toBe('brace hard')
    expect(out.Pull[0].sets).toHaveLength(3)
    expect(out.Events.map((e) => e.name)).toEqual(['Yoke'])
    expect(out.Events[0].scheme).toBe('20m') // not a known notation → text only
    expect(out.Events[0].sets).toBeUndefined()
  })

  it('keeps an unmatched header as its own day-name group', () => {
    const out = parseText('== Cardio ==\nBike | 10min', 'Pull')
    expect(out.Cardio.map((e) => e.name)).toEqual(['Bike'])
  })

  it('lines before any header go under the fallback name', () => {
    const out = parseText('Squat\n\n====\n---\nBench', 'Day 1')
    expect(out['Day 1'].map((e) => e.name)).toEqual(['Squat', 'Bench'])
  })

  it('splits a trailing scheme off a bare line', () => {
    const out = parseText('Back Squat 3x5', 'Day 1')
    expect(out['Day 1'][0]).toMatchObject({ name: 'Back Squat', scheme: '3×5' })
  })
})

describe('detectColumns', () => {
  it('maps by header text', () => {
    const map = detectColumns(['Movement', 'Sets x Reps', 'Weight', 'Notes'])
    expect(map).toEqual({ name: 0, scheme: 1, reps: null, weight: 2, cue: 3 })
  })
  it('maps separate reps/weight columns and comments', () => {
    const map = detectColumns(['Exercise', 'Reps', 'Load', 'Comments'])
    expect(map).toMatchObject({ name: 0, reps: 1, weight: 2, cue: 3 })
  })
  it('falls back to first column for the name', () => {
    expect(detectColumns(['col1', 'col2']).name).toBe(0)
  })
})

describe('parseSheet', () => {
  it('skips the header row and maps a combined scheme column', () => {
    const rows = [
      ['Movement', 'Sets x Reps', 'Weight', 'Notes'],
      ['Deadlift', '3x5', '200', 'belt'],
      ['', '', '', ''], // blank → dropped
      ['Row', '4x8', '', ''],
    ]
    const out = parseSheet(rows, detectColumns(rows[0]), true)
    expect(out.map((e) => e.name)).toEqual(['Deadlift', 'Row'])
    expect(out[0].sets).toEqual([
      { w: 200, r: 5 },
      { w: 200, r: 5 },
      { w: 200, r: 5 },
    ])
    expect(out[0].cue).toBe('belt')
  })

  it('xlsx-style separate sets/reps/weight columns', () => {
    // header: Exercise | Sets | Reps | Weight
    const rows = [
      ['Exercise', 'Sets', 'Reps', 'Weight'],
      ['Squat', '3', '5', '100'],
    ]
    const map = detectColumns(rows[0])
    const out = parseSheet(rows, map, true)
    expect(out[0].name).toBe('Squat')
    expect(out[0].sets).toEqual([
      { w: 100, r: 5 },
      { w: 100, r: 5 },
      { w: 100, r: 5 },
    ])
  })

  it('keeps a rep range from a reps column (no false number)', () => {
    const rows = [
      ['Exercise', 'Sets', 'Reps'],
      ['DB rear delt raise', '3', '12-15'],
    ]
    const out = parseSheet(rows, detectColumns(rows[0]), true)
    expect(out[0].scheme).toBe('3×12-15')
    expect(out[0].sets).toEqual([
      { w: '', r: '' },
      { w: '', r: '' },
      { w: '', r: '' },
    ])
  })

  it('respects hasHeader=false', () => {
    const rows = [['Deadlift', '5/5/5']]
    const out = parseSheet(rows, { name: 0, scheme: 1, reps: null, weight: null, cue: null }, false)
    expect(out).toHaveLength(1)
    expect(out[0].sets).toHaveLength(3)
  })
})

describe('parseTable (HTML)', () => {
  it('parses headers + rows and auto-detects columns', () => {
    const html = `
      <table>
        <tr><th>Movement</th><th>Sets&nbsp;x&nbsp;Reps</th><th>Weight</th><th>Notes</th></tr>
        <tr><td>Log Press</td><td>3x3</td><td>80</td><td>push</td></tr>
        <tr><td>Carry</td><td>2x20m</td><td></td><td>fast</td></tr>
      </table>`
    const { headers, rows, colMap } = parseTable(html)
    expect(headers).toEqual(['Movement', 'Sets x Reps', 'Weight', 'Notes'])
    expect(rows).toHaveLength(2)
    expect(colMap).toMatchObject({ name: 0, scheme: 1, weight: 2, cue: 3 })

    const exercises = parseSheet(rows, colMap, false)
    expect(exercises.map((e) => e.name)).toEqual(['Log Press', 'Carry'])
    expect(exercises[0].sets).toEqual([
      { w: 80, r: 3 },
      { w: 80, r: 3 },
      { w: 80, r: 3 },
    ])
  })

  it('detects a leading title row and uses the next row as headers', () => {
    // Mirrors a coach's export: a merged title above the column headers.
    const html = `
      <table>
        <tr><td>Pull and accessories</td></tr>
        <tr><th>Session</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Exercise cues</th></tr>
        <tr><td>3</td><td>Axle deficit deadlift</td><td>3</td><td>6</td><td>control</td></tr>
      </table>`
    const { title, headers, rows, colMap } = parseTable(html)
    expect(title).toBe('Pull and accessories')
    expect(headers[1]).toBe('Exercise')
    expect(colMap).toMatchObject({ name: 1, scheme: 2, reps: 3, cue: 4 })
    const exercises = parseSheet(rows, colMap, false)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].name).toBe('Axle deficit deadlift')
    expect(exercises[0].sets).toEqual([
      { w: '', r: 6 },
      { w: '', r: 6 },
      { w: '', r: 6 },
    ])
  })
})

describe('sniffText', () => {
  it('detects TSV', () => {
    expect(sniffText('Name\tScheme\nSquat\t3x5').mode).toBe('sheet')
  })
  it('detects CSV', () => {
    expect(sniffText('Name,Scheme\nSquat,3x5\nBench,5x5').mode).toBe('sheet')
  })
  it('falls back to prose text', () => {
    expect(sniffText('Squat 3x5\nBench press 5x5').mode).toBe('text')
  })
})
