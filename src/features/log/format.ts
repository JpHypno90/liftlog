import type { Entry } from '@/types'

/** "200×6 · 200×6 · 180×8" — non-empty sets only; blank fields shown as "–". */
export function formatSets(entry: Entry): string {
  return entry.sets
    .filter((s) => s.w !== '' || s.r !== '')
    .map((s) => `${s.w === '' ? '–' : s.w}×${s.r === '' ? '–' : s.r}`)
    .join(' · ')
}
