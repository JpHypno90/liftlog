import type {
  AppData,
  Competition,
  Day,
  Entry,
  Exercise,
  Phase,
  Session,
  SetEntry,
  Template,
} from '@/types'
import { DEFAULT_DAYS, emptyEntry } from '@/lib/defaults'
import { uid } from '@/lib/id'
import { todayStr } from '@/lib/date'

/** Current schema version. migrate() brings any older shape up to this. */
export const CURRENT_VERSION = 2

/** A valid, empty dataset at the current version. */
export function emptyAppData(): AppData {
  return {
    version: CURRENT_VERSION,
    athlete: '',
    phases: [],
    sessions: [],
    templates: [],
    competitions: [],
  }
}

// ---- small typed guards / coercers (no `any`) ----

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function nullableId(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

// ---- per-entity normalisers ----

function normalizeExercise(r: Record<string, unknown>): Exercise {
  return {
    id: str(r.id) || uid(),
    name: str(r.name),
    scheme: str(r.scheme),
    cue: str(r.cue),
    warmup: bool(r.warmup),
  }
}

function normalizeSet(r: Record<string, unknown>): SetEntry {
  const w = r.w
  const reps = r.r
  return {
    w: typeof w === 'number' || w === '' ? w : '',
    r: typeof reps === 'number' || reps === '' ? reps : '',
  }
}

function normalizeEntry(r: Record<string, unknown>): Entry {
  return {
    sets: asArray(r.sets).filter(isRecord).map(normalizeSet),
    notes: str(r.notes),
    done: bool(r.done),
  }
}

function normalizeSession(r: Record<string, unknown>): Session {
  const exercises = asArray(r.exercises).filter(isRecord).map(normalizeExercise)
  const rawEntries = isRecord(r.entries) ? r.entries : {}
  // Re-key entries by exercise id so the record always matches the exercises.
  const entries: Record<string, Entry> = {}
  for (const ex of exercises) {
    const e = rawEntries[ex.id]
    entries[ex.id] = isRecord(e) ? normalizeEntry(e) : emptyEntry()
  }
  return {
    id: str(r.id) || uid(),
    phaseId: str(r.phaseId),
    week: num(r.week, 1),
    dayId: str(r.dayId),
    date: str(r.date) || todayStr(),
    exercises,
    entries,
  }
}

function normalizeDay(r: Record<string, unknown>): Day {
  return { id: str(r.id) || uid(), name: str(r.name) }
}

function normalizePhase(r: Record<string, unknown>): Phase {
  let days = asArray(r.days).filter(isRecord).map(normalizeDay)
  // Backfill a default split for any phase missing days.
  if (days.length === 0) days = DEFAULT_DAYS.map((d) => ({ ...d }))
  return {
    id: str(r.id) || uid(),
    name: str(r.name),
    weeks: num(r.weeks, 1),
    startDate: str(r.startDate) || todayStr(),
    compId: nullableId(r.compId),
    copyFrom: nullableId(r.copyFrom),
    seed: bool(r.seed),
    days,
  }
}

function normalizeTemplate(r: Record<string, unknown>): Template {
  return {
    id: str(r.id) || uid(),
    name: str(r.name),
    createdAt: str(r.createdAt) || todayStr(),
    exercises: asArray(r.exercises).filter(isRecord).map(normalizeExercise),
  }
}

function normalizeComp(r: Record<string, unknown>): Competition {
  return { id: str(r.id) || uid(), name: str(r.name), date: str(r.date) }
}

/**
 * Bring any older / unknown shape up to the current AppData schema.
 * Idempotent and version-bumping. Garbage input yields a valid empty dataset.
 *
 * Handles:
 *  - a legacy single `comp` object → `competitions` array
 *  - v1 shapes (no `version`, no per-phase `days`)
 *  - backfilling `phase.days` from the default split
 */
export function migrate(raw: unknown): AppData {
  if (!isRecord(raw)) return emptyAppData()

  // Legacy: a single `comp` object becomes the competitions array.
  let competitions = asArray(raw.competitions).filter(isRecord)
  if (competitions.length === 0 && isRecord(raw.comp)) {
    competitions = [raw.comp]
  }

  return {
    version: CURRENT_VERSION,
    athlete: str(raw.athlete),
    phases: asArray(raw.phases).filter(isRecord).map(normalizePhase),
    sessions: asArray(raw.sessions).filter(isRecord).map(normalizeSession),
    templates: asArray(raw.templates).filter(isRecord).map(normalizeTemplate),
    competitions: competitions.map(normalizeComp),
  }
}
