import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { userPreferences } from '~/utils'

export interface PreselectedFacultyDegree {
  facultySlug?: string
  degreeSlug?: string
  isLoading: boolean
}

export function usePreselectedFacultyDegree(): PreselectedFacultyDegree {
  const [data, setData] = useState<PreselectedFacultyDegree>({
    isLoading: true
  })
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') {
      setData({ isLoading: false })
      return
    }

    // Priority 1: Extract from current URL path
    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 1) {
      const facultySlug = pathSegments[0]
      const degreeSlug = pathSegments.length >= 2 ? pathSegments[1] : undefined

      setData({
        facultySlug,
        degreeSlug,
        isLoading: false
      })
      return
    }

    // Priority 2: Fallback to localStorage preferences
    const prefs = userPreferences.get()
    setData({
      facultySlug: prefs.lastSelectedFacultySlug,
      degreeSlug: prefs.lastSelectedDegreeSlug,
      isLoading: false
    })
  }, [location.pathname])

  return data
}
