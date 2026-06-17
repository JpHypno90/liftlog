import { Layers } from 'lucide-react'
import { useStore } from '@/store'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'

export function PhasesScreen() {
  const phases = useStore((s) => s.phases)

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-text">Phases</h1>
      {phases.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No phases yet."
          text="Training blocks you create will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {phases.map((p) => (
            <Card key={p.id}>
              <div className="font-display text-lg text-text">{p.name}</div>
              <div className="mt-1 text-sm text-muted">
                {p.weeks} weeks · {p.days.length} days
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
