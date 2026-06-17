import type { SetEntry } from '@/types'

export interface NormalizedScheme {
  /** Human-readable display scheme, e.g. "3×5 @100kg", "3×12-15", "2×20m". */
  scheme: string
  /** Prefilled per-set data, only when explicit numbers were found. */
  sets?: SetEntry[]
}

/**
 * Resolve a reps token to a concrete number, or '' when it isn't a single rep
 * count — ranges ("12-15"), distances ("20m"), and other notations stay blank
 * so they're never mis-logged as a rep number.
 */
export function repsValue(token: string): number | '' {
  const t = token.trim()
  if (/^\d+$/.test(t)) return Number(t)
  const m = t.match(/^(\d+)\s*reps?$/i)
  return m ? Number(m[1]) : ''
}

/**
 * Normalise a coach's set/rep notation into a display scheme and, where the
 * numbers are explicit, structured per-set data. The accuracy core of import.
 *
 * Handles: "3x5", "3 × 5", "5/5/5", "5,5,5", "3x5 @100kg", "100kg x5",
 * "5 reps @ RPE8", rep ranges ("3x12-15"), and distances ("2x20m", "20m").
 * Ranges/distances keep the set count but leave per-set reps blank.
 */
export function normalizeScheme(raw: string): NormalizedScheme {
  const s = (raw ?? '').trim()
  if (!s) return { scheme: '' }

  const display = s
    .replace(/(\w)\s*[xX×]\s*(\d)/g, '$1×$2')
    .replace(/\s+/g, ' ')
    .trim()

  // 1. Per-set reps list: "5/5/5" or "5,5,5"
  if (/^\d+(\s*[/,]\s*\d+)+$/.test(s)) {
    const reps = s
      .split(/[/,]/)
      .map((t) => parseInt(t.trim(), 10))
      .filter((n) => !Number.isNaN(n))
    return { scheme: reps.join('/'), sets: reps.map((r) => ({ w: '', r })) }
  }

  // 2. Weight × reps (single set): "100kg x5"
  const wr = s.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb)\s*[x×]\s*(\d+)/i)
  if (wr) return { scheme: display, sets: [{ w: Number(wr[1]), r: Number(wr[2]) }] }

  // Extract a weight token (kg/lb or @N) and strip it so the reps token is clean.
  let weight: number | '' = ''
  const wkg = s.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb)\b/i)
  const wat = s.match(/@\s*(\d+(?:\.\d+)?)/)
  if (wkg) weight = Number(wkg[1])
  else if (wat) weight = Number(wat[1])
  const body = s
    .replace(/\d+(?:\.\d+)?\s*(?:kg|lb)\b/gi, ' ')
    .replace(/@\s*\d+(?:\.\d+)?/g, ' ')
    .replace(/@/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 3. Sets × reps-token: "3x5", "3x12-15", "2x20m"
  const sr = body.match(/^(\d+)\s*[x×]\s*(.+)$/i)
  if (sr) {
    const count = parseInt(sr[1], 10)
    if (count >= 1 && count <= 30) {
      const r = repsValue(sr[2])
      return { scheme: display, sets: Array.from({ length: count }, () => ({ w: weight, r })) }
    }
  }

  // 4. Reps only: "5 reps @ RPE8"
  const ro = body.match(/(\d+)\s*reps?\b/i)
  if (ro) return { scheme: display, sets: [{ w: weight, r: Number(ro[1]) }] }

  // 5. Lone weight: "100kg"
  if (weight !== '' && /^\s*\d+(?:\.\d+)?\s*(?:kg|lb)\s*$/i.test(s)) {
    return { scheme: display, sets: [{ w: weight, r: '' }] }
  }

  return { scheme: display }
}
