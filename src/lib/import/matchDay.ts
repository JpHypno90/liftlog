import type { Day } from '@/types'

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fuzzy-match a header/label to a day by name:
 * exact → substring (either direction) → word overlap. Undefined if nothing matches.
 */
export function matchDay(label: string, days: Day[]): Day | undefined {
  const L = norm(label)
  if (!L) return undefined

  // exact
  for (const d of days) if (norm(d.name) === L) return d

  // substring, either direction
  for (const d of days) {
    const N = norm(d.name)
    if (N && (L.includes(N) || N.includes(L))) return d
  }

  // word overlap
  const words = new Set(L.split(' '))
  let best: Day | undefined
  let bestScore = 0
  for (const d of days) {
    const score = norm(d.name)
      .split(' ')
      .filter((w) => words.has(w)).length
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return bestScore > 0 ? best : undefined
}
