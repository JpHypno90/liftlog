import { useState } from 'react'
import type { Session } from '@/types'
import { useStore } from '@/store'
import { Modal } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

export interface SaveTemplateModalProps {
  session: Session
  defaultName: string
  onClose: () => void
}

export function SaveTemplateModal({ session, defaultName, onClose }: SaveTemplateModalProps) {
  const saveTemplate = useStore((s) => s.saveTemplate)
  const [name, setName] = useState(defaultName)

  const valid = name.trim().length > 0 && session.exercises.length > 0

  const save = () => {
    if (!valid) return
    // Exercises only — logged sets/weights never carry into a template.
    saveTemplate(name.trim(), session.exercises)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Save as template">
      <div className="flex flex-col gap-3">
        <Input
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Prep · Pull"
          error={name.trim() ? undefined : 'Name is required'}
        />
        <p className="text-sm text-muted">
          Saves {session.exercises.length} exercise{session.exercises.length === 1 ? '' : 's'} (names,
          schemes &amp; cues) — no logged weights.
        </p>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!valid} shine>
          Save template
        </Button>
      </div>
    </Modal>
  )
}
