import { Trophy } from 'lucide-react'
import { useStore } from '@/store'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'

export function CompsScreen() {
  const competitions = useStore((s) => s.competitions)

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-text">Competitions</h1>
      {competitions.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No competitions yet."
          text="Upcoming meets you add will show here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {competitions.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3">
              <span className="font-display text-lg text-text">{c.name}</span>
              <span className="text-sm text-muted">{c.date || '—'}</span>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
