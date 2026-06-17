import type { SetEntry } from '@/types'

export interface NormalizedScheme {
  /** Human-readable display scheme, e.g. "3×5 @100kg". */
  scheme: string
  /** Prefilled per-set data, only when explicit numbers were found. */
  sets?: SetEntry[]
}

/**
 * Normalise a coach's set/rep notation into a display scheme and, where the
 * numbers are explicit, structured per-set data. The accuracy core of import.
 *
 * Handles: "3x5", "3 × 5", "5/5/5", "5,5,5", "3x5 @100kg", "100kg x5",
 * "5 reps @ RPE8". Ambiguous input keeps the text scheme with no sets.
 */
export function normalizeScheme(raw: string): NormalizedScheme {
  const s = (raw ?? '').trim()
  if (!s) return { scheme: '' }

  const display = s
    .replace(/(\d)\s*[x×]\s*(\d)/gi, '$1×$2')
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

  // Weight token: "100kg", "100 kg", "@100", "@100kg"
  let weight: number | '' = ''
  const wm = s.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb)\b/i) ?? s.match(/@\s*(\d+(?:\.\d+)?)/)
  if (wm) weight = Number(wm[1])

  // 2. Weight × reps (single set): "100kg x5"
  const wr = s.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb)\s*[x×]\s*(\d+)/i)
  if (wr) return { scheme: display, sets: [{ w: Number(wr[1]), r: Number(wr[2]) }] }

  // 3. Sets × reps: "3x5", "3 × 5" (optionally with the weight token above)
  const sr = s.match(/(\d+)\s*[x×]\s*(\d+)/i)
  if (sr) {
    const count = parseInt(sr[1], 10)
    const reps = parseInt(sr[2], 10)
    if (count >= 1 && count <= 30) {
      return { scheme: display, sets: Array.from({ length: count }, () => ({ w: weight, r: reps })) }
    }
  }

  // 4. Reps only: "5 reps @ RPE8"
  const ro = s.match(/(\d+)\s*reps?\b/i)
  if (ro) return { scheme: display, sets: [{ w: weight, r: parseInt(ro[1], 10) }] }

  // 5. Lone weight: "100kg"
  if (weight !== '' && /^\s*\d+(?:\.\d+)?\s*(?:kg|lb)\s*$/i.test(s)) {
    return { scheme: display, sets: [{ w: weight, r: '' }] }
  }

  return { scheme: display }
}
