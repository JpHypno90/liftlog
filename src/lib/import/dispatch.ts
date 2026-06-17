import { detectColumns } from '@/lib/import/sheet'
import type { ColMap, ParseMode } from '@/lib/import/types'

export interface TextSniff {
  mode: ParseMode
  /** For 'sheet' mode: rows including the (likely) header row. */
  rows?: string[][]
  colMap?: ColMap
}

function splitDelimited(text: string, delim: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => line.split(delim).map((c) => c.trim()))
}

/** Decide how to parse pasted/typed plain text: TSV, CSV, or prose. */
export function sniffText(text: string): TextSniff {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { mode: 'text' }

  // Tabs anywhere → TSV
  if (text.includes('\t')) {
    const rows = splitDelimited(text, '\t')
    return { mode: 'sheet', rows, colMap: detectColumns(rows[0]) }
  }

  // Consistent commas across most lines → CSV
  const withCommas = lines.filter((l) => l.includes(',')).length
  if (lines.length >= 2 && withCommas >= Math.ceil(lines.length * 0.6)) {
    const rows = splitDelimited(text, ',')
    return { mode: 'sheet', rows, colMap: detectColumns(rows[0]) }
  }

  return { mode: 'text' }
}
