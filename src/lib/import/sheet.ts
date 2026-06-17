import type { SetEntry } from '@/types'
import { uid } from '@/lib/id'
import { normalizeScheme, repsValue } from '@/lib/import/scheme'
import type { ColMap, ParsedExercise } from '@/lib/import/types'

function leadingNumber(value: string): number | '' {
  const m = String(value).match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : ''
}

/**
 * Guess which column is which from header text, with positional fallbacks.
 * movement/exercise → name; combined "sets×reps"/scheme → scheme; reps → reps;
 * weight/load → weight; notes/comments/cue → cue.
 */
export function detectColumns(headers: string[]): ColMap {
  const h = headers.map((x) => String(x).toLowerCase().trim())
  const find = (...keys: string[]) => {
    const i = h.findIndex((x) => keys.some((k) => x.includes(k)))
    return i >= 0 ? i : null
  }

  const combined = h.findIndex(
    (x) => /sets?\s*[x×/]\s*reps?/.test(x) || x.includes('scheme') || x.replace(/\s/g, '') === 'sets',
  )
  // Don't let a separate field reuse the combined-scheme column.
  const findExcept = (except: number, ...keys: string[]) => {
    const i = h.findIndex((x, idx) => idx !== except && keys.some((k) => x.includes(k)))
    return i >= 0 ? i : null
  }

  const map: ColMap = {
    name: find('movement', 'exercise', 'lift', 'name'),
    scheme: combined >= 0 ? combined : null,
    reps: findExcept(combined, 'reps', 'rep'),
    weight: find('weight', 'load', 'kg'),
    cue: find('notes', 'comment', 'cue', 'note'),
  }

  // Positional fallback: first column is the name if nothing matched.
  if (map.name === null) map.name = headers.length > 0 ? 0 : null
  return map
}

/** Combine a scheme cell with optional separate reps/weight cells. */
function combineCells(schemeCell: string, repsCell: string, weightCell: string): NormalizedCell {
  const weight = weightCell ? leadingNumber(weightCell) : ''
  const reps = repsCell.trim()
  const repsNum = reps ? repsValue(reps) : '' // '' for ranges/distances

  // Bare integer scheme cell = a set count (e.g. "Sets" column = 3) + separate reps.
  if (/^\d+$/.test(schemeCell.trim()) && reps !== '') {
    const count = parseInt(schemeCell.trim(), 10)
    if (count >= 1 && count <= 30) {
      return {
        scheme: `${count}×${reps}${weight !== '' ? ` @${weight}kg` : ''}`,
        sets: Array.from({ length: count }, () => ({ w: weight, r: repsNum })),
      }
    }
  }

  const norm = normalizeScheme(schemeCell)
  let scheme = norm.scheme
  let sets = norm.sets

  if (!sets) {
    if (reps !== '') {
      sets = [{ w: weight, r: repsNum }]
      scheme = scheme || (weight !== '' ? `${weight}kg × ${reps}` : `× ${reps}`)
    } else if (weight !== '') {
      sets = [{ w: weight, r: '' }]
      scheme = scheme || `${weight}kg`
    }
  } else {
    if (weight !== '') sets = sets.map((st) => ({ ...st, w: st.w === '' ? weight : st.w }))
    if (repsNum !== '') sets = sets.map((st) => ({ ...st, r: st.r === '' ? repsNum : st.r }))
  }

  return { scheme, sets }
}

interface NormalizedCell {
  scheme: string
  sets?: SetEntry[]
}

/** Parse rows (cell arrays) into exercises for one day, using a column map. */
export function parseSheet(rows: string[][], colMap: ColMap, hasHeader: boolean): ParsedExercise[] {
  const body = hasHeader ? rows.slice(1) : rows
  const cellAt = (row: string[], i: number | null) =>
    i !== null && i >= 0 && i < row.length ? String(row[i]).trim() : ''

  const out: ParsedExercise[] = []
  for (const row of body) {
    const name = cellAt(row, colMap.name)
    if (!name) continue // drop empty / separator rows

    const { scheme, sets } = combineCells(
      cellAt(row, colMap.scheme),
      cellAt(row, colMap.reps),
      cellAt(row, colMap.weight),
    )
    const ex: ParsedExercise = {
      id: uid(),
      name,
      scheme,
      cue: cellAt(row, colMap.cue),
      warmup: false,
    }
    if (sets) ex.sets = sets
    out.push(ex)
  }
  return out
}
