import { Check } from 'lucide-react'
import type { Day, Phase, Session } from '@/types'
import { cn } from '@/lib/cn'

export interface DayTabsProps {
  phase: Phase
  sessions: Session[]
  week: number
  selectedDayId: string
  onSelect: (dayId: string) => void
}

interface DayTabProps {
  day: Day
  selected: boolean
  hasSession: boolean
  onClick: () => void
}

function DayTab({ day, selected, hasSession, onClick }: DayTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        selected
          ? 'border-accent bg-accent-dim text-accent'
          : 'border-line text-muted hover:text-text',
      )}
    >
      {hasSession && <Check size={14} aria-hidden />}
      <span className="whitespace-nowrap">{day.name}</span>
    </button>
  )
}

export function DayTabs({ phase, sessions, week, selectedDayId, onSelect }: DayTabsProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2">
        {phase.days.map((day) => (
          <DayTab
            key={day.id}
            day={day}
            selected={day.id === selectedDayId}
            hasSession={sessions.some(
              (s) => s.phaseId === phase.id && s.week === week && s.dayId === day.id,
            )}
            onClick={() => onSelect(day.id)}
          />
        ))}
      </div>
    </div>
  )
}
