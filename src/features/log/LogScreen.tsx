import { useEffect } from 'react'
import { Dumbbell, Download, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { findSession } from '@/store/selectors'
import { addDays, todayStr, weekIndex, countdownLabel } from '@/lib/date'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { WeekStrip } from '@/features/log/WeekStrip'
import { DayTabs } from '@/features/log/DayTabs'
import { SessionView } from '@/features/log/SessionView'
import { WorkoutPreview } from '@/features/log/WorkoutPreview'

export function LogScreen() {
  const activePhaseId = useStore((s) => s.activePhaseId)
  const phases = useStore((s) => s.phases)
  const competitions = useStore((s) => s.competitions)
  const sessions = useStore((s) => s.sessions)
  const week = useStore((s) => s.week)
  const dayId = useStore((s) => s.dayId)
  const setTab = useStore((s) => s.setTab)
  const setWeek = useStore((s) => s.setWeek)
  const setDay = useStore((s) => s.setDay)
  const setEditing = useStore((s) => s.setEditing)
  const startSession = useStore((s) => s.startSession)

  const phase = phases.find((p) => p.id === activePhaseId) ?? null
  const days = phase?.days ?? []
  const selectedDay = days.find((d) => d.id === dayId) ?? days[0] ?? null
  const selectedDayId = selectedDay?.id ?? null
  const selectedWeek = phase ? Math.min(Math.max(week, 1), phase.weeks) : 1

  // Keep the selected day valid and the week within range.
  useEffect(() => {
    if (phase && selectedDayId && selectedDayId !== dayId) setDay(selectedDayId)
  }, [phase, selectedDayId, dayId, setDay])
  useEffect(() => {
    if (phase && selectedWeek !== week) setWeek(selectedWeek)
  }, [phase, selectedWeek, week, setWeek])
  // Leave edit mode when the selection changes.
  useEffect(() => {
    setEditing(false)
  }, [selectedDayId, selectedWeek, setEditing])

  if (!phase || !selectedDay) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-2xl text-text">Log</h1>
        <EmptyState
          icon={Dumbbell}
          title="No training phase yet"
          text="Create a training phase to start logging sessions."
          action={<Button onClick={() => setTab('phases')}>Go to Phases</Button>}
        />
      </section>
    )
  }

  const linkedComp = competitions.find((c) => c.id === phase.compId) ?? null
  const currentWeek = weekIndex(todayStr(), phase.startDate)
  const session = findSession({ phases, sessions }, phase.id, selectedWeek, selectedDay.id)

  const start = () => {
    const date = addDays(phase.startDate, (selectedWeek - 1) * 7)
    const id = startSession({ phaseId: phase.id, dayId: selectedDay.id, week: selectedWeek, date })
    const created = useStore.getState().sessions.find((s) => s.id === id)
    setEditing(!!created && created.exercises.length === 0)
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Context bar */}
      <button
        type="button"
        onClick={() => setTab('phases')}
        className="flex items-center justify-between gap-2 rounded-lg border border-line bg-card px-4 py-3 text-left transition-colors hover:border-muted"
      >
        <div className="min-w-0">
          <div className="truncate font-display text-lg text-text">{phase.name}</div>
          <div className="text-sm text-muted">
            Week {selectedWeek} of {phase.weeks}
            {linkedComp ? ` · ${linkedComp.name} (${countdownLabel(linkedComp.date)})` : ''}
          </div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-faint" aria-hidden />
      </button>

      {/* Week strip */}
      <WeekStrip
        phase={phase}
        sessions={sessions}
        linkedComp={linkedComp}
        currentWeek={currentWeek}
        selectedWeek={selectedWeek}
        onSelect={setWeek}
      />

      {/* Day tabs */}
      <DayTabs
        phase={phase}
        sessions={sessions}
        week={selectedWeek}
        selectedDayId={selectedDay.id}
        onSelect={setDay}
      />

      {/* Day title */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-xl text-text">
          {selectedDay.name} · Week {selectedWeek}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Import plan"
          onClick={() => {
            /* Import arrives in Phase 6 */
          }}
        >
          <Download size={16} aria-hidden /> Import
        </Button>
      </div>

      {/* Workspace */}
      {session ? (
        <SessionView session={session} phase={phase} />
      ) : (
        <div className="flex flex-col gap-4">
          <Button shine onClick={start} className="self-start">
            Start {selectedDay.name} — Week {selectedWeek}
          </Button>
          <WorkoutPreview phase={phase} dayId={selectedDay.id} week={selectedWeek} />
        </div>
      )}
    </section>
  )
}
