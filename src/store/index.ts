import { create } from 'zustand'
import type { StoreApi, UseBoundStore } from 'zustand'
import type {
  AppData,
  Competition,
  Entry,
  Exercise,
  Phase,
  Session,
  Tab,
  Template,
} from '@/types'
import { emptyEntry, newExercise, DEFAULT_DAYS } from '@/lib/defaults'
import { uid } from '@/lib/id'
import { todayStr } from '@/lib/date'
import { CURRENT_VERSION, migrate } from '@/lib/migrations'
import { localStorageAdapter, STORAGE_KEY, type StorageAdapter } from '@/lib/storage'
import { exportData, importData } from '@/lib/backup'
import { baseExercisesFor } from '@/store/selectors'

const PERSIST_DELAY = 400

/** UI selection state — not persisted as part of the dataset. */
interface UIState {
  activePhaseId: string | null
  week: number
  dayId: string | null
  tab: Tab
  editing: boolean
}

interface Actions {
  // lifecycle
  hydrate: () => Promise<void>
  flush: () => Promise<void>
  replaceData: (data: AppData) => void
  // backup
  exportJSON: () => string
  importJSON: (json: string) => void
  // athlete
  setAthlete: (name: string) => void
  // ui
  setTab: (tab: Tab) => void
  setWeek: (week: number) => void
  setDay: (dayId: string | null) => void
  setEditing: (editing: boolean) => void
  selectPhase: (id: string | null) => void
  // phases
  addPhase: (input: Partial<Phase> & { name: string }) => string
  updatePhase: (id: string, patch: Partial<Phase>) => void
  removePhase: (id: string) => void
  // sessions
  startSession: (args: { phaseId: string; dayId: string; week: number; date?: string }) => string
  /** Start a loose session not tied to any phase (phaseId/dayId = ''). */
  startLooseSession: () => string
  /** Turn a logged session into Week 1 of a new phase, re-homing it. */
  createPhaseFromSession: (
    sessionId: string,
    args: { name: string; weeks: number; startDate: string; dayName: string },
  ) => string
  /** Create or replace the session at phase/week/day with explicit exercises+entries (import). */
  importSession: (args: {
    phaseId: string
    dayId: string
    week: number
    date: string
    exercises: Exercise[]
    entries: Record<string, Entry>
  }) => string
  updateSession: (id: string, patch: Partial<Omit<Session, 'id'>>) => void
  removeSession: (id: string) => void
  setSessionDate: (id: string, date: string) => void
  // exercises within a session
  addExercise: (sessionId: string, input?: Partial<Exercise>) => string
  removeExercise: (sessionId: string, exId: string) => void
  updateExercise: (sessionId: string, exId: string, patch: Partial<Exercise>) => void
  reorderExercises: (sessionId: string, from: number, to: number) => void
  // entries
  addSet: (sessionId: string, exId: string) => void
  removeSet: (sessionId: string, exId: string, index: number) => void
  setField: (
    sessionId: string,
    exId: string,
    index: number,
    field: 'w' | 'r',
    value: number | '',
  ) => void
  setNotes: (sessionId: string, exId: string, notes: string) => void
  setDone: (sessionId: string, exId: string, done: boolean) => void
  toggleWarmup: (sessionId: string, exId: string) => void
  // templates
  saveTemplate: (name: string, exercises: Exercise[]) => string
  removeTemplate: (id: string) => void
  // competitions
  addCompetition: (input: Partial<Competition> & { name: string }) => string
  updateCompetition: (id: string, patch: Partial<Competition>) => void
  removeCompetition: (id: string) => void
}

export type IronLogState = AppData & UIState & Actions

/** Extract just the persisted dataset from full state. */
export function extractData(s: AppData): AppData {
  return {
    version: s.version,
    athlete: s.athlete,
    phases: s.phases,
    sessions: s.sessions,
    templates: s.templates,
    competitions: s.competitions,
  }
}

const initialData: AppData = {
  version: CURRENT_VERSION,
  athlete: '',
  phases: [],
  sessions: [],
  templates: [],
  competitions: [],
}

const initialUI: UIState = {
  activePhaseId: null,
  week: 1,
  dayId: null,
  tab: 'log',
  editing: false,
}

// ---- pure nested updaters ----

