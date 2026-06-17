import { Trophy, Plus, Trash2 } from 'lucide-react'
import type { Competition } from '@/types'
import { useStore } from '@/store'
import { countdownLabel } from '@/lib/date'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { EmptyState } from '@/components/EmptyState'

interface CompCardProps {
  comp: Competition
  linkedPhases: string[]
  onName: (name: string) => void
  onDate: (date: string) => void
  onDelete: () => void
}

function CompCard({ comp, linkedPhases, onName, onDate, onDelete }: CompCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          className="flex-1"
          label="Name"
          value={comp.name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Competition name"
        />
        <IconButton icon={Trash2} variant="danger" aria-label="Delete competition" onClick={onDelete} />
      </div>
      <Input label="Date" type="date" value={comp.date} onChange={(e) => onDate(e.target.value)} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>{comp.date ? countdownLabel(comp.date) : 'No date set'}</span>
        <span>{linkedPhases.length > 0 ? `Linked: ${linkedPhases.join(', ')}` : 'No linked phases'}</span>
      </div>
    </Card>
  )
}

export function CompsScreen() {
  const competitions = useStore((s) => s.competitions)
  const phases = useStore((s) => s.phases)
  const addCompetition = useStore((s) => s.addCompetition)
  const updateCompetition = useStore((s) => s.updateCompetition)
  const removeCompetition = useStore((s) => s.removeCompetition)

  const sorted = [...competitions].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-text">Competitions</h1>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No competitions yet."
          text="Add a meet to track the countdown and link it to a phase."
          action={<Button onClick={() => addCompetition({ name: '' })}>Add competition</Button>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {sorted.map((c) => (
              <CompCard
                key={c.id}
                comp={c}
                linkedPhases={phases.filter((p) => p.compId === c.id).map((p) => p.name)}
                onName={(name) => updateCompetition(c.id, { name })}
                onDate={(date) => updateCompetition(c.id, { date })}
                onDelete={() => removeCompetition(c.id)}
              />
            ))}
          </div>
          <Button variant="ghost" onClick={() => addCompetition({ name: '' })} className="self-start">
            <Plus size={16} aria-hidden /> Add competition
          </Button>
        </>
      )}
    </section>
  )
}
