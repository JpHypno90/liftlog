/** Async key/value storage behind an interface so the impl can be swapped/tested. */
export interface StorageAdapter {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  list(): Promise<string[]>
}

/** The single localStorage key all Iron Log data is serialised under. */
export const STORAGE_KEY = 'iron-log'

/**
 * localStorage-backed adapter. Every call is wrapped in try/catch and never
 * throws to the caller (storage may be unavailable, full, or in private mode).
 */
export const localStorageAdapter: StorageAdapter = {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      if (typeof localStorage === 'undefined') return null
      const raw = localStorage.getItem(key)
      return raw === null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // swallow — never throw to the caller
    }
  },

  async delete(key: string): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.removeItem(key)
    } catch {
      // swallow
    }
  },

  async list(): Promise<string[]> {
    try {
      if (typeof localStorage === 'undefined') return []
      return Object.keys(localStorage)
    } catch {
      return []
    }
  },
}
