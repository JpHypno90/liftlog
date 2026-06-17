import { uid } from '@/lib/id'
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
 * Parse free text, one exercise per line, grouped by day NAME. "== Day ==" /
 * "# Day" headers start a new group keyed by the header label; lines before any
 * header go under `fallbackName`. Day names are resolved to phase days at import
 * time (matched or created), so the target day comes from the plan itself.
 */
export function parseText(raw: string, fallbackName: string): Record<string, ParsedExercise[]> {
  const out: Record<string, ParsedExercise[]> = {}
  let current = fallbackName

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t) continue

    const h = t.match(HEADER)
    if (h) {
      current = (h[1] ?? h[2] ?? '').trim() || fallbackName
      continue
    }

    if (SEPARATOR.test(t)) continue

    const ex = parseExerciseLine(t)
    ;(out[current] ??= []).push(ex)
  }

  return out
}
