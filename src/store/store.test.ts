import { describe, it, expect, vi } from 'vitest'
import { makeStore, extractData } from '@/store'
import { CURRENT_VERSION } from '@/lib/migrations'
import { STORAGE_KEY, type StorageAdapter } from '@/lib/storage'

/** In-memory storage adapter for tests; serialises like the real one. */
function memoryAdapter(seed?: Record<string, unknown>) {
  const m = new Map<string, unknown>()
  if (seed) for (const [k, v] of Object.entries(seed)) m.set(k, v)
  const adapter: StorageAdapter = {
    async get<T = unknown>(key: string): Promise<T | null> {
      return m.has(key) ? (JSON.parse(JSON.stringify(m.get(key))) as T) : null
    },
    async set(key, value) {
      m.set(key, JSON.parse(JSON.stringify(value)))
    },
    async delete(key) {
      m.delete(key)
    },
    async list() {
      return [...m.keys()]
    },
  }
  return { adapter, peek: (k: string) => m.get(k) }
}

describe('phases', () => {
  it('addPhase fills defaults and backfills days', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'Block A' })
    const phase = store.getState().phases.find((p) => p.id === id)!
    expect(phase.weeks).toBe(4)
    expect(phase.compId).toBeNull()
    expect(phase.days.map((d) => d.name)).toEqual(['Pull', 'Push', 'Events'])
  })

  it('updatePhase merges but never changes the id', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'A' })
    store.getState().updatePhase(id, { name: 'B', weeks: 12 })
    const p = store.getState().phases[0]
    expect(p.id).toBe(id)
    expect(p.name).toBe('B')
    expect(p.weeks).toBe(12)
  })

  it('removePhase cascade-deletes its sessions only', () => {
    const store = makeStore(memoryAdapter().adapter)
    const p1 = store.getState().addPhase({ name: 'One' })
    const p2 = store.getState().addPhase({ name: 'Two' })
    store.getState().startSession({ phaseId: p1, dayId: 'pull', week: 1 })
    store.getState().startSession({ phaseId: p1, dayId: 'push', week: 1 })
    const keep = store.getState().startSession({ phaseId: p2, dayId: 'pull', week: 1 })

    store.getState().removePhase(p1)

    expect(store.getState().phases.map((p) => p.id)).toEqual([p2])
    expect(store.getState().sessions.map((s) => s.id)).toEqual([keep])
  })
})

describe('phase management (Phase 4)', () => {
  it('creates a phase with custom-named days', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({
      name: 'Prep',
      weeks: 10,
      days: [
        { id: 'd1', name: 'Squat' },
        { id: 'd2', name: 'Bench' },
      ],
    })
    const p = store.getState().phases.find((x) => x.id === id)!
    expect(p.weeks).toBe(10)
    expect(p.days.map((d) => d.name)).toEqual(['Squat', 'Bench'])
  })

  it('edits name, weeks, and day structure', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'A' })
    store.getState().updatePhase(id, {
      name: 'Peak',
      weeks: 3,
      days: [{ id: 'only', name: 'Full body' }],
    })
    const p = store.getState().phases.find((x) => x.id === id)!
    expect(p.name).toBe('Peak')
    expect(p.weeks).toBe(3)
    expect(p.days).toEqual([{ id: 'only', name: 'Full body' }])
  })

  it('falls back the selected day when the active phase loses it', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({
      name: 'P',
      days: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    })
    store.getState().selectPhase(id)
    store.getState().setDay('b')
    expect(store.getState().dayId).toBe('b')

    // remove day 'b' from the active phase
    store.getState().updatePhase(id, { days: [{ id: 'a', name: 'A' }] })
    expect(store.getState().dayId).toBe('a')
  })

  it('delete cascades sessions and clears selection when active', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'P' })
    store.getState().startSession({ phaseId: id, dayId: 'pull', week: 1 })
    store.getState().startSession({ phaseId: id, dayId: 'push', week: 1 })
    store.getState().selectPhase(id)
    expect(store.getState().sessions).toHaveLength(2)

    store.getState().removePhase(id)
    expect(store.getState().phases).toHaveLength(0)
    expect(store.getState().sessions).toHaveLength(0)
    expect(store.getState().activePhaseId).toBeNull()
    expect(store.getState().dayId).toBeNull()
    expect(store.getState().week).toBe(1)
  })
})

