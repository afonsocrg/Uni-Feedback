import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

function readStored<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

/**
 * `useState` that survives navigation: the value is restored from
 * localStorage on mount and written back on every change. A null key gives
 * plain per-visit state, which shared hooks use for an explicit opt-out.
 * Values must be JSON-serializable (store dates as ISO strings). See the
 * dashboard-persisted-list-state skill.
 */
export function usePersistentState<T>(
  key: string | null,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (!key) return initialValue
    const stored = readStored<T>(key)
    return stored === undefined ? initialValue : stored
  })

  useEffect(() => {
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked: the state still works for this visit
    }
  }, [key, value])

  return [value, setValue]
}
