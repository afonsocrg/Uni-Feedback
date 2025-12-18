/**
 * Utility functions for storing and retrieving filters with context validation
 */

import { STORAGE_KEYS } from './constants'

// Types
export interface DegreeFilters {
  facultySlug: string
  filters: {
    degreeType: string | null
  }
}

export interface CourseFilters {
  facultySlug: string
  degreeSlug: string
  filters: {
    curriculumYear: number | null
    term: string | null
    courseGroupId: number | null
    hasMandatoryExam: boolean | null
    sortBy: string
  }
}

/**
 * Save degree filters to localStorage
 */
export function saveDegreeFilters(
  facultySlug: string,
  filters: DegreeFilters['filters']
): void {
  if (typeof window === 'undefined') return

  try {
    const data: DegreeFilters = {
      facultySlug,
      filters
    }
    localStorage.setItem(STORAGE_KEYS.DEGREE_FILTERS, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save degree filters:', error)
  }
}

/**
 * Load degree filters from localStorage
 * Returns null if no filters exist or if faculty doesn't match
 */
export function loadDegreeFilters(
  facultySlug: string
): DegreeFilters['filters'] | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DEGREE_FILTERS)
    if (!stored) return null

    const data: DegreeFilters = JSON.parse(stored)

    // Only return filters if faculty matches
    if (data.facultySlug !== facultySlug) return null

    return data.filters
  } catch (error) {
    console.warn('Failed to load degree filters:', error)
    return null
  }
}

/**
 * Save course filters to localStorage
 */
export function saveCourseFilters(
  facultySlug: string,
  degreeSlug: string,
  filters: CourseFilters['filters']
): void {
  if (typeof window === 'undefined') return

  try {
    const data: CourseFilters = {
      facultySlug,
      degreeSlug,
      filters
    }
    localStorage.setItem(STORAGE_KEYS.COURSE_FILTERS, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save course filters:', error)
  }
}

/**
 * Load course filters from localStorage
 * Returns null if no filters exist or if faculty/degree doesn't match
 */
export function loadCourseFilters(
  facultySlug: string,
  degreeSlug: string
): CourseFilters['filters'] | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COURSE_FILTERS)
    if (!stored) return null

    const data: CourseFilters = JSON.parse(stored)

    // Only return filters if both faculty and degree match
    if (data.facultySlug !== facultySlug || data.degreeSlug !== degreeSlug) {
      return null
    }

    return data.filters
  } catch (error) {
    console.warn('Failed to load course filters:', error)
    return null
  }
}
