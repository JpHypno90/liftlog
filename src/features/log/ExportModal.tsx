import { useState } from 'react'
import { Copy, Check, Download, Printer } from 'lucide-react'
import type { Phase } from '@/types'
import { useStore } from '@/store'
import { exportWeekText, exportWeekFilename, weekSheet } from '@/lib/export'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'

export interface ExportModalProps {
  phase: Phase
  week: number
  onClose: () => void
}

export function ExportModal({ phase, week, onClose }: ExportModalProps) {
  const athlete = useStore((s) => s.athlete)
  const phases = useStore((s) => s.phases)
  const sessions = useStore((s) => s.sessions)

  const [copied, setCopied] = useState(false)

  const data = { athlete, phases, sessions }
  const text = exportWeekText(data, phase.id, week)
  const sheet = weekSheet(data, phase.id, week)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard may be unavailable — ignore silently
    }
  }

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportWeekFilename(phase.name, week)
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal open onClose={onClose} title={`Export · Week ${week}`}>
      <div className="flex flex-col gap-4">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" onClick={download}>
            <Download size={16} aria-hidden /> Download .txt
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer size={16} aria-hidden /> Print / PDF
          </Button>
        </div>

        {/* Screenshot-friendly / printable sheet */}
        <div className="print-sheet flex flex-col gap-4 rounded-md border border-paper-line bg-paper p-5 text-ink">
          <header className="border-b border-paper-line pb-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Iron Log{sheet?.athlete ? ` — ${sheet.athlete}` : ''}
            </div>
            <div className="mt-1 font-display text-2xl text-ink">
              {phase.name} — Week {week} of {phase.weeks}
            </div>
            <div className="text-sm text-ink-soft">{sheet?.date}</div>
          </header>

          {!sheet || sheet.days.length === 0 ? (
            <p className="text-sm text-ink-soft">No sessions logged this week.</p>
          ) : (
            sheet.days.map((day) => (
              <section key={day.id} className="flex flex-col gap-2">
                <h3 className="font-display text-lg uppercase tracking-wide text-ink">{day.name}</h3>
                {day.exercises.length === 0 ? (
                  <p className="text-sm text-ink-soft">No exercises.</p>
                ) : (
                  day.exercises.map((ex) => (
                    <div key={ex.id} className="border-b border-paper-line pb-2 last:border-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-ink">{ex.name}</span>
                        {ex.scheme && <span className="text-sm text-ink-soft">{ex.scheme}</span>}
                        {ex.warmup && <span className="text-xs text-ink-soft">· warm-up</span>}
                      </div>
                      {ex.sets && <div className="text-sm text-ink">{ex.sets}</div>}
                      {ex.notes && <div className="text-sm italic text-ink-soft">{ex.notes}</div>}
                    </div>
                  ))
                )}
              </section>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
