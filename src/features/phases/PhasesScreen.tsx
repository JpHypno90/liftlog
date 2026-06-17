import { useState } from 'react'
import { Layers, Plus, Pencil, Download } from 'lucide-react'
import type { Phase } from '@/types'
import { useStore } from '@/store'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { PhaseEditor } from '@/features/phases/PhaseEditor'
import { ImportModal } from '@/features/import/ImportModal'

interface PhaseCardProps {
  phase: Phase
  active: boolean
  sessionCount: number
  compName: string | null
  onSelect: () => void
  onEdit: () => void
  onImport: () => void
}

function PhaseCard({
  phase,
  active,
  sessionCount,
  compName,
  onSelect,
  onEdit,
  onImport,
}: PhaseCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className="cursor-pointer transition-colors hover:border-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-lg text-text">{phase.name}</h2>
            {active && (
              <span className="shrink-0 rounded-md bg-accent-dim px-2 py-0.5 text-xs font-medium text-accent">
                Active
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted">
            {phase.weeks} weeks · {phase.startDate}
          </div>
          <div className="mt-0.5 text-sm text-muted">
            {sessionCount} session{sessionCount === 1 ? '' : 's'}
            {compName ? ` · ${compName}` : ''}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onImport()
          }}
        >
          <Download size={16} aria-hidden /> Import
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Pencil size={16} aria-hidden /> Edit
        </Button>
      </div>
    </Card>
  )
}

type EditorState = { open: false } | { open: true; phaseId?: string }

export function PhasesScreen() {
  const phases = useStore((s) => s.phases)
  const sessions = useStore((s) => s.sessions)
  const competitions = useStore((s) => s.competitions)
  const activePhaseId = useStore((s) => s.activePhaseId)
  const selectPhase = useStore((s) => s.selectPhase)
  const setTab = useStore((s) => s.setTab)

  const [editor, setEditor] = useState<EditorState>({ open: false })
  const [importPhaseId, setImportPhaseId] = useState<string | null>(null)

  const sorted = [...phases].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const importPhase = phases.find((p) => p.id === importPhaseId) ?? null

  const selectAndLog = (id: string) => {
    selectPhase(id)
    setTab('log')
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-text">Phases</h1>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No phases yet."
          text="Create a training block to start planning."
          action={<Button onClick={() => setEditor({ open: true })}>New phase</Button>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {sorted.map((p) => (
              <PhaseCard
                key={p.id}
                phase={p}
                active={p.id === activePhaseId}
                sessionCount={sessions.filter((s) => s.phaseId === p.id).length}
                compName={competitions.find((c) => c.id === p.compId)?.name ?? null}
                onSelect={() => selectAndLog(p.id)}
                onEdit={() => setEditor({ open: true, phaseId: p.id })}
                onImport={() => setImportPhaseId(p.id)}
              />
            ))}
          </div>
          <Button variant="ghost" onClick={() => setEditor({ open: true })} className="self-start">
            <Plus size={16} aria-hidden /> New phase
          </Button>
        </>
      )}

      {editor.open && (
        <PhaseEditor phaseId={editor.phaseId} onClose={() => setEditor({ open: false })} />
      )}

      {importPhase && (
        <ImportModal
          phase={importPhase}
          initialDayId={importPhase.days[0]?.id ?? null}
          initialWeek={1}
          onClose={() => setImportPhaseId(null)}
        />
      )}
    </section>
  )
}
