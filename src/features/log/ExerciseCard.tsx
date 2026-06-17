import { Check, Plus, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { Exercise, Session } from '@/types'
import { useStore } from '@/store'
import { lastLogged } from '@/store/selectors'
import { cn } from '@/lib/cn'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/Button'
import { formatSets } from '@/features/log/format'

export interface ExerciseCardProps {
  session: Session
  exercise: Exercise
  editing: boolean
  index: number
  total: number
}

/** Parse a numeric field, preserving blank as "" (never coerce to 0). */
function toNum(value: string): number | '' {
  if (value === '') return ''
  const n = Number(value)
  return Number.isNaN(n) ? '' : n
}

export function ExerciseCard({ session, exercise, editing, index, total }: ExerciseCardProps) {
  const sessions = useStore((s) => s.sessions)
  const addSet = useStore((s) => s.addSet)
  const removeSet = useStore((s) => s.removeSet)
  const setField = useStore((s) => s.setField)
  const setNotes = useStore((s) => s.setNotes)
  const toggleWarmup = useStore((s) => s.toggleWarmup)
  const updateExercise = useStore((s) => s.updateExercise)
  const removeExercise = useStore((s) => s.removeExercise)
  const reorderExercises = useStore((s) => s.reorderExercises)

  const entry = session.entries[exercise.id] ?? { sets: [], notes: '', done: false }
  const last = lastLogged(
    { phases: [], sessions },
    session.phaseId,
    session.dayId,
    exercise.id,
    session.week,
  )

  return (
    <Card className="flex flex-col gap-3">
      {/* Header */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <Input
              className="flex-1"
              aria-label="Exercise name"
              value={exercise.name}
              onChange={(e) => updateExercise(session.id, exercise.id, { name: e.target.value })}
              placeholder="Exercise name"
            />
            <div className="flex flex-col">
              <IconButton
                icon={ChevronUp}
                size="sm"
                variant="ghost"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => reorderExercises(session.id, index, index - 1)}
              />
              <IconButton
                icon={ChevronDown}
                size="sm"
                variant="ghost"
                aria-label="Move down"
                disabled={index === total - 1}
                onClick={() => reorderExercises(session.id, index, index + 1)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              className="w-28"
              aria-label="Scheme"
              value={exercise.scheme}
              onChange={(e) => updateExercise(session.id, exercise.id, { scheme: e.target.value })}
              placeholder="3×5"
            />
            <Input
              className="flex-1"
              aria-label="Cue"
              value={exercise.cue}
              onChange={(e) => updateExercise(session.id, exercise.id, { cue: e.target.value })}
              placeholder="Cue"
            />
          </div>
          <Button
            variant="danger"
            size="sm"
            className="self-start"
            onClick={() => removeExercise(session.id, exercise.id)}
          >
            <Trash2 size={16} aria-hidden /> Remove
          </Button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg text-text">{exercise.name}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
              {exercise.scheme && <span>{exercise.scheme}</span>}
              {exercise.cue && <span className="text-faint">· {exercise.cue}</span>}
            </div>
          </div>
          <WarmupToggle on={exercise.warmup} onToggle={() => toggleWarmup(session.id, exercise.id)} />
        </div>
      )}

      {/* Last logged reference */}
      {last && (
        <div className="text-xs text-faint">
          Last (Wk {last.week}): {formatSets(last.entry) || '—'}
        </div>
      )}

      {/* Progress bars across sets */}
      {entry.sets.length > 0 && (
        <div className="flex gap-1" aria-hidden>
          {entry.sets.map((st, i) => (
            <div
              key={`bar-${i}`}
              className={cn(
                'h-1 flex-1 rounded-full',
                st.w !== '' && st.r !== '' ? 'bg-accent' : 'bg-line',
              )}
            />
          ))}
        </div>
      )}

      {/* Set rows */}
      <div className="flex flex-col gap-2">
        {entry.sets.map((st, i) => (
          <div key={`set-${i}`} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
            <Input
              className="flex-1"
              type="number"
              inputMode="decimal"
              aria-label={`Set ${i + 1} weight`}
              placeholder="kg"
              value={st.w === '' ? '' : st.w}
              onChange={(e) => setField(session.id, exercise.id, i, 'w', toNum(e.target.value))}
            />
            <span className="text-faint">×</span>
            <Input
              className="flex-1"
              type="number"
              inputMode="numeric"
              aria-label={`Set ${i + 1} reps`}
              placeholder="reps"
              value={st.r === '' ? '' : st.r}
              onChange={(e) => setField(session.id, exercise.id, i, 'r', toNum(e.target.value))}
            />
            <IconButton
              icon={X}
              size="sm"
              variant="ghost"
              aria-label={`Remove set ${i + 1}`}
              onClick={() => removeSet(session.id, exercise.id, i)}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => addSet(session.id, exercise.id)}
        >
          <Plus size={16} aria-hidden /> Add set
        </Button>
      </div>

      {/* Notes */}
      <Textarea
        aria-label="Notes"
        rows={2}
        placeholder="Notes…"
        value={entry.notes}
        onChange={(e) => setNotes(session.id, exercise.id, e.target.value)}
      />
    </Card>
  )
}

interface WarmupToggleProps {
  on: boolean
  onToggle: () => void
}

function WarmupToggle({ on, onToggle }: WarmupToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 text-sm transition-colors',
        on ? 'text-accent' : 'text-muted hover:text-text',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border',
          on ? 'border-accent bg-accent-dim' : 'border-line',
        )}
      >
        {on && <Check size={12} aria-hidden />}
      </span>
      Warm-up
    </button>
  )
}
