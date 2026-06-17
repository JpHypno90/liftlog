import type { Exercise, SetEntry } from '@/types'

/** An exercise parsed from an import source, with optional prefilled per-set data. */
export interface ParsedExercise extends Exercise {
  /** Present only when the source had explicit per-set numbers. */
  sets?: SetEntry[]
}

/** Maps cell-array columns to fields. null = column not mapped. */
export interface ColMap {
  name: number | null
  scheme: number | null
  reps: number | null
  weight: number | null
  cue: number | null
}

/** Result of parsing a pasted HTML table. */
export interface TableResult {
  headers: string[]
  rows: string[][]
  colMap: ColMap
}

export type ParseMode = 'text' | 'sheet' | 'table'
