import { Trophy } from 'lucide-react'
import { useStore } from '@/store'
import { Chip } from '@/components/Chip'
import { countdownLabel, todayStr } from '@/lib/date'

export function Header() {
  const competitions = useStore((s) => s.competitions)
  const setTab = useStore((s) => s.setTab)

  const today = todayStr()
  const upcoming = competitions
    .filter((c) => c.date && c.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <header className="shrink-0 border-b border-line bg-panel px-4 pb-3 pt-[calc(env(safe-area-inset-top)_+_0.75rem)]">
      <div className="flex items-center justify-between gap-3">
        <span className="aurora font-display text-xl font-bold uppercase tracking-[0.18em]">
          Iron Log
        </span>
        {upcoming && (
          <Chip
            icon={Trophy}
            active
            onClick={() => setTab('comps')}
            aria-label={`Next competition: ${upcoming.name}, ${countdownLabel(upcoming.date)}`}
          >
            {upcoming.name} · {countdownLabel(upcoming.date)}
          </Chip>
        )}
      </div>
    </header>
  )
}
