import { useState, useEffect, useCallback } from 'react'

/**
 * SSR-safe localStorage hook
 * Returns the default value during SSR, then hydrates from localStorage on the client
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Initialize with default value (works on server)
  const [storedValue, setStoredValue] = useState<T>(defaultValue)

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const item = localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // Setter that writes to both state and localStorage (client-only)
  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value)

        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(value))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
