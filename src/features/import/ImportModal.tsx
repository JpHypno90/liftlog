import { useState } from 'react'
import { Upload } from 'lucide-react'
import type { Day, Entry, Exercise, Phase } from '@/types'
import { useStore } from '@/store'
import { findSession } from '@/store/selectors'
import { uid } from '@/lib/id'
import { addDays, mondayOf, todayStr } from '@/lib/date'
import { emptyEntry } from '@/lib/defaults'
import {
  detectColumns,
  matchDay,
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
import { Input } from '@/components/Input'
import { Stepper } from '@/components/Stepper'
import { Chip } from '@/components/Chip'
import { Button } from '@/components/Button'
import { ReviewList, type ReviewGroup } from '@/features/import/ReviewList'

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
  /** Existing phase to import into; omit for "new phase from import" mode. */
  phase?: Phase
  initialDayId?: string | null
  initialWeek?: number
  onClose: () => void
}

export function ImportModal({ phase, initialDayId, initialWeek = 1, onClose }: ImportModalProps) {
  const sessions = useStore((s) => s.sessions)
  const templates = useStore((s) => s.templates)
  const importSession = useStore((s) => s.importSession)
  const updatePhase = useStore((s) => s.updatePhase)
  const addPhase = useStore((s) => s.addPhase)
  const selectPhase = useStore((s) => s.selectPhase)
  const setTab = useStore((s) => s.setTab)

  const isNew = !phase
  const defaultDayName =
    phase?.days.find((d) => d.id === initialDayId)?.name ?? phase?.days[0]?.name ?? 'Day 1'

  const [method, setMethod] = useState<Method>('paste')
  const [pasteText, setPasteText] = useState('')
  const [mode, setMode] = useState<ParseMode | null>(null)
  const [rows, setRows] = useState<string[][] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [colMap, setColMap] = useState<ColMap | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [targetWeek, setTargetWeek] = useState(
    phase ? Math.min(Math.max(initialWeek, 1), phase.weeks) : 1,
  )
  const [groups, setGroups] = useState<ReviewGroup[]>([])
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  // New-phase fields
  const [phaseName, setPhaseName] = useState('')
  const [phaseWeeks, setPhaseWeeks] = useState(8)
  const [phaseStart, setPhaseStart] = useState(mondayOf(todayStr()))

  const single = (name: string, list: ParsedExercise[]): ReviewGroup[] => [
    { id: uid(), name, rows: list },
  ]

  const onTextareaChange = (value: string) => {
    setPasteText(value)
    setConfirmOverwrite(false)
    const sniff = sniffText(value)
    if (sniff.mode === 'sheet' && sniff.rows && sniff.colMap) {
      setMode('sheet')
      setRows(sniff.rows)
      setHeaders(sniff.rows[0] ?? [])
      setColMap(sniff.colMap)
      setHasHeader(true)
      setGroups(single(defaultDayName, parseSheet(sniff.rows, sniff.colMap, true)))
    } else {
      setMode('text')
      setRows(null)
      setColMap(null)
      setHeaders([])
      const record = parseText(value, defaultDayName)
      setGroups(Object.entries(record).map(([name, list]) => ({ id: uid(), name, rows: list })))
    }
  }

  const onTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html')
    if (html && /<table/i.test(html)) {
      e.preventDefault()
      const t = parseTable(html)
      setPasteText([t.headers, ...t.rows].map((r) => r.join('\t')).join('\n'))
      setConfirmOverwrite(false)
      setMode('table')
      setRows(t.rows)
      setHeaders(t.headers)
      setColMap(t.colMap)
      setHasHeader(false)
      setGroups(single(t.title?.trim() || defaultDayName, parseSheet(t.rows, t.colMap, false)))
    }
  }

  const reparseSheet = (map: ColMap, header: boolean) => {
    if (!rows) return
    setGroups((prev) => [
      {
        id: prev[0]?.id ?? uid(),
        name: prev[0]?.name ?? defaultDayName,
        rows: parseSheet(rows, map, header),
      },
    ])
  }

  const onColMap = (field: keyof ColMap, value: number | null) => {
    if (!colMap) return
    const next = { ...colMap, [field]: value }
    setColMap(next)
    reparseSheet(next, hasHeader)
  }

  const onHasHeader = (value: boolean) => {
    setHasHeader(value)
    if (colMap) reparseSheet(colMap, value)
  }

  const onFile = async (file: File) => {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, raw: false })
    const sheetRows = raw.map((row) => (row ?? []).map((c) => (c == null ? '' : String(c))))
    const map = detectColumns(sheetRows[0] ?? [])
    setMethod('upload')
    setMode('sheet')
    setRows(sheetRows)
    setHeaders(sheetRows[0] ?? [])
    setColMap(map)
    setHasHeader(true)
    setGroups(
      single(file.name.replace(/\.[^.]+$/, '') || defaultDayName, parseSheet(sheetRows, map, true)),
    )
  }

  const pickTemplate = (name: string, exercises: Exercise[]) => {
    setMode('text')
    setRows(null)
    setColMap(null)
    setHeaders([])
    setConfirmOverwrite(false)
    setGroups(single(name, exercises.map((e) => ({ ...e, id: uid() }))))
  }

  const renameGroup = (groupId: string, name: string) => {
    setConfirmOverwrite(false)
    setGroups((gs) => gs.map((g) => (g.id === groupId ? { ...g, name } : g)))
  }
  const editRow = (groupId: string, rowId: string, patch: Partial<ParsedExercise>) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.id === groupId ? { ...g, rows: g.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) } : g,
      ),
    )
  const deleteRow = (groupId: string, rowId: string) =>
    setGroups((gs) =>
      gs.map((g) => (g.id === groupId ? { ...g, rows: g.rows.filter((r) => r.id !== rowId) } : g)),
    )
  const addRow = (groupId: string) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.id === groupId
          ? { ...g, rows: [...g.rows, { id: uid(), name: '', scheme: '', cue: '', warmup: false }] }
          : g,
      ),
    )

  const active = groups
    .map((g) => ({ name: g.name.trim() || defaultDayName, rows: g.rows.filter((r) => r.name.trim() !== '') }))
    .filter((g) => g.rows.length > 0)
  const count = active.reduce((n, g) => n + g.rows.length, 0)

  const overwriteNames =
    phase === undefined
      ? []
      : active
          .filter((g) => {
            const d = matchDay(g.name, phase.days)
            return d && findSession({ phases: [phase], sessions }, phase.id, targetWeek, d.id)
          })
          .map((g) => g.name)

  const toExerciseEntries = (list: ParsedExercise[]) => {
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
    return { exercises, entries }
  }

  const applyIntoPhase = (target: Phase) => {
    const createdDays: Day[] = []
    const byDay = new Map<string, ParsedExercise[]>()
    for (const g of active) {
      const existing = matchDay(g.name, [...target.days, ...createdDays])
      let dayId: string
      if (existing) {
        dayId = existing.id
      } else {
        const day = { id: uid(), name: g.name }
        createdDays.push(day)
        dayId = day.id
      }
      byDay.set(dayId, [...(byDay.get(dayId) ?? []), ...g.rows])
    }
    if (createdDays.length > 0) updatePhase(target.id, { days: [...target.days, ...createdDays] })

    const date = addDays(target.startDate, (targetWeek - 1) * 7)
    for (const [dayId, list] of byDay) {
      const { exercises, entries } = toExerciseEntries(list)
      importSession({ phaseId: target.id, dayId, week: targetWeek, date, exercises, entries })
    }
  }

  const applyNewPhase = () => {
    const days = active.map((g) => ({ id: uid(), name: g.name }))
    const pid = addPhase({
      name: phaseName.trim() || 'New phase',
      weeks: phaseWeeks,
      startDate: phaseStart,
      days,
      seed: false,
    })
    active.forEach((g, i) => {
      const { exercises, entries } = toExerciseEntries(g.rows)
      importSession({ phaseId: pid, dayId: days[i].id, week: 1, date: phaseStart, exercises, entries })
    })
    selectPhase(pid)
    setTab('log')
  }

  const canImport = count > 0 && (!isNew || phaseName.trim().length > 0)

  const onImport = () => {
    if (!canImport) return
    if (isNew) {
      applyNewPhase()
    } else {
      if (overwriteNames.length > 0 && !confirmOverwrite) {
        setConfirmOverwrite(true)
        return
      }
      applyIntoPhase(phase)
    }
    onClose()
  }

  const colOptions = headers.length > 0 ? headers : (rows?.[0]?.map((_, i) => `Column ${i + 1}`) ?? [])
  const importLabel = confirmOverwrite
    ? 'Overwrite & import'
    : isNew
      ? `Create phase (${count})`
      : `Import ${count} exercise${count === 1 ? '' : 's'}`

  return (
    <Modal open onClose={onClose} title={isNew ? 'New phase from import' : 'Import plan'}>
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
              placeholder="Paste text, a spreadsheet selection, or a copied table…"
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
                  onClick={() => pickTemplate(t.name, t.exercises)}
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

        {/* Target / new-phase controls */}
        {isNew ? (
          <div className="flex flex-col gap-3 rounded-md border border-line p-3">
            <Input
              label="Phase name"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              placeholder="e.g. Off-season block"
              error={phaseName.trim() ? undefined : 'Name is required'}
            />
            <div className="flex items-end gap-3">
              <Stepper label="Weeks" value={phaseWeeks} onChange={setPhaseWeeks} min={2} max={52} />
              <Input
                className="flex-1"
                label="Monday of week 1"
                type="date"
                value={phaseStart}
                onChange={(e) => setPhaseStart(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <Stepper
              label="Target week"
              value={targetWeek}
              onChange={(v) => {
                setTargetWeek(v)
                setConfirmOverwrite(false)
              }}
              min={1}
              max={phase.weeks}
            />
          </div>
        )}

        {/* Review */}
        {groups.length > 0 ? (
          <ReviewList
            groups={groups}
            dayNames={phase?.days.map((d) => d.name) ?? []}
            onRenameGroup={renameGroup}
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
            {overwriteNames.length === 1 ? '' : 's'} on {overwriteNames.join(', ')} — Week{' '}
            {targetWeek}.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onImport}
            disabled={!canImport}
            variant={confirmOverwrite ? 'danger' : 'solid'}
            className={cn(!confirmOverwrite && 'shine-border')}
          >
            {importLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
