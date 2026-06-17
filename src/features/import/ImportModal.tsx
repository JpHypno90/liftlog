import { useState } from 'react'
import { Upload } from 'lucide-react'
import type { Entry, Exercise, Phase } from '@/types'
import { useStore } from '@/store'
import { findSession } from '@/store/selectors'
import { uid } from '@/lib/id'
import { addDays } from '@/lib/date'
import { emptyEntry } from '@/lib/defaults'
import {
  detectColumns,
  parseSheet,
  parseTable,
  parseText,
  sniffText,
  type ColMap,
  type ParseMode,
  type ParsedExercise,
} from '@/lib/import'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/Modal'
import { Textarea } from '@/components/Textarea'
import { Select } from '@/components/Select'
import { Stepper } from '@/components/Stepper'
import { Chip } from '@/components/Chip'
import { Button } from '@/components/Button'
import { ReviewList } from '@/features/import/ReviewList'

type Method = 'paste' | 'upload' | 'saved'

const MODE_LABEL: Record<ParseMode, string> = {
  text: 'plain text',
  sheet: 'spreadsheet (TSV/CSV)',
  table: 'pasted table',
}

const COL_FIELDS: { key: keyof ColMap; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'scheme', label: 'Scheme' },
  { key: 'reps', label: 'Reps' },
  { key: 'weight', label: 'Weight' },
  { key: 'cue', label: 'Cue' },
]

export interface ImportModalProps {
  phase: Phase
  initialDayId: string | null
  initialWeek: number
  onClose: () => void
}

