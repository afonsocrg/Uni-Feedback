import { useState } from 'react'
import { useDebounced } from './useDebounced'

/**
 * Custom hook for debounced search without URL synchronization
 * @param initialValue - Initial search value (default: '')
 * @param debounceDelay - The debounce delay in milliseconds (default: 300ms)
 * @returns Object with search term, setter, and debounced value
 */
export function useDebouncedSearch(
  initialValue: string = '',
  debounceDelay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const debouncedSearchTerm = useDebounced(searchTerm, debounceDelay)

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm
  }
}
