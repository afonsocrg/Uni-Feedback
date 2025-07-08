import { STORAGE_KEYS } from '@utils'
import { useMemo } from 'react'
import { useFaculties, useFacultyDegrees } from '.'

/**
 * Hook to get the currently selected faculty and degree from localStorage
 * Used as a fallback when URL-based navigation is not available (e.g., on feedback form)
 */
export function useSelectedFacultyDegree() {
  // Get stored IDs from localStorage
  const storedFacultyId = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_FACULTY_ID)
    return stored ? parseInt(stored, 10) : null
  }, [])

  const storedDegreeId = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_DEGREE_ID)
    return stored ? parseInt(stored, 10) : null
  }, [])

  // Fetch faculty data
  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties()

  // Fetch degree data for the selected faculty
  const { data: degrees, isLoading: isLoadingDegrees } =
    useFacultyDegrees(storedFacultyId)

  // Find the selected faculty and degree
  const selectedFaculty = useMemo(() => {
    if (!faculties || !storedFacultyId) return null
    return faculties.find((f) => f.id === storedFacultyId) || null
  }, [faculties, storedFacultyId])

  const selectedDegree = useMemo(() => {
    if (!degrees || !storedDegreeId) return null
    return degrees.find((d) => d.id === storedDegreeId) || null
  }, [degrees, storedDegreeId])

  return {
    faculty: selectedFaculty,
    degree: selectedDegree,
    isLoading: isLoadingFaculties || isLoadingDegrees,
    error: null // Could be enhanced with proper error handling
  }
}