export function ImportModal({ phase, initialDayId, initialWeek, onClose }: ImportModalProps) {
  const sessions = useStore((s) => s.sessions)
  const templates = useStore((s) => s.templates)
  const importSession = useStore((s) => s.importSession)

  const firstDay = phase.days[0]?.id ?? ''
  const validInitialDay = phase.days.some((d) => d.id === initialDayId) ? initialDayId! : firstDay

  const [method, setMethod] = useState<Method>('paste')
  const [pasteText, setPasteText] = useState('')
  const [mode, setMode] = useState<ParseMode | null>(null)
  const [rows, setRows] = useState<string[][] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [colMap, setColMap] = useState<ColMap | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [targetDayId, setTargetDayId] = useState(validInitialDay)
  const [targetWeek, setTargetWeek] = useState(Math.min(Math.max(initialWeek, 1), phase.weeks))
  const [draft, setDraft] = useState<Record<string, ParsedExercise[]>>({})
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const setSheet = (
    nextRows: string[][],
    nextHeaders: string[],
    nextMap: ColMap,
    nextMode: ParseMode,
    header: boolean,
    dayId: string,
  ) => {
    setMode(nextMode)
    setRows(nextRows)
    setHeaders(nextHeaders)
    setColMap(nextMap)
    setHasHeader(header)
    setDraft({ [dayId]: parseSheet(nextRows, nextMap, header) })
  }

  const onTextareaChange = (value: string) => {
    setPasteText(value)
    setConfirmOverwrite(false)
    const sniff = sniffText(value)
    if (sniff.mode === 'sheet' && sniff.rows && sniff.colMap) {
      setSheet(sniff.rows, sniff.rows[0] ?? [], sniff.colMap, 'sheet', true, targetDayId)
    } else {
      setMode('text')
      setRows(null)
      setColMap(null)
      setHeaders([])
      setDraft(parseText(value, targetDayId, phase.days))
    }
  }

  const onTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html')
    if (html && /<table/i.test(html)) {
      e.preventDefault()
      const t = parseTable(html)
      const tsv = [t.headers, ...t.rows].map((r) => r.join('\t')).join('\n')
      setPasteText(tsv)
      setConfirmOverwrite(false)
      setSheet(t.rows, t.headers, t.colMap, 'table', false, targetDayId)
    }
  }

  const onColMap = (field: keyof ColMap, value: number | null) => {
    if (!rows || !colMap || !mode) return
    const next = { ...colMap, [field]: value }
    setColMap(next)
    setDraft({ [targetDayId]: parseSheet(rows, next, hasHeader) })
  }

  const onHasHeader = (value: boolean) => {
    setHasHeader(value)
    if (rows && colMap) setDraft({ [targetDayId]: parseSheet(rows, colMap, value) })
  }

  const onTargetDay = (dayId: string) => {
    setTargetDayId(dayId)
    setConfirmOverwrite(false)
    if (mode === 'text') {
      setDraft(parseText(pasteText, dayId, phase.days))
    } else if (rows && colMap) {
      setDraft({ [dayId]: parseSheet(rows, colMap, hasHeader) })
    } else {
      setDraft((d) => {
        const keys = Object.keys(d)
        return keys.length === 1 ? { [dayId]: d[keys[0]] } : d
      })
    }
  }

  const onFile = async (file: File) => {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, raw: false })
    const sheetRows = raw.map((row) => (row ?? []).map((c) => (c == null ? '' : String(c))))
    setMethod('upload')
    setSheet(sheetRows, sheetRows[0] ?? [], detectColumns(sheetRows[0] ?? []), 'sheet', true, targetDayId)
  }

  const pickTemplate = (exercises: Exercise[]) => {
    setMode('text')
    setRows(null)
    setColMap(null)
    setHeaders([])
    setConfirmOverwrite(false)
    setDraft({ [targetDayId]: exercises.map((e) => ({ ...e, id: uid() })) })
  }

  // Review editing
  const editRow = (dayId: string, rowId: string, patch: Partial<ParsedExercise>) =>
    setDraft((d) => ({ ...d, [dayId]: d[dayId].map((r) => (r.id === rowId ? { ...r, ...patch } : r)) }))
  const deleteRow = (dayId: string, rowId: string) =>
    setDraft((d) => ({ ...d, [dayId]: d[dayId].filter((r) => r.id !== rowId) }))
  const addRow = (dayId: string) =>
    setDraft((d) => ({
      ...d,
      [dayId]: [...(d[dayId] ?? []), { id: uid(), name: '', scheme: '', cue: '', warmup: false }],
    }))

  const count = Object.values(draft).reduce(
    (n, list) => n + list.filter((r) => r.name.trim() !== '').length,
    0,
  )
  const overwriteDays = Object.keys(draft).filter(
    (dayId) =>
      draft[dayId].some((r) => r.name.trim() !== '') &&
      findSession({ phases: phase.days.length ? [phase] : [], sessions }, phase.id, targetWeek, dayId),
  )

  const apply = () => {
    for (const dayId of Object.keys(draft)) {
      const list = draft[dayId].filter((r) => r.name.trim() !== '')
      if (list.length === 0) continue
      const exercises: Exercise[] = []
      const entries: Record<string, Entry> = {}
      for (const r of list) {
        const id = uid()
        exercises.push({
          id,
          name: r.name.trim(),
          scheme: r.scheme.trim(),
          cue: r.cue.trim(),
          warmup: false,
        })
        entries[id] =
          r.sets && r.sets.length > 0
            ? { sets: r.sets.map((s) => ({ ...s })), notes: '', done: false }
            : emptyEntry()
      }
      importSession({
        phaseId: phase.id,
        dayId,
        week: targetWeek,
        date: addDays(phase.startDate, (targetWeek - 1) * 7),
        exercises,
        entries,
      })
    }
    onClose()
  }

  const onImport = () => {
    if (overwriteDays.length > 0 && !confirmOverwrite) {
      setConfirmOverwrite(true)
      return
    }
    apply()
  }

  const colOptions = headers.length > 0 ? headers : rows?.[0]?.map((_, i) => `Column ${i + 1}`) ?? []

  return (
    <Modal open onClose={onClose} title="Import plan">
      <div className="flex max-h-[68vh] flex-col gap-4 overflow-y-auto pr-1">
        {/* Method tabs */}
        <div className="flex gap-2">
          {(['paste', 'upload', 'saved'] as Method[]).map((m) => (
            <Chip key={m} active={method === m} onClick={() => setMethod(m)}>
              {m === 'paste' ? 'Paste' : m === 'upload' ? 'Upload' : 'Saved'}
            </Chip>
          ))}
        </div>

        {/* Method content */}
        {method === 'paste' && (
          <div className="flex flex-col gap-2">
            <Textarea
              aria-label="Paste plan"
              rows={5}
              placeholder={'Paste text, a spreadsheet selection, or a copied table…'}
              value={pasteText}
              onChange={(e) => onTextareaChange(e.target.value)}
              onPaste={onTextareaPaste}
            />
            {mode && (
              <span className="text-xs text-faint">
                Detected: {MODE_LABEL[mode]}
                {mode === 'text' && ' — Name | sets×reps | cue, "== Day ==" headers'}
              </span>
            )}
          </div>
        )}

        {method === 'upload' && (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line bg-card px-4 py-6 text-sm text-muted hover:border-muted">
            <Upload size={18} aria-hidden />
            Choose a .csv or .xlsx file
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onFile(f)
              }}
            />
          </label>
        )}

        {method === 'saved' && (
          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <p className="text-sm text-muted">No saved templates yet.</p>
            ) : (
              templates.map((t) => (
                <Button
                  key={t.id}
                  variant="ghost"
                  className="justify-between"
                  onClick={() => pickTemplate(t.exercises)}
                >
                  <span>{t.name}</span>
                  <span className="text-xs text-faint">{t.exercises.length} exercises</span>
                </Button>
              ))
            )}
          </div>
        )}

        {/* Column mapping for sheet/table */}
        {(mode === 'sheet' || mode === 'table') && colMap && colOptions.length > 0 && (
          <div className="flex flex-col gap-3 rounded-md border border-line p-3">
            <span className="text-sm font-medium text-muted">Columns</span>
            <div className="grid grid-cols-2 gap-2">
              {COL_FIELDS.map(({ key, label }) => (
                <Select
                  key={key}
                  label={label}
                  value={colMap[key] === null ? '' : String(colMap[key])}
                  onChange={(e) => onColMap(key, e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">None</option>
                  {colOptions.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
            {mode === 'sheet' && (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => onHasHeader(e.target.checked)}
                  className="accent-accent"
                />
                First row is a header
              </label>
            )}
          </div>
        )}

        {/* Target controls */}
        <div className="flex items-end gap-3">
          <Select
            className="flex-1"
            label="Target day"
            value={targetDayId}
            onChange={(e) => onTargetDay(e.target.value)}
          >
            {phase.days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Stepper
            label="Week"
            value={targetWeek}
            onChange={(v) => {
              setTargetWeek(v)
              setConfirmOverwrite(false)
            }}
            min={1}
            max={phase.weeks}
          />
        </div>

        {/* Review */}
        {count > 0 || Object.keys(draft).length > 0 ? (
          <ReviewList
            days={phase.days}
            draft={draft}
            onEdit={editRow}
            onDelete={deleteRow}
            onAdd={addRow}
          />
        ) : (
          <p className="text-sm text-muted">Paste, upload, or pick a template to begin.</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
        {confirmOverwrite && (
          <p className="text-sm text-danger">
            This will overwrite the existing session
            {overwriteDays.length === 1 ? '' : 's'} on{' '}
            {overwriteDays.map((id) => phase.days.find((d) => d.id === id)?.name).join(', ')} — Week{' '}
            {targetWeek}.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onImport}
            disabled={count === 0}
            variant={confirmOverwrite ? 'danger' : 'solid'}
            className={cn(!confirmOverwrite && 'shine-border')}
          >
            {confirmOverwrite ? 'Overwrite & import' : `Import ${count} exercise${count === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
