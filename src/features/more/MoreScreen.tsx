import { Card } from '@/components/Card'

export function MoreScreen() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-text">More</h1>

      <Card>
        <h2 className="font-display text-lg text-text">Library</h2>
        <p className="mt-1 text-sm text-muted">Saved workout templates — arrives in Phase 7.</p>
      </Card>

      <Card>
        <h2 className="font-display text-lg text-text">Settings</h2>
        <p className="mt-1 text-sm text-muted">Athlete, backup &amp; restore — coming soon.</p>
      </Card>
    </section>
  )
}
