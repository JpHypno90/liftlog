/** Iron Log data model. These types are the backbone — keep them strict. */

export interface Exercise {
  id: string
  name: string
  /** e.g. "3×5", "5/3/1" — free text. */
  scheme: string
  /** Coaching cue / note shown with the exercise. */
  cue: string
  warmup: boolean
}

/** A single logged set. Weight/reps may be blank while in progress. */
export interface SetEntry {
  w: number | ''
  r: number | ''
}

/** The logged data for one exercise within a session. */
export interface Entry {
  sets: SetEntry[]
  notes: string
  done: boolean
}

export interface Day {
  id: string
  name: string
}

export interface Session {
  id: string
  phaseId: string
  week: number
  dayId: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  exercises: Exercise[]
  /** Keyed by exercise id. */
  entries: Record<string, Entry>
}

export interface Phase {
  id: string
  name: string
  weeks: number
  /** ISO date, YYYY-MM-DD. */
  startDate: string
  compId: string | null
  /** Phase id to inherit day structure / exercises from. */
  copyFrom: string | null
  /** Whether to seed new sessions with a default exercise list. */
  seed: boolean
  days: Day[]
}

export interface Template {
  id: string
  name: string
  /** ISO date, YYYY-MM-DD. */
  createdAt: string
  exercises: Exercise[]
}

export interface Competition {
  id: string
  name: string
  /** ISO date, YYYY-MM-DD. */
  date: string
}

export interface AppData {
  /** Schema version — bumped by migrations. */
  version: number
  athlete: string
  phases: Phase[]
  sessions: Session[]
  templates: Template[]
  competitions: Competition[]
}

export type Tab = 'log' | 'phases' | 'comps' | 'more'
