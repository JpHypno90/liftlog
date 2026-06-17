import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dumbbell, Plus, Trash2, Calendar, Search, Settings } from 'lucide-react'
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Stepper,
  Chip,
  Card,
  Modal,
  EmptyState,
} from '@/components'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-faint">{title}</h2>
      <Card className="flex flex-wrap items-start gap-4">{children}</Card>
    </section>
  )
}

/** Visual acceptance test — renders every primitive in every state. */
export default function Gallery() {
  const [weeks, setWeeks] = useState(8)
  const [sets, setSets] = useState(3)
  const [activeChip, setActiveChip] = useState('wk2')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="dotgrid min-h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <Dumbbell className="h-12 w-12 text-accent" strokeWidth={1.5} aria-hidden />
          <h1 className="aurora font-display text-5xl font-bold uppercase tracking-[0.15em]">
            Iron Log
          </h1>
          <p className="text-sm uppercase tracking-[0.3em] text-muted">Design system · Phase 1</p>
        </header>

        <Section title="Button">
          <Button variant="solid">Solid</Button>
          <Button variant="solid" shine>
            Solid + shine
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="solid" size="sm">
            Small
          </Button>
          <Button variant="solid" disabled>
            Disabled
          </Button>
          <Button variant="solid" loading>
            Loading
          </Button>
        </Section>

        <Section title="IconButton">
          <IconButton icon={Plus} aria-label="Add" variant="solid" />
          <IconButton icon={Settings} aria-label="Settings" variant="ghost" />
          <IconButton icon={Trash2} aria-label="Delete" variant="danger" />
          <IconButton icon={Plus} aria-label="Add small" variant="solid" size="sm" />
          <IconButton icon={Settings} aria-label="Disabled" variant="ghost" disabled />
        </Section>

        <Section title="Input · Textarea · Select">
          <div className="flex w-full flex-col gap-4 sm:max-w-xs">
            <Input label="Exercise name" placeholder="e.g. Log press" />
            <Input label="With error" defaultValue="-5" error="Must be positive" />
            <Textarea label="Notes" placeholder="Cues, RPE, how it felt…" />
            <Select label="Unit" defaultValue="kg">
              <option value="kg">Kilograms</option>
              <option value="lb">Pounds</option>
            </Select>
          </div>
        </Section>

        <Section title="Stepper">
          <Stepper label="Weeks" value={weeks} onChange={setWeeks} min={2} max={52} />
          <Stepper label="Sets" value={sets} onChange={setSets} min={1} max={10} />
        </Section>

        <Section title="Chip">
          {[
            { id: 'wk1', label: 'Wk 1' },
            { id: 'wk2', label: 'Wk 2' },
            { id: 'wk3', label: 'Wk 3' },
          ].map((c) => (
            <Chip key={c.id} active={activeChip === c.id} onClick={() => setActiveChip(c.id)}>
              {c.label}
            </Chip>
          ))}
          <Chip icon={Calendar}>With icon</Chip>
          <Chip icon={Calendar} active>
            Active + icon
          </Chip>
        </Section>

        <Section title="Card">
          <Card className="flex-1">
            <h3 className="font-display text-lg text-text">Surface</h3>
            <p className="mt-1 text-sm text-muted">
              Base container — card background, hairline border, soft elevation.
            </p>
          </Card>
        </Section>

        <Section title="Modal">
          <Button onClick={() => setModalOpen(true)}>Open bottom sheet</Button>
        </Section>

        <Section title="EmptyState">
          <EmptyState
            className="w-full"
            icon={Search}
            title="No sessions yet"
            text="Start a session to see it logged here."
            action={
              <Button size="sm" shine>
                New session
              </Button>
            }
          />
        </Section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Bottom sheet">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Backdrop blur, slide-up, focus trap. Closes on backdrop click, the X, or Esc.
          </p>
          <Input label="Demo field" placeholder="Tab cycles within the sheet" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
