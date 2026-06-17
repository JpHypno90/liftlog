import type { AppData, Day, Entry, Exercise, Phase, Session } from '@/types'
import { seedExercises } from '@/lib/defaults'

/** The subset of state the pure selectors read. */
export type DataSlice = Pick<AppData, 'phases' | 'sessions'>

/** The session for a specific phase/week/day, if one exists. */
export function findSession(
  state: DataSlice,
  phaseId: string,
  week: number,
  dayId: string,
): Session | undefined {
  return state.sessions.find(
    (s) => s.phaseId === phaseId && s.week === week && s.dayId === dayId,
  )
}

/** Find a day within a phase by id. */
export function resolveDay(phase: Phase, dayId: string): Day | undefined {
  return phase.days.find((d) => d.id === dayId)
}

/** Number of logged sessions in a phase. */
export function sessionsForPhase(state: DataSlice, phaseId: string): number {
  return state.sessions.filter((s) => s.phaseId === phaseId).length
}

/** Number of logged sessions on a specific day of a phase. */
export function sessionsForDay(state: DataSlice, phaseId: string, dayId: string): number {
  return state.sessions.filter((s) => s.phaseId === phaseId && s.dayId === dayId).length
}

/** Most-recent-first sort by week then date. */
function recencyDesc<T extends { week: number; date: string }>(a: T, b: T): number {
  return b.week - a.week || b.date.localeCompare(a.date)
}

/** Clone an exercise, preserving its id (so progression can be tracked across weeks). */
function cloneExercise(e: Exercise): Exercise {
  return { ...e }
}

/**
 * Exercises to seed a new session with. Inheritance order:
 *   1. latest session in this phase on the same day (earlier week)
 *   2. the matching day in the phase's `copyFrom` source
 *   3. the phase's seed list (if `seed`)
 *   4. blank
 */
export function baseExercisesFor(
  state: DataSlice,
  phaseId: string,
  dayId: string,
  week: number,
): Exercise[] {
  const phase = state.phases.find((p) => p.id === phaseId)
  if (!phase) return []

  // 1. latest in this phase, same day, an earlier week
  const prior = state.sessions
    .filter((s) => s.phaseId === phaseId && s.dayId === dayId && s.week < week)
    .sort(recencyDesc)
  if (prior.length > 0) return prior[0].exercises.map(cloneExercise)

  // 2. copyFrom source — match the day by name
  if (phase.copyFrom) {
    const src = state.phases.find((p) => p.id === phase.copyFrom)
    const day = resolveDay(phase, dayId)
    if (src && day) {
      const srcDay = src.days.find((d) => d.name === day.name)
      if (srcDay) {
        const srcSessions = state.sessions
          .filter((s) => s.phaseId === src.id && s.dayId === srcDay.id)
          .sort(recencyDesc)
        if (srcSessions.length > 0) return srcSessions[0].exercises.map(cloneExercise)
      }
    }
  }

  // 3. seed list
  if (phase.seed) return seedExercises()

  // 4. blank
  return []
}

/**
 * The most recent logged entry for an exercise on a given day, before `beforeWeek`.
 * Powers the "Last (Wk N): …" previous-weight display.
 */
export function lastLogged(
  state: DataSlice,
  phaseId: string,
  dayId: string,
  exId: string,
  beforeWeek: number,
): { week: number; entry: Entry } | undefined {
  const match = state.sessions
    .filter(
      (s) =>
        s.phaseId === phaseId &&
        s.dayId === dayId &&
        s.week < beforeWeek &&
        s.exercises.some((e) => e.id === exId) &&
        s.entries[exId] !== undefined,
    )
    .sort(recencyDesc)[0]
  if (!match) return undefined
  return { week: match.week, entry: match.entries[exId] }
}