describe('session start inheritance', () => {
  it('blank when nothing to inherit', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'P', seed: false })
    const sid = store.getState().startSession({ phaseId: id, dayId: 'pull', week: 1 })
    const s = store.getState().sessions.find((x) => x.id === sid)!
    expect(s.exercises).toHaveLength(0)
  })

  it('uses the seed list when seed is true', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'P', seed: true })
    const sid = store.getState().startSession({ phaseId: id, dayId: 'pull', week: 1 })
    const s = store.getState().sessions.find((x) => x.id === sid)!
    expect(s.exercises.map((e) => e.name)).toEqual(['Main lift', 'Accessory'])
    // every exercise gets an initialised entry
    for (const ex of s.exercises) expect(s.entries[ex.id]).toBeDefined()
  })

  it('inherits from the latest session in the phase, preserving exercise ids', () => {
    const store = makeStore(memoryAdapter().adapter)
    const id = store.getState().addPhase({ name: 'P', seed: true })
    const wk1 = store.getState().startSession({ phaseId: id, dayId: 'pull', week: 1 })
    const wk1ids = store.getState().sessions.find((s) => s.id === wk1)!.exercises.map((e) => e.id)

    const wk2 = store.getState().startSession({ phaseId: id, dayId: 'pull', week: 2 })
    const wk2ids = store.getState().sessions.find((s) => s.id === wk2)!.exercises.map((e) => e.id)

    expect(wk2ids).toEqual(wk1ids) // copied from week 1, not re-seeded
  })

  it('falls back to copyFrom when no prior session exists', () => {
    const store = makeStore(memoryAdapter().adapter)
    const src = store.getState().addPhase({
      name: 'Source',
      seed: false,
      days: [{ id: 'src-pull', name: 'Pull' }],
    })
    store.getState().startSession({ phaseId: src, dayId: 'src-pull', week: 1 })
    const srcSid = store.getState().sessions[0].id
    store.getState().addExercise(srcSid, { name: 'Snatch grip DL', scheme: '3×5' })

    const dst = store.getState().addPhase({
      name: 'Dest',
      seed: false,
      copyFrom: src,
      days: [{ id: 'dst-pull', name: 'Pull' }],
    })
    const dSid = store.getState().startSession({ phaseId: dst, dayId: 'dst-pull', week: 1 })
    const names = store.getState().sessions.find((s) => s.id === dSid)!.exercises.map((e) => e.name)
    expect(names).toEqual(['Snatch grip DL'])
  })

  it('prefers latest-in-phase over copyFrom', () => {
    const store = makeStore(memoryAdapter().adapter)
    const src = store.getState().addPhase({
      name: 'Source',
      seed: false,
      days: [{ id: 'src-pull', name: 'Pull' }],
    })
    const srcSid = store.getState().startSession({ phaseId: src, dayId: 'src-pull', week: 1 })
    store.getState().addExercise(srcSid, { name: 'FROM-SOURCE' })

    const dst = store.getState().addPhase({
      name: 'Dest',
      seed: false,
      copyFrom: src,
      days: [{ id: 'dst-pull', name: 'Pull' }],
    })
    const w1 = store.getState().startSession({ phaseId: dst, dayId: 'dst-pull', week: 1 })
    store.getState().addExercise(w1, { name: 'FROM-DEST-WK1' })

    const w2 = store.getState().startSession({ phaseId: dst, dayId: 'dst-pull', week: 2 })
    const names = store.getState().sessions.find((s) => s.id === w2)!.exercises.map((e) => e.name)
    // Week 2 copies the full week-1 list (latest-in-phase). The presence of
    // FROM-DEST-WK1 — which copyFrom alone would NOT supply — proves precedence.
    expect(names).toContain('FROM-DEST-WK1')
    expect(names).toEqual(['FROM-SOURCE', 'FROM-DEST-WK1'])
  })
})

