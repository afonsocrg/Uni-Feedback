import { useFaculties, useFacultyDegrees } from '@hooks'
import { slugToFaculty, slugToDegree } from '@utils'
import { useParams } from 'react-router-dom'
import type { Faculty, Degree } from '@services/meicFeedbackAPI'

interface UseUrlNavigationResult {
  faculty: Faculty | null
  degree: Degree | null
  isLoading: boolean
  error: 'faculty-not-found' | 'degree-not-found' | null
}

/**
 * Custom hook that handles URL-based faculty/degree lookup with proper error handling
 * and loading states. Consolidates the common pattern used across multiple components.
 */
export function useUrlNavigation(): UseUrlNavigationResult {
  const { faculty: facultyParam, degree: degreeParam } = useParams()
  
  const { data: faculties, isLoading: facultiesLoading } = useFaculties()
  
  // Find faculty by URL slug
  const faculty = facultyParam && faculties ? slugToFaculty(facultyParam, faculties) : null
  
  const { data: degrees, isLoading: degreesLoading } = useFacultyDegrees(faculty?.id ?? null)
  
  // Find degree by URL slug
  const degree = degreeParam && degrees ? slugToDegree(degreeParam, degrees) : null
  
  // Determine error state
  let error: UseUrlNavigationResult['error'] = null
  if (!facultiesLoading && facultyParam && !faculty) {
    error = 'faculty-not-found'
  } else if (!degreesLoading && degreeParam && faculty && !degree) {
    error = 'degree-not-found'
  }
  
  return {
    faculty,
    degree,
    isLoading: facultiesLoading || degreesLoading,
    error
  }
}