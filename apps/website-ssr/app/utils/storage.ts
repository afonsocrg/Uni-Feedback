/**
 * Storage utility for managing localStorage with SSR safety
 *
 * This provides a centralized interface for localStorage access with:
 * - SSR safety (checks typeof window !== 'undefined')
 * - Type conversions (number <-> string)
 * - Consistent error handling
 * - Single source of truth for localStorage keys (STORAGE_KEYS)
 *
 * Usage:
 *   storage.getSelectedFacultyId() // returns number | undefined
 *   storage.setSelectedFacultyId(5)
 *
 * Note: Only use in client-side contexts (clientLoader, useEffect, event handlers)
 */

import { STORAGE_KEYS } from './constants'

export interface FeedbackDraft {
  rating: number
  workloadRating: number
  comment: string
  timestamp: number // For "draft from X ago" message
}

export const storage = {
  // Course Browser

  getSelectedFacultyId(): number | undefined {
    if (typeof window === 'undefined') return undefined
    const value = localStorage.getItem(STORAGE_KEYS.SELECTED_FACULTY_ID)
    return value ? Number(value) : undefined
  },

  /**
   * Set selected faculty ID
   * Automatically clears the selected degree if faculty actually changes
   */
  setSelectedFacultyId(id: number | undefined): void {
    if (typeof window === 'undefined') return

    // Get current faculty to check if it's changing
    const currentFacultyId = this.getSelectedFacultyId()

    // Set or remove faculty
    if (id !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FACULTY_ID, id.toString())
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_FACULTY_ID)
    }

    // Only clear degree if faculty actually changed (degrees are faculty-specific)
    if (currentFacultyId !== id) {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_DEGREE_ID)
    }
  },

  getSelectedDegreeId(): number | undefined {
    if (typeof window === 'undefined') return undefined
    const value = localStorage.getItem(STORAGE_KEYS.SELECTED_DEGREE_ID)
    return value ? Number(value) : undefined
  },

  setSelectedDegreeId(id: number): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.SELECTED_DEGREE_ID, id.toString())
  },

  // Feedback Draft

  getFeedbackDraft(): FeedbackDraft | undefined {
    if (typeof window === 'undefined') return undefined
    const value = localStorage.getItem(STORAGE_KEYS.FEEDBACK_DRAFT)
    if (!value) return undefined

    try {
      return JSON.parse(value) as FeedbackDraft
    } catch {
      // Invalid JSON, clear it
      localStorage.removeItem(STORAGE_KEYS.FEEDBACK_DRAFT)
      return undefined
    }
  },

  setFeedbackDraft(draft: Omit<FeedbackDraft, 'timestamp'>): void {
    if (typeof window === 'undefined') return
    const draftWithTimestamp: FeedbackDraft = {
      ...draft,
      timestamp: Date.now()
    }
    localStorage.setItem(
      STORAGE_KEYS.FEEDBACK_DRAFT,
      JSON.stringify(draftWithTimestamp)
    )
  },

  clearFeedbackDraft(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK_DRAFT)
  }

  // TODO: Add other storage getters/setters as we migrate:
  // - getLastLoginEmail() / setLastLoginEmail()
  // - getAuthUser() / setAuthUser() / clearAuthUser()
  // - etc.
}
