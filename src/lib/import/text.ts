import type { Day } from '@/types'
import { uid } from '@/lib/id'
import { matchDay } from '@/lib/import/matchDay'
import { normalizeScheme } from '@/lib/import/scheme'
import type { ParsedExercise } from '@/lib/import/types'

const HEADER = /^(?:==\s*(.+?)\s*==|#+\s*(.+?))\s*$/
const SEPARATOR = /^[-=_*·•]{2,}$/
const TRAILING_SCHEME =
  /^(.*?)[\s–-]+(\d+\s*[x×]\s*\d.*|\d+(?:[/,]\d+)+|\d+\s*reps?\b.*|\d+(?:\.\d+)?\s*(?:kg|lb)\b.*)$/i

/** Split a single line into an exercise (name | scheme | cue or a bare name). */
export function parseExerciseLine(line: string): ParsedExercise {
  let name = line.trim()
  let schemeRaw = ''
  let cue = ''

  if (line.includes('|')) {
    const parts = line.split('|').map((p) => p.trim())
    name = parts[0] ?? ''
    schemeRaw = parts[1] ?? ''
    cue = parts.slice(2).join(' · ').trim()
  } else {
    const m = line.trim().match(TRAILING_SCHEME)
    if (m) {
      name = m[1].trim()
      schemeRaw = m[2].trim()
    }
  }

  const { scheme, sets } = normalizeScheme(schemeRaw)
  const ex: ParsedExercise = { id: uid(), name, scheme, cue, warmup: false }
  if (sets) ex.sets = sets
  return ex
}

/**
 * Parse free text, one exercise per line. "== Day ==" / "# Day" headers switch
 * the target day via fuzzy matching; unmatched headers fall back to fallbackDayId.
 */
export function parseText(
  raw: string,
  fallbackDayId: string,
  days: Day[],
): Record<string, ParsedExercise[]> {
  const out: Record<string, ParsedExercise[]> = {}
  let current = fallbackDayId

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t) continue

    const h = t.match(HEADER)
    if (h) {
      const label = h[1] ?? h[2] ?? ''
      const day = matchDay(label, days)
      current = day ? day.id : fallbackDayId
      continue
    }

    if (SEPARATOR.test(t)) continue

    const ex = parseExerciseLine(t)
    ;(out[current] ??= []).push(ex)
  }

  return out
}