function withEntry(se: Session, exId: string, fn: (e: Entry) => Entry): Session {
  const current = se.entries[exId] ?? emptyEntry()
  return { ...se, entries: { ...se.entries, [exId]: fn(current) } }
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** True if any persisted data field changed between two states (by reference). */
function dataChanged(a: AppData, b: AppData): boolean {
  return (
    a.version !== b.version ||
    a.athlete !== b.athlete ||
    a.phases !== b.phases ||
    a.sessions !== b.sessions ||
    a.templates !== b.templates ||
    a.competitions !== b.competitions
  )
}

/**
 * Build an Iron Log store bound to a storage adapter. A new instance is fully
 * isolated — handy for tests. The app uses the default `useStore` singleton.
 */
export function makeStore(
  storage: StorageAdapter = localStorageAdapter,
): UseBoundStore<StoreApi<IronLogState>> {
  let timer: ReturnType<typeof setTimeout> | null = null

  const store = create<IronLogState>()((set, get) => {
    const mapSession = (id: string, fn: (s: Session) => Session) =>
      set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? fn(s) : s)) }))

    return {
      ...initialData,
      ...initialUI,

      // ---- lifecycle ----
      hydrate: async () => {
        const raw = await storage.get(STORAGE_KEY)
        get().replaceData(migrate(raw))
      },
      flush: async () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        await storage.set(STORAGE_KEY, extractData(get()))
      },
      replaceData: (data) =>
        set({
          version: data.version,
          athlete: data.athlete,
          phases: data.phases,
          sessions: data.sessions,
          templates: data.templates,
          competitions: data.competitions,
        }),

      // ---- backup ----
      exportJSON: () => exportData(extractData(get())),
      importJSON: (json) => get().replaceData(importData(json)),

      // ---- athlete ----
      setAthlete: (name) => set({ athlete: name }),

      // ---- ui ----
      setTab: (tab) => set({ tab }),
      setWeek: (week) => set({ week }),
      setDay: (dayId) => set({ dayId }),
      setEditing: (editing) => set({ editing }),
      selectPhase: (id) => {
        const phase = id ? get().phases.find((p) => p.id === id) : undefined
        set({ activePhaseId: id, week: 1, dayId: phase?.days[0]?.id ?? null })
      },

      // ---- phases ----
      addPhase: (input) => {
        const id = input.id ?? uid()
        const phase: Phase = {
          id,
          name: input.name,
          weeks: input.weeks ?? 4,
          startDate: input.startDate ?? todayStr(),
          compId: input.compId ?? null,
          copyFrom: input.copyFrom ?? null,
          seed: input.seed ?? false,
          days: input.days && input.days.length > 0 ? input.days : DEFAULT_DAYS.map((d) => ({ ...d })),
        }
        set((state) => ({ phases: [...state.phases, phase] }))
        return id
      },
      updatePhase: (id, patch) =>
        set((state) => {
          const phases = state.phases.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p))
          // If the active phase's days changed and the selected day vanished, fall back.
          let dayId = state.dayId
          if (id === state.activePhaseId) {
            const updated = phases.find((p) => p.id === id)
            if (updated && (dayId === null || !updated.days.some((d) => d.id === dayId))) {
              dayId = updated.days[0]?.id ?? null
            }
          }
          return { phases, dayId }
        }),
      removePhase: (id) =>
        set((state) => {
          const wasActive = state.activePhaseId === id
          return {
            // cascade-delete this phase's sessions
            phases: state.phases.filter((p) => p.id !== id),
            sessions: state.sessions.filter((s) => s.phaseId !== id),
            activePhaseId: wasActive ? null : state.activePhaseId,
            dayId: wasActive ? null : state.dayId,
            week: wasActive ? 1 : state.week,
          }
        }),

      // ---- sessions ----
      startSession: ({ phaseId, dayId, week, date }) => {
        const id = uid()
        const exercises = baseExercisesFor(get(), phaseId, dayId, week)
        const entries: Record<string, Entry> = {}
        for (const ex of exercises) entries[ex.id] = emptyEntry()
        const session: Session = {
          id,
          phaseId,
          week,
          dayId,
          date: date ?? todayStr(),
          exercises,
          entries,
        }
        set((state) => ({ sessions: [...state.sessions, session] }))
        return id
      },
      startLooseSession: () => {
        const id = uid()
        const session: Session = {
          id,
          phaseId: '',
          week: 1,
          dayId: '',
          date: todayStr(),
          exercises: [],
          entries: {},
        }
        set((state) => ({ sessions: [...state.sessions, session] }))
        return id
      },
      createPhaseFromSession: (sessionId, { name, weeks, startDate, dayName }) => {
        const phaseId = uid()
        const dayId = uid()
        const phase: Phase = {
          id: phaseId,
          name,
          weeks,
          startDate,
          compId: null,
          copyFrom: null,
          seed: false,
          days: [{ id: dayId, name: dayName }],
        }
        set((state) => ({
          phases: [...state.phases, phase],
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, phaseId, dayId, week: 1, date: startDate } : s,
          ),
          activePhaseId: phaseId,
          week: 1,
          dayId,
          tab: 'log',
          editing: false,
        }))
        return phaseId
      },
      importSession: ({ phaseId, dayId, week, date, exercises, entries }) => {
        const id = uid()
        const session: Session = { id, phaseId, week, dayId, date, exercises, entries }
        set((state) => ({
          sessions: [
            // replace any existing session at this phase/week/day
            ...state.sessions.filter(
              (s) => !(s.phaseId === phaseId && s.week === week && s.dayId === dayId),
            ),
            session,
          ],
        }))
        return id
      },
      updateSession: (id, patch) => mapSession(id, (s) => ({ ...s, ...patch, id: s.id })),
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      setSessionDate: (id, date) => mapSession(id, (s) => ({ ...s, date })),

      // ---- exercises within a session ----
      addExercise: (sessionId, input) => {
        const ex = newExercise(input)
        mapSession(sessionId, (s) => ({
          ...s,
          exercises: [...s.exercises, ex],
          entries: { ...s.entries, [ex.id]: emptyEntry() },
        }))
        return ex.id
      },
      removeExercise: (sessionId, exId) =>
        mapSession(sessionId, (s) => {
          const entries = { ...s.entries }
          delete entries[exId]
          return { ...s, exercises: s.exercises.filter((e) => e.id !== exId), entries }
        }),
      updateExercise: (sessionId, exId, patch) =>
        mapSession(sessionId, (s) => ({
          ...s,
          exercises: s.exercises.map((e) => (e.id === exId ? { ...e, ...patch, id: e.id } : e)),
        })),
      reorderExercises: (sessionId, from, to) =>
        mapSession(sessionId, (s) => ({ ...s, exercises: move(s.exercises, from, to) })),

      // ---- entries ----
      addSet: (sessionId, exId) =>
        mapSession(sessionId, (s) =>
          withEntry(s, exId, (e) => ({ ...e, sets: [...e.sets, { w: '', r: '' }] })),
        ),
      removeSet: (sessionId, exId, index) =>
        mapSession(sessionId, (s) =>
          withEntry(s, exId, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== index) })),
        ),
      setField: (sessionId, exId, index, field, value) =>
        mapSession(sessionId, (s) =>
          withEntry(s, exId, (e) => ({
            ...e,
            sets: e.sets.map((st, i) => (i === index ? { ...st, [field]: value } : st)),
          })),
        ),
      setNotes: (sessionId, exId, notes) =>
        mapSession(sessionId, (s) => withEntry(s, exId, (e) => ({ ...e, notes }))),
      setDone: (sessionId, exId, done) =>
        mapSession(sessionId, (s) => withEntry(s, exId, (e) => ({ ...e, done }))),
      toggleWarmup: (sessionId, exId) =>
        mapSession(sessionId, (s) => ({
          ...s,
          exercises: s.exercises.map((e) => (e.id === exId ? { ...e, warmup: !e.warmup } : e)),
        })),

      // ---- templates ----
      saveTemplate: (name, exercises) => {
        const id = uid()
        const template: Template = {
          id,
          name,
          createdAt: todayStr(),
          exercises: exercises.map((e) => ({ ...e })),
        }
        set((state) => ({ templates: [...state.templates, template] }))
        return id
      },
      removeTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),

      // ---- competitions ----
      addCompetition: (input) => {
        const id = input.id ?? uid()
        const comp: Competition = { id, name: input.name, date: input.date ?? '' }
        set((state) => ({ competitions: [...state.competitions, comp] }))
        return id
      },
      updateCompetition: (id, patch) =>
        set((state) => ({
          competitions: state.competitions.map((c) =>
            c.id === id ? { ...c, ...patch, id: c.id } : c,
          ),
        })),
      removeCompetition: (id) =>
        set((state) => ({ competitions: state.competitions.filter((c) => c.id !== id) })),
    }
  })

  // Debounced persistence on any data change.
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void storage.set(STORAGE_KEY, extractData(store.getState()))
    }, PERSIST_DELAY)
  }
  store.subscribe((state, prev) => {
    if (dataChanged(state, prev)) schedule()
  })

  return store
}

/** Default app-wide store, persisting to localStorage. */
export const useStore = makeStore()
