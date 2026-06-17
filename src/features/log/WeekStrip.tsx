import { Trophy } from 'lucide-react'
import type { Competition, Phase, Session } from '@/types'
import { weekIndex } from '@/lib/date'
import { cn } from '@/lib/cn'

export interface WeekStripProps {
  phase: Phase
  sessions: Session[]
  linkedComp: Competition | null
  currentWeek: number
  selectedWeek: number
  onSelect: (week: number) => void
}

interface WeekChipProps {
  week: number
  selected: boolean
  isCurrent: boolean
  hasSessions: boolean
  isCompWeek: boolean
  onClick: () => void
}

function WeekChip({ week, selected, isCurrent, hasSessions, isCompWeek, onClick }: WeekChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-current={isCurrent ? 'date' : undefined}
      className={cn(
        'relative flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        selected
          ? 'border-accent bg-accent-dim text-accent'
          : isCurrent
            ? 'border-accent text-text'
            : 'border-line text-muted hover:text-text',
      )}
    >
      {isCompWeek && <Trophy size={11} className="absolute right-1 top-1 text-accent" aria-hidden />}
      <span>{week}</span>
      <span
        className={cn(
          'h-1 w-1 rounded-full',
          hasSessions ? 'bg-accent' : 'bg-transparent',
        )}
        aria-hidden
      />
    </button>
  )
}

export function WeekStrip({
  phase,
  sessions,
  linkedComp,
  currentWeek,
  selectedWeek,
  onSelect,
}: WeekStripProps) {
  const compWeek =
    linkedComp && linkedComp.date ? weekIndex(linkedComp.date, phase.startDate) : null
  const weeks = Array.from({ length: phase.weeks }, (_, i) => i + 1)

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2">
        {weeks.map((w) => (
          <WeekChip
            key={w}
            week={w}
            selected={w === selectedWeek}
            isCurrent={w === currentWeek}
            hasSessions={sessions.some((s) => s.phaseId === phase.id && s.week === w)}
            isCompWeek={w === compWeek}
            onClick={() => onSelect(w)}
          />
        ))}
      </div>
    </div>
  )
}
