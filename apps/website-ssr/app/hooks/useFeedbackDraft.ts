import { useCallback, useEffect, useRef, useState } from 'react'
import { type FeedbackDraft, storage } from '~/utils/storage'
import { useDebounce } from './useDebounce'

export interface FeedbackFormValues {
  rating: number
  workloadRating: number
  comment: string
}

export interface UseFeedbackDraftReturn {
  existingDraft: FeedbackDraft | null
  isLoaded: boolean
  saveDraft: (values: FeedbackFormValues) => void
  clearDraft: () => void
}

/**
 * Hook for managing feedback form draft persistence
 *
 * Features:
 * - Auto-saves form data to localStorage with 500ms debounce
 * - Detects existing drafts on mount
 * - Provides clear function for manual/submit cleanup
 *
 * Usage:
 * ```tsx
 * const { existingDraft, saveDraft, clearDraft } = useFeedbackDraft()
 *
 * // On mount: check existingDraft and show recovery dialog
 * // On form change: call saveDraft(formValues)
 * // On submit/discard: call clearDraft()
 * ```
 */
export function useFeedbackDraft(): UseFeedbackDraftReturn {
  // Load existing draft once on mount
  const [existingDraft, setExistingDraft] = useState<FeedbackDraft | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const hasLoadedDraft = useRef(false)

  // Load draft on mount (client-side only)
  useEffect(() => {
    if (!hasLoadedDraft.current) {
      const draft = storage.getFeedbackDraft()

      // Only consider it a valid draft if it has meaningful content
      const hasContent =
        draft &&
        (draft.rating > 0 ||
          draft.workloadRating > 0 ||
          draft.comment.trim().length > 0)

      setExistingDraft(hasContent ? draft : null)
      hasLoadedDraft.current = true
      setIsLoaded(true)
    }
  }, [])

  // Track pending draft to save (for debouncing)
  const [pendingDraft, setPendingDraft] = useState<FeedbackFormValues | null>(
    null
  )

  // Debounced draft value
  const debouncedDraft = useDebounce(pendingDraft, 500)

  // Save to localStorage when debounced value changes
  useEffect(() => {
    if (debouncedDraft) {
      storage.setFeedbackDraft(debouncedDraft)
    }
  }, [debouncedDraft])

  // Public API - memoized to prevent infinite loops
  const saveDraft = useCallback((values: FeedbackFormValues) => {
    setPendingDraft(values)
  }, [])

  const clearDraft = useCallback(() => {
    storage.clearFeedbackDraft()
    setExistingDraft(null)
    setPendingDraft(null)
  }, [])

  return {
    existingDraft,
    isLoaded,
    saveDraft,
    clearDraft
  }
}
