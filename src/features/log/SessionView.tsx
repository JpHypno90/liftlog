import { useState } from 'react'
import { Pencil, Check, Plus, Trash2, Save } from 'lucide-react'
import type { Phase, Session } from '@/types'
import { useStore } from '@/store'
import { formatDate } from '@/lib/date'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { ExerciseCard } from '@/features/log/ExerciseCard'

export interface SessionViewProps {
  session: Session
  /** Optional — loose (phaseless) sessions have no phase. */
  phase?: Phase
}

export function SessionView({ session }: SessionViewProps) {
  const editing = useStore((s) => s.editing)
  const setEditing = useStore((s) => s.setEditing)
  const addExercise = useStore((s) => s.addExercise)
  const removeSession = useStore((s) => s.removeSession)
  const setSessionDate = useStore((s) => s.setSessionDate)

  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {/* Session toolbar */}
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <Input
            type="date"
            aria-label="Session date"
            value={session.date}
            onChange={(e) => setSessionDate(session.id, e.target.value)}
          />
        ) : (
          <span className="text-sm text-muted">{formatDate(session.date)}</span>
        )}
        <Button variant={editing ? 'solid' : 'ghost'} size="sm" onClick={() => setEditing(!editing)}>
          {editing ? (
            <>
              <Check size={16} aria-hidden /> Done
            </>
          ) : (
            <>
              <Pencil size={16} aria-hidden /> Edit
            </>
          )}
        </Button>
      </div>

      {/* Exercises */}
      {session.exercises.length === 0 && !editing ? (
        <p className="py-6 text-center text-sm text-muted">
          No exercises yet — tap Edit to add some.
        </p>
      ) : (
        session.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id}
            session={session}
            exercise={ex}
            editing={editing}
            index={i}
            total={session.exercises.length}
          />
        ))
      )}

      {/* Edit-mode actions */}
      {editing && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <Button variant="ghost" onClick={() => addExercise(session.id)} className="self-start">
            <Plus size={16} aria-hidden /> Add exercise
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => {
              /* Save as template arrives in Phase 7 */
            }}
          >
            <Save size={16} aria-hidden /> Save as template
          </Button>

          {confirmDelete ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text">Delete this session? This can&apos;t be undone.</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    removeSession(session.id)
                    setEditing(false)
                  }}
                >
                  Delete session
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              className="self-start"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} aria-hidden /> Delete session
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
