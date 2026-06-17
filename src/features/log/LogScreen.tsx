import { Dumbbell } from 'lucide-react'
import { useStore } from '@/store'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'

export function LogScreen() {
  const activePhaseId = useStore((s) => s.activePhaseId)
  const phases = useStore((s) => s.phases)
  const setTab = useStore((s) => s.setTab)

  const active = phases.find((p) => p.id === activePhaseId)

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-text">Log</h1>
      {active ? (
        <p className="text-sm text-muted">
          {active.name} — session logging arrives in Phase 5.
        </p>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title="No training phase yet"
          text="Create a training phase to start logging sessions."
          action={<Button onClick={() => setTab('phases')}>Go to Phases</Button>}
        />
      )}
    </section>
  )
}
