import type { Phase } from '@/types'
import { useStore } from '@/store'
import { baseExercisesFor, lastLogged } from '@/store/selectors'
import { Card } from '@/components/Card'
import { formatSets } from '@/features/log/format'

export interface WorkoutPreviewProps {
  phase: Phase
  dayId: string
  week: number
}

/** Read-only preview of the exercises a session will start with. */
export function WorkoutPreview({ phase, dayId, week }: WorkoutPreviewProps) {
  const phases = useStore((s) => s.phases)
  const sessions = useStore((s) => s.sessions)
  const slice = { phases, sessions }

  const exercises = baseExercisesFor(slice, phase.id, dayId, week)

  if (exercises.length === 0) {
    return <p className="text-sm text-muted">No template yet — start blank and add exercises.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-faint">Planned</span>
      {exercises.map((ex) => {
        const last = lastLogged(slice, phase.id, dayId, ex.id, week)
        return (
          <Card key={ex.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-base text-text">{ex.name}</span>
              {ex.scheme && <span className="text-sm text-muted">{ex.scheme}</span>}
            </div>
            {ex.cue && <span className="text-sm text-faint">{ex.cue}</span>}
            {last && (
              <span className="text-xs text-faint">
                Last (Wk {last.week}): {formatSets(last.entry) || '—'}
              </span>
            )}
          </Card>
        )
      })}
    </div>
  )
}
