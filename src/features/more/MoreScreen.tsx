import { Library, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { Card } from '@/components/Card'
import { IconButton } from '@/components/IconButton'
import { EmptyState } from '@/components/EmptyState'

export function MoreScreen() {
  const templates = useStore((s) => s.templates)
  const removeTemplate = useStore((s) => s.removeTemplate)

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-text">More</h1>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-text">Library</h2>
        {templates.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No templates yet."
            text="Save a session as a template (in a session's edit mode) to reuse it via Import."
          />
        ) : (
          <>
            {templates.map((t) => (
              <Card key={t.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-base text-text">{t.name}</div>
                  <div className="text-sm text-muted">
                    {t.exercises.length} exercise{t.exercises.length === 1 ? '' : 's'} · {t.createdAt}
                  </div>
                </div>
                <IconButton
                  icon={Trash2}
                  variant="ghost"
                  aria-label={`Delete ${t.name}`}
                  onClick={() => removeTemplate(t.id)}
                />
              </Card>
            ))}
            <p className="text-xs text-faint">Apply a template from Import → Saved.</p>
          </>
        )}
      </div>

      <Card>
        <h2 className="font-display text-lg text-text">Settings</h2>
        <p className="mt-1 text-sm text-muted">Athlete, backup &amp; restore — coming soon.</p>
      </Card>
    </section>
  )
}
