import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import type { Day } from '@/types'
import { useStore } from '@/store'
import { uid } from '@/lib/id'
import { mondayOf, todayStr } from '@/lib/date'
import { Modal } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Stepper } from '@/components/Stepper'
import { Chip } from '@/components/Chip'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'

const NAME_PRESETS = ['Entry', 'Prep', 'Peak', 'Deload', 'Comp Week']
const MIN_WEEKS = 2
const MAX_WEEKS = 52

interface Draft {
  name: string
  weeks: number
  startDate: string
  compId: string | null
  copyFrom: string | null
  days: Day[]
}

function defaultDays(): Day[] {
  return [1, 2, 3].map((n) => ({ id: uid(), name: `Day ${n}` }))
}

export interface PhaseEditorProps {
  /** Phase id to edit, or undefined to create a new phase. */
  phaseId?: string
  onClose: () => void
}

export function PhaseEditor({ phaseId, onClose }: PhaseEditorProps) {
  const phases = useStore((s) => s.phases)
  const competitions = useStore((s) => s.competitions)
  const sessions = useStore((s) => s.sessions)
  const addPhase = useStore((s) => s.addPhase)
  const updatePhase = useStore((s) => s.updatePhase)
  const removePhase = useStore((s) => s.removePhase)

  const existing = phaseId ? phases.find((p) => p.id === phaseId) : undefined
  const isNew = !existing

  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? {
          name: existing.name,
          weeks: existing.weeks,
          startDate: existing.startDate,
          compId: existing.compId,
          copyFrom: existing.copyFrom,
          days: existing.days.map((d) => ({ ...d })),
        }
      : {
          name: '',
          weeks: 8,
          startDate: mondayOf(todayStr()),
          compId: null,
          copyFrom: null,
          days: defaultDays(),
        },
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const renameDay = (id: string, name: string) =>
    set(
      'days',
      draft.days.map((d) => (d.id === id ? { ...d, name } : d)),
    )
  const addDay = () =>
    set('days', [...draft.days, { id: uid(), name: `Day ${draft.days.length + 1}` }])
  const removeDay = (id: string) =>
    set(
      'days',
      draft.days.filter((d) => d.id !== id),
    )

  const adoptCopyFrom = (srcId: string) => {
    if (!srcId) {
      setDraft((d) => ({ ...d, copyFrom: null, days: defaultDays() }))
      return
    }
    const src = phases.find((p) => p.id === srcId)
    setDraft((d) => ({
      ...d,
      copyFrom: srcId,
      days: src ? src.days.map((day) => ({ id: uid(), name: day.name })) : d.days,
    }))
  }

  const loggedForDay = (dayId: string) =>
    existing ? sessions.filter((s) => s.phaseId === existing.id && s.dayId === dayId).length : 0
  const loggedForPhase = existing
    ? sessions.filter((s) => s.phaseId === existing.id).length
    : 0

  const nameValid = draft.name.trim().length > 0
  const weeksValid = draft.weeks >= MIN_WEEKS && draft.weeks <= MAX_WEEKS
  const daysValid = draft.days.length >= 1 && draft.days.every((d) => d.name.trim().length > 0)
  const canSave = nameValid && weeksValid && daysValid

  const save = () => {
    if (!canSave) return
    const payload = {
      name: draft.name.trim(),
      weeks: draft.weeks,
      startDate: draft.startDate,
      compId: draft.compId,
      days: draft.days.map((d) => ({ ...d, name: d.name.trim() })),
    }
    if (existing) {
      updatePhase(existing.id, payload)
    } else {
      addPhase({ ...payload, copyFrom: draft.copyFrom })
    }
    onClose()
  }

  const doDelete = () => {
    if (existing) removePhase(existing.id)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'New phase' : 'Edit phase'}>
      <div className="flex max-h-[68vh] flex-col gap-5 overflow-y-auto pr-1">
        {/* Name + presets */}
        <div className="flex flex-col gap-2">
          <Input
            label="Name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Prep"
            error={!nameValid ? 'Name is required' : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {NAME_PRESETS.map((p) => (
              <Chip key={p} active={draft.name === p} onClick={() => set('name', p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {/* Weeks + start date */}
        <Stepper
          label="Weeks"
          value={draft.weeks}
          onChange={(v) => set('weeks', v)}
          min={MIN_WEEKS}
          max={MAX_WEEKS}
        />
        <Input
          label="Monday of week 1"
          type="date"
          value={draft.startDate}
          onChange={(e) => set('startDate', e.target.value)}
        />

        {/* Linked competition */}
        <Select
          label="Linked competition"
          value={draft.compId ?? ''}
          onChange={(e) => set('compId', e.target.value || null)}
        >
          <option value="">Not linked</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Copy from (new phases only) */}
        {isNew && (
          <Select
            label="Copy structure from"
            value={draft.copyFrom ?? ''}
            onChange={(e) => adoptCopyFrom(e.target.value)}
          >
            <option value="">Start blank</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}

        {/* Training days */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">Training days</span>
          {draft.days.map((day) => {
            const logged = loggedForDay(day.id)
            const lastOne = draft.days.length <= 1
            const blocked = logged > 0 || lastOne
            const reason =
              logged > 0
                ? `${logged} logged session${logged === 1 ? '' : 's'}`
                : lastOne
                  ? 'At least one day required'
                  : 'Delete day'
            return (
              <div key={day.id} className="flex items-end gap-2">
                <Input
                  className="flex-1"
                  value={day.name}
                  onChange={(e) => renameDay(day.id, e.target.value)}
                  aria-label="Day name"
                />
                <IconButton
                  icon={Trash2}
                  variant="danger"
                  aria-label={`Delete day (${reason})`}
                  title={reason}
                  disabled={blocked}
                  onClick={() => removeDay(day.id)}
                />
              </div>
            )
          })}
          <Button variant="ghost" size="sm" onClick={addDay} className="self-start">
            <Plus size={16} aria-hidden /> Add day
          </Button>
        </div>

        {/* Delete (existing only) */}
        {existing && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-text">
                  Delete {existing.name} and its {loggedForPhase} logged session
                  {loggedForPhase === 1 ? '' : 's'}? This can&apos;t be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={doDelete}>
                    Delete phase
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} aria-hidden /> Delete phase
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!canSave} shine>
          {isNew ? 'Create phase' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