describe('exercises within a session', () => {
  function setup() {
    const store = makeStore(memoryAdapter().adapter)
    const pid = store.getState().addPhase({ name: 'P', seed: false })
    const sid = store.getState().startSession({ phaseId: pid, dayId: 'pull', week: 1 })
    return { store, sid }
  }

  it('add / update / remove with entry bookkeeping', () => {
    const { store, sid } = setup()
    const ex = store.getState().addExercise(sid, { name: 'Press' })
    let s = store.getState().sessions.find((x) => x.id === sid)!
    expect(s.exercises[0].name).toBe('Press')
    expect(s.entries[ex]).toBeDefined()

    store.getState().updateExercise(sid, ex, { scheme: '5×5' })
    s = store.getState().sessions.find((x) => x.id === sid)!
    expect(s.exercises[0].scheme).toBe('5×5')

    store.getState().removeExercise(sid, ex)
    s = store.getState().sessions.find((x) => x.id === sid)!
    expect(s.exercises).toHaveLength(0)
    expect(s.entries[ex]).toBeUndefined()
  })

  it('reorders exercises', () => {
    const { store, sid } = setup()
    const a = store.getState().addExercise(sid, { name: 'A' })
    const b = store.getState().addExercise(sid, { name: 'B' })
    const c = store.getState().addExercise(sid, { name: 'C' })
    store.getState().reorderExercises(sid, 0, 2)
    const order = store.getState().sessions.find((x) => x.id === sid)!.exercises.map((e) => e.id)
    expect(order).toEqual([b, c, a])
  })
})

describe('entries', () => {
  function setup() {
    const store = makeStore(memoryAdapter().adapter)
    const pid = store.getState().addPhase({ name: 'P', seed: false })
    const sid = store.getState().startSession({ phaseId: pid, dayId: 'pull', week: 1 })
    const ex = store.getState().addExercise(sid, { name: 'Squat' })
    return { store, sid, ex }
  }

  it('addSet / setField / removeSet', () => {
    const { store, sid, ex } = setup()
    store.getState().addSet(sid, ex) // now 2 sets
    store.getState().setField(sid, ex, 0, 'w', 100)
    store.getState().setField(sid, ex, 0, 'r', 5)
    let entry = store.getState().sessions.find((s) => s.id === sid)!.entries[ex]
    expect(entry.sets).toHaveLength(2)
    expect(entry.sets[0]).toEqual({ w: 100, r: 5 })

    store.getState().removeSet(sid, ex, 0)
    entry = store.getState().sessions.find((s) => s.id === sid)!.entries[ex]
    expect(entry.sets).toHaveLength(1)
  })

  it('setNotes / setDone / toggleWarmup', () => {
    const { store, sid, ex } = setup()
    store.getState().setNotes(sid, ex, 'tough')
    store.getState().setDone(sid, ex, true)
    store.getState().toggleWarmup(sid, ex)
    const s = store.getState().sessions.find((x) => x.id === sid)!
    expect(s.entries[ex].notes).toBe('tough')
    expect(s.entries[ex].done).toBe(true)
    expect(s.exercises.find((e) => e.id === ex)!.warmup).toBe(true)
  })

  it('blank weight/reps are allowed', () => {
    const { store, sid, ex } = setup()
    store.getState().setField(sid, ex, 0, 'w', '')
    const entry = store.getState().sessions.find((s) => s.id === sid)!.entries[ex]
    expect(entry.sets[0].w).toBe('')
  })
})

