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
    isMandatory: boolean | null
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

/**
 * Save the faculty picker's selected university, or clear it when null.
 *
 * Unlike the two above this is a bare slug: the picker is a single global page,
 * so there is no context to store alongside the selection and validate on read.
 * Validating that the slug still names a university we list is the caller's job
 * (see `loadBrowseUniversityFilter`).
 */
export function saveBrowseUniversityFilter(slug: string | null): void {
  if (typeof window === 'undefined') return

  try {
    if (slug === null) {
      localStorage.removeItem(STORAGE_KEYS.BROWSE_UNIVERSITY_SLUG)
    } else {
      localStorage.setItem(STORAGE_KEYS.BROWSE_UNIVERSITY_SLUG, slug)
    }
  } catch (error) {
    console.warn('Failed to save browse university filter:', error)
  }
}

/**
 * Load the faculty picker's selected university.
 *
 * `availableSlugs` is the set currently on the page, and a stored slug outside
 * it is dropped: a university we stopped listing (or renamed) would otherwise
 * restore a filter with no chip left to undo it, leaving the student on an
 * empty page with no way back.
 */
export function loadBrowseUniversityFilter(
  availableSlugs: string[]
): string | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BROWSE_UNIVERSITY_SLUG)
    if (!stored) return null

    return availableSlugs.includes(stored) ? stored : null
  } catch (error) {
    console.warn('Failed to load browse university filter:', error)
    return null
  }
}
