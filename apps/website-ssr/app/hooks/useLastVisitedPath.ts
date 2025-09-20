import { useState, useEffect } from 'react'
import { userPreferences } from '../utils/userPreferences'

export function useLastVisitedPath() {
  const [lastVisitedPath, setLastVisitedPath] = useState<string>('/')

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const path = userPreferences.getLastVisitedPath()
      setLastVisitedPath(path)
    }
  }, [])

  return lastVisitedPath
}