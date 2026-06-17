import type { AppData, Entry } from '@/types'
import { addDays, formatDate } from '@/lib/date'

export interface SheetExercise {
  id: string
  name: string
  scheme: string
  warmup: boolean
  /** Logged sets formatted as "200×5 · 200×5", blank if nothing logged. */
  sets: string
  notes: string
}

export interface SheetDay {
  id: string
  name: string
  exercises: SheetExercise[]
}

export interface WeekSheet {
  athlete: string
  phaseName: string
  weeks: number
  week: number
  date: string
  days: SheetDay[]
}

type ExportData = Pick<AppData, 'athlete' | 'phases' | 'sessions'>

function fmtSets(entry: Entry): string {
  return entry.sets
    .filter((s) => s.w !== '' || s.r !== '')
    .map((s) => `${s.w === '' ? '–' : s.w}×${s.r === '' ? '–' : s.r}`)
    .join(' · ')
}

/** Structured view of one logged week — only days that have a session. */
export function weekSheet(data: ExportData, phaseId: string, week: number): WeekSheet | null {
  const phase = data.phases.find((p) => p.id === phaseId)
  if (!phase) return null

  const days: SheetDay[] = []
  for (const day of phase.days) {
    const session = data.sessions.find(
      (s) => s.phaseId === phaseId && s.week === week && s.dayId === day.id,
    )
    if (!session) continue
    days.push({
      id: day.id,
      name: day.name,
      exercises: session.exercises.map((ex) => {
        const entry = session.entries[ex.id]
        return {
          id: ex.id,
          name: ex.name,
          scheme: ex.scheme,
          warmup: ex.warmup,
          sets: entry ? fmtSets(entry) : '',
          notes: entry?.notes.trim() ?? '',
        }
      }),
    })
  }

  return {
    athlete: data.athlete.trim(),
    phaseName: phase.name,
    weeks: phase.weeks,
    week,
    date: formatDate(addDays(phase.startDate, (week - 1) * 7)),
    days,
  }
}

/** Pure plain-text summary of a phase's logged week. Empty string if no phase. */
export function exportWeekText(data: ExportData, phaseId: string, week: number): string {
  const sheet = weekSheet(data, phaseId, week)
  if (!sheet) return ''

  const lines: string[] = []
  lines.push(`IRON LOG${sheet.athlete ? ` — ${sheet.athlete}` : ''}`)
  lines.push(`${sheet.phaseName} — Week ${sheet.week} of ${sheet.weeks}`)
  lines.push(sheet.date)
  lines.push('')

  if (sheet.days.length === 0) {
    lines.push('No sessions logged this week.')
  } else {
    for (const day of sheet.days) {
      lines.push(`== ${day.name} ==`)
      if (day.exercises.length === 0) lines.push('(no exercises)')
      for (const ex of day.exercises) {
        const scheme = ex.scheme ? ` (${ex.scheme})` : ''
        const wu = ex.warmup ? ' [warm-up]' : ''
        lines.push(`${ex.name}${scheme}${wu}`)
        if (ex.sets) lines.push(`  ${ex.sets}`)
        if (ex.notes) lines.push(`  notes: ${ex.notes}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n').trimEnd() + '\n'
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'phase'
  )
}

/** Slugified download filename, e.g. "ironlog-comp-prep-wk3.txt". */
export function exportWeekFilename(phaseName: string, week: number): string {
  return `ironlog-${slugify(phaseName)}-wk${week}.txt`
}
