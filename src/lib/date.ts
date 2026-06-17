/** Pure date helpers. All dates are local-time ISO strings: YYYY-MM-DD. */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse a YYYY-MM-DD string as a local-midnight Date. */
function parse(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

/** Whole-day difference a - b (a and b are YYYY-MM-DD). */
function diffDays(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86_400_000)
}

/** Today as YYYY-MM-DD (local). */
export function todayStr(): string {
  return fmt(new Date())
}

/** Add n days (may be negative) to an ISO date, returning an ISO date. */
export function addDays(dateStr: string, n: number): string {
  const d = parse(dateStr)
  d.setDate(d.getDate() + n)
  return fmt(d)
}

/** The Monday (ISO week start) of the given date's week. */
export function mondayOf(dateStr: string): string {
  const d = parse(dateStr)
  const dow = d.getDay() // 0=Sun … 6=Sat
  const offset = (dow + 6) % 7 // days since Monday
  d.setDate(d.getDate() - offset)
  return fmt(d)
}

/** 1-based program week that `date` falls in, relative to `start`. Clamped to ≥ 1. */
export function weekIndex(date: string, start: string): number {
  return Math.max(1, Math.floor(diffDays(date, start) / 7) + 1)
}

/** Whole days from today until `date` (negative if in the past). */
export function daysUntil(dateStr: string): number {
  return diffDays(dateStr, todayStr())
}

/** Human-friendly date for display, e.g. "Mon 15 Jun 2026". */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1)
  return dt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Short human countdown to a date: "Today", "1 day", "9 days", "6 wks", "past". */
export function countdownLabel(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d < 0) return 'past'
  if (d === 0) return 'Today'
  if (d === 1) return '1 day'
  if (d < 14) return `${d} days`
  return `${Math.round(d / 7)} wks`
}