describe('templates / competitions / athlete / date', () => {
  it('saves and removes templates', () => {
    const store = makeStore(memoryAdapter().adapter)
    const tid = store.getState().saveTemplate('Pull', [
      { id: 'e', name: 'Row', scheme: '4×8', cue: '', warmup: false },
    ])
    expect(store.getState().templates).toHaveLength(1)
    store.getState().removeTemplate(tid)
    expect(store.getState().templates).toHaveLength(0)
  })

  it('CRUD competitions', () => {
    const store = makeStore(memoryAdapter().adapter)
    const cid = store.getState().addCompetition({ name: 'Nationals', date: '2026-09-01' })
    store.getState().updateCompetition(cid, { date: '2026-09-08' })
    expect(store.getState().competitions[0].date).toBe('2026-09-08')
    store.getState().removeCompetition(cid)
    expect(store.getState().competitions).toHaveLength(0)
  })

  it('sets athlete and session date', () => {
    const store = makeStore(memoryAdapter().adapter)
    store.getState().setAthlete('Jp')
    expect(store.getState().athlete).toBe('Jp')
    const pid = store.getState().addPhase({ name: 'P' })
    const sid = store.getState().startSession({ phaseId: pid, dayId: 'pull', week: 1 })
    store.getState().setSessionDate(sid, '2026-02-02')
    expect(store.getState().sessions.find((s) => s.id === sid)!.date).toBe('2026-02-02')
  })
})

describe('persistence', () => {
  it('flush writes the dataset immediately', async () => {
    const mem = memoryAdapter()
    const store = makeStore(mem.adapter)
    store.getState().addPhase({ name: 'Persist me' })
    await store.getState().flush()
    const saved = mem.peek(STORAGE_KEY) as { phases: { name: string }[] }
    expect(saved.phases[0].name).toBe('Persist me')
  })

  it('debounced persist fires after the delay', () => {
    vi.useFakeTimers()
    try {
      const mem = memoryAdapter()
      const store = makeStore(mem.adapter)
      store.getState().addPhase({ name: 'Debounced' })
      expect(mem.peek(STORAGE_KEY)).toBeUndefined()
      vi.advanceTimersByTime(400)
      const saved = mem.peek(STORAGE_KEY) as { phases: { name: string }[] }
      expect(saved.phases[0].name).toBe('Debounced')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not persist on UI-only changes', () => {
    vi.useFakeTimers()
    try {
      const mem = memoryAdapter()
      const store = makeStore(mem.adapter)
      store.getState().setTab('phases')
      store.getState().setWeek(3)
      vi.advanceTimersByTime(400)
      expect(mem.peek(STORAGE_KEY)).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('hydrate & backup round-trip through the store', () => {
  it('hydrate reads, migrates a v1 shape, and loads it', async () => {
    const mem = memoryAdapter({
      [STORAGE_KEY]: {
        version: 1,
        comp: { id: 'c1', name: 'Worlds', date: '2026-10-01' },
        phases: [{ id: 'p1', name: 'Legacy block', weeks: 8, startDate: '2026-01-01' }],
      },
    })
    const store = makeStore(mem.adapter)
    await store.getState().hydrate()
    expect(store.getState().version).toBe(CURRENT_VERSION)
    expect(store.getState().competitions[0].name).toBe('Worlds')
    expect(store.getState().phases[0].days.map((d) => d.name)).toEqual(['Pull', 'Push', 'Events'])
  })

  it('export → wipe → import restores identical data', async () => {
    const store = makeStore(memoryAdapter().adapter)
    const pid = store.getState().addPhase({ name: 'Block', seed: true })
    const sid = store.getState().startSession({ phaseId: pid, dayId: 'pull', week: 1 })
    const ex = store.getState().sessions.find((s) => s.id === sid)!.exercises[0].id
    store.getState().setField(sid, ex, 0, 'w', 150)
    store.getState().setField(sid, ex, 0, 'r', 5)

    const before = extractData(store.getState())
    const json = store.getState().exportJSON()

    // wipe
    store.getState().importJSON('not valid json')
    expect(store.getState().phases).toHaveLength(0)

    // restore
    store.getState().importJSON(json)
    expect(extractData(store.getState())).toEqual(before)
  })
})
