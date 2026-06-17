import { Plus, Trash2 } from 'lucide-react'
import type { Day } from '@/types'
import type { ParsedExercise } from '@/lib/import'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/Button'
import { formatSets } from '@/features/log/format'

export interface ReviewListProps {
  days: Day[]
  draft: Record<string, ParsedExercise[]>
  onEdit: (dayId: string, rowId: string, patch: Partial<ParsedExercise>) => void
  onDelete: (dayId: string, rowId: string) => void
  onAdd: (dayId: string) => void
}

function dayName(days: Day[], dayId: string): string {
  return days.find((d) => d.id === dayId)?.name ?? 'Day'
}

export function ReviewList({ days, draft, onEdit, onDelete, onAdd }: ReviewListProps) {
  const dayIds = Object.keys(draft)

  return (
    <div className="flex flex-col gap-5">
      {dayIds.map((dayId) => {
        const rows = draft[dayId]
        const counted = rows.filter((r) => r.name.trim() !== '').length
        return (
          <div key={dayId} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-sm uppercase tracking-[0.2em] text-faint">
                {dayName(days, dayId)}
              </span>
              <span className="text-xs text-muted">{counted} to import</span>
            </div>

            {rows.map((row) => (
              <Card key={row.id} className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <Input
                    className="flex-1"
                    aria-label="Name"
                    placeholder="Exercise name"
                    value={row.name}
                    onChange={(e) => onEdit(dayId, row.id, { name: e.target.value })}
                  />
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    aria-label="Delete row"
                    onClick={() => onDelete(dayId, row.id)}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    className="w-32"
                    aria-label="Scheme"
                    placeholder="3×5"
                    value={row.scheme}
                    onChange={(e) => onEdit(dayId, row.id, { scheme: e.target.value })}
                  />
                  <Input
                    className="flex-1"
                    aria-label="Cue"
                    placeholder="Cue / comment"
                    value={row.cue}
                    onChange={(e) => onEdit(dayId, row.id, { cue: e.target.value })}
                  />
                </div>
                {row.sets && row.sets.length > 0 && (
                  <span className="text-xs text-faint">
                    Sets parsed: {formatSets({ sets: row.sets, notes: '', done: false })}
                  </span>
                )}
              </Card>
            ))}

            <Button variant="ghost" size="sm" className="self-start" onClick={() => onAdd(dayId)}>
              <Plus size={16} aria-hidden /> Add exercise
            </Button>
          </div>
        )
      })}
    </div>
  )
}
