import { Plus, Trash2 } from 'lucide-react'
import type { ParsedExercise } from '@/lib/import'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/Button'
import { formatSets } from '@/features/log/format'

export interface ReviewGroup {
  id: string
  name: string
  rows: ParsedExercise[]
}

export interface ReviewListProps {
  groups: ReviewGroup[]
  /** Existing phase day names, offered as suggestions. */
  dayNames: string[]
  onRenameGroup: (groupId: string, name: string) => void
  onEdit: (groupId: string, rowId: string, patch: Partial<ParsedExercise>) => void
  onDelete: (groupId: string, rowId: string) => void
  onAdd: (groupId: string) => void
}

const DATALIST_ID = 'import-day-names'

export function ReviewList({
  groups,
  dayNames,
  onRenameGroup,
  onEdit,
  onDelete,
  onAdd,
}: ReviewListProps) {
  return (
    <div className="flex flex-col gap-5">
      <datalist id={DATALIST_ID}>
        {dayNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {groups.map((group) => {
        const counted = group.rows.filter((r) => r.name.trim() !== '').length
        return (
          <div key={group.id} className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-3">
              <Input
                className="flex-1"
                label="Import to day"
                aria-label="Target day name"
                list={DATALIST_ID}
                placeholder="e.g. Pull and accessories"
                value={group.name}
                onChange={(e) => onRenameGroup(group.id, e.target.value)}
              />
              <span className="pb-2 text-xs text-muted">{counted} to import</span>
            </div>

            {group.rows.map((row) => (
              <Card key={row.id} className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <Input
                    className="flex-1"
                    aria-label="Name"
                    placeholder="Exercise name"
                    value={row.name}
                    onChange={(e) => onEdit(group.id, row.id, { name: e.target.value })}
                  />
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    aria-label="Delete row"
                    onClick={() => onDelete(group.id, row.id)}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    className="w-32"
                    aria-label="Scheme"
                    placeholder="3×5"
                    value={row.scheme}
                    onChange={(e) => onEdit(group.id, row.id, { scheme: e.target.value })}
                  />
                  <Input
                    className="flex-1"
                    aria-label="Cue"
                    placeholder="Cue / comment"
                    value={row.cue}
                    onChange={(e) => onEdit(group.id, row.id, { cue: e.target.value })}
                  />
                </div>
                {row.sets && row.sets.length > 0 && (
                  <span className="text-xs text-faint">
                    Sets parsed: {formatSets({ sets: row.sets, notes: '', done: false })}
                  </span>
                )}
              </Card>
            ))}

            <Button variant="ghost" size="sm" className="self-start" onClick={() => onAdd(group.id)}>
              <Plus size={16} aria-hidden /> Add exercise
            </Button>
          </div>
        )
      })}
    </div>
  )
}
