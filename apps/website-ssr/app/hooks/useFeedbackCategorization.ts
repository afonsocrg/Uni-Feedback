import {
  categorizeFeedbackPreview,
  type FeedbackCategories
} from '@uni-feedback/api-client'
import { useEffect, useRef, useState } from 'react'

interface UseFeedbackCategorizationOptions {
  debounceMs?: number
  minCharacters?: number
  enabled?: boolean
}

interface UseFeedbackCategorizationResult {
  categories: FeedbackCategories | null
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to categorize feedback text with debouncing and cost optimization.
 *
 * Features:
 * - Debounces API calls (default 4 seconds)
 * - Only categorizes text with minimum character count (default 50)
 * - Caches last categorized text to avoid redundant calls
 * - Cancels in-flight requests on unmount or text change
 * - Fails silently on errors (logs to console)
 *
 * @param comment - The feedback comment to categorize
 * @param options - Configuration options
 * @returns Object with categories, loading state, and error
 */
export function useFeedbackCategorization(
  comment: string,
  options: UseFeedbackCategorizationOptions = {}
): UseFeedbackCategorizationResult {
  const { debounceMs = 4000, minCharacters = 50, enabled = true } = options

  const [categories, setCategories] = useState<FeedbackCategories | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track the last text we categorized to avoid redundant API calls
  const lastCategorizedText = useRef<string>('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Don't categorize if disabled
    if (!enabled) {
      setIsLoading(false)
      return
    }

    // Don't categorize if text is too short
    if (comment.length < minCharacters) {
      setCategories(null)
      setIsLoading(false)
      setError(null)
      lastCategorizedText.current = ''
      return
    }

    // Don't categorize if text hasn't changed since last categorization
    if (comment === lastCategorizedText.current) {
      setIsLoading(false)
      return
    }

    // Clear loading state during debounce period
    setIsLoading(false)
    setError(null)

    // Debounce the categorization API call
    debounceTimerRef.current = setTimeout(async () => {
      // Double-check that text hasn't changed during debounce
      if (comment === lastCategorizedText.current) {
        setIsLoading(false)
        return
      }

      // Set loading state only when actually making the API call
      setIsLoading(true)

      // Create abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const result = await categorizeFeedbackPreview(comment)

        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setCategories(result)
          setError(null)
          lastCategorizedText.current = comment
        }
      } catch (err) {
        // Only update error state if request wasn't aborted
        if (!abortController.signal.aborted) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          setError(error)
          console.warn('Failed to categorize feedback:', error.message)
          // Don't clear categories on error - keep showing previous categories
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false)
          abortControllerRef.current = null
        }
      }
    }, debounceMs)

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [comment, debounceMs, minCharacters, enabled])

  return { categories, isLoading, error }
}
