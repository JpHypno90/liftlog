import type { AppData } from '@/types'
import { migrate } from '@/lib/migrations'

/** Recursively sort object keys so equal data always serialises identically. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(obj).sort()) out[key] = canonical(obj[key])
    return out
  }
  return value
}

/** Serialise the dataset to pretty, key-stable JSON suitable for download. */
export function exportData(data: AppData): string {
  return JSON.stringify(canonical(data), null, 2)
}

/** Parse a backup string and run it through migrate() into valid AppData. */
export function importData(json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    parsed = undefined
  }
  return migrate(parsed)
}
