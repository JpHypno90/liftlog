import { detectColumns } from '@/lib/import/sheet'
import type { TableResult } from '@/lib/import/types'

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

function stripHtml(cell: string): string {
  return cell
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse a pasted HTML <table> into headers + body rows, with an auto-detected
 * column map. Pure string parsing — no DOM, so it runs in tests too.
 */
export function parseTable(html: string): TableResult {
  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const allRows = rowMatches
    .map((r) =>
      [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => stripHtml(c[1])),
    )
    .filter((cells) => cells.length > 0)

  if (allRows.length === 0) {
    return { headers: [], rows: [], colMap: detectColumns([]) }
  }

  // A leading single-cell row (e.g. a merged title) is the session name, not headers.
  let title: string | undefined
  let bodyStart = 0
  if (allRows.length > 1 && allRows[0].length === 1 && allRows[1].length > 1) {
    title = allRows[0][0]
    bodyStart = 1
  }

  const headers = allRows[bodyStart]
  const rows = allRows.slice(bodyStart + 1)
  return { headers, rows, colMap: detectColumns(headers), title }
}
