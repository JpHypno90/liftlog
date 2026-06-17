import { useState } from 'react'
import { useStore } from '@/store'
import { mondayOf, todayStr } from '@/lib/date'
import { Modal } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Stepper } from '@/components/Stepper'
import { Chip } from '@/components/Chip'
import { Button } from '@/components/Button'

const NAME_PRESETS = ['Entry', 'Prep', 'Peak', 'Deload', 'Comp Week']
const MIN_WEEKS = 2
const MAX_WEEKS = 52

export interface CreatePhaseModalProps {
  /** The logged session to turn into Week 1 of the new phase. */
  sessionId: string
  onClose: () => void
}

export function CreatePhaseModal({ sessionId, onClose }: CreatePhaseModalProps) {
  const createPhaseFromSession = useStore((s) => s.createPhaseFromSession)

  const [name, setName] = useState('')
  const [weeks, setWeeks] = useState(8)
  const [startDate, setStartDate] = useState(mondayOf(todayStr()))
  const [dayName, setDayName] = useState('Day 1')

  const valid = name.trim().length > 0 && dayName.trim().length > 0

  const create = () => {
    if (!valid) return
    createPhaseFromSession(sessionId, {
      name: name.trim(),
      weeks,
      startDate,
      dayName: dayName.trim(),
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Create phase from session">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted">
          This session becomes Week 1 of the new phase, on the day you name below.
        </p>

        <div className="flex flex-col gap-2">
          <Input
            label="Phase name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Prep"
            error={name.trim() ? undefined : 'Name is required'}
          />
          <div className="flex flex-wrap gap-2">
            {NAME_PRESETS.map((p) => (
              <Chip key={p} active={name === p} onClick={() => setName(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        <Stepper label="Weeks" value={weeks} onChange={setWeeks} min={MIN_WEEKS} max={MAX_WEEKS} />
        <Input
          label="Monday of week 1"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Day name"
          value={dayName}
          onChange={(e) => setDayName(e.target.value)}
          placeholder="e.g. Pull and accessories"
        />
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={create} disabled={!valid} shine>
          Create phase
        </Button>
      </div>
    </Modal>
  )
}
