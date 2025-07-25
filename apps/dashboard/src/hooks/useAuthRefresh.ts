import { useAuth } from '@hooks'
import { useEffect, useRef } from 'react'

const REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes (before 15min token expires)

/**
 * Hook that automatically refreshes auth tokens in the background
 * Only runs when user is authenticated
 */
export function useAuthRefresh() {
  const { isAuthenticated, refreshAuth } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Set up periodic token refresh
    intervalRef.current = setInterval(async () => {
      try {
        await refreshAuth()
      } catch (error) {
        console.error('Background token refresh failed:', error)
        // Auth context will handle logout if refresh fails
      }
    }, REFRESH_INTERVAL)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAuthenticated, refreshAuth])
}
