import { useDebounced } from './useDebounced'
import { usePersistentState } from './usePersistentState'

/**
 * Custom hook for debounced search without URL synchronization
 * @param storageKey - localStorage key (from `STORAGE_KEYS`) that remembers
 *   the term across visits. Required so every search box decides: pass null
 *   only for a search that should reset on each visit.
 * @param debounceDelay - The debounce delay in milliseconds (default: 300ms)
 * @returns Object with search term, setter, and debounced value
 */
export function useDebouncedSearch(
  storageKey: string | null,
  debounceDelay: number = 300
) {
  const [searchTerm, setSearchTerm] = usePersistentState(storageKey, '')
  const debouncedSearchTerm = useDebounced(searchTerm, debounceDelay)

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm
  }
}
