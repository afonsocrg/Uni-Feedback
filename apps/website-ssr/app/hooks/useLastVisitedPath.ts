import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { userPreferences } from '~/utils'

export function useLastVisitedPath() {
  const [lastVisitedPath, setLastVisitedPath] = useState<string>('/')
  const location = useLocation()

  useEffect(() => {
    // Re-read from localStorage whenever location changes
    // This ensures the hook stays in sync when navigating between routes
    if (typeof window !== 'undefined') {
      const path = userPreferences.getLastVisitedPath()
      setLastVisitedPath(path)
    }
  }, [location.pathname])

  return lastVisitedPath
}
