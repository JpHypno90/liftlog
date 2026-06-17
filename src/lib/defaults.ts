import type { Day, Entry, Exercise } from '@/types'
import { uid } from '@/lib/id'

/** Default training split used to backfill phases missing a `days[]`. */
export const DEFAULT_DAYS: Day[] = [
  { id: 'pull', name: 'Pull' },
  { id: 'push', name: 'Push' },
  { id: 'events', name: 'Events' },
]

/** A fresh empty entry — one blank set, no notes, not done. */
export function emptyEntry(): Entry {
  return { sets: [{ w: '', r: '' }], notes: '', done: false }
}

/** Build a new exercise with sane defaults. */
export function newExercise(input: Partial<Exercise> = {}): Exercise {
  return {
    id: input.id ?? uid(),
    name: input.name ?? 'New exercise',
    scheme: input.scheme ?? '',
    cue: input.cue ?? '',
    warmup: input.warmup ?? false,
  }
}

/** Default seed exercises used when a phase has `seed: true` and nothing to inherit. */
export function seedExercises(): Exercise[] {
  return [
    newExercise({ name: 'Main lift', scheme: '3×3', warmup: true }),
    newExercise({ name: 'Accessory', scheme: '3×8' }),
  ]
}
