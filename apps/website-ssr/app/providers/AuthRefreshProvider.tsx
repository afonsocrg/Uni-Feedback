import React, { useEffect, useRef } from 'react'
import { useAuth } from '~/hooks'

const REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes (before 15min token expires)

interface AuthRefreshProviderProps {
  children: React.ReactNode
}

export function AuthRefreshProvider({ children }: AuthRefreshProviderProps) {
  const { isAuthenticated, refreshAuth } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(async () => {
      try {
        await refreshAuth()
      } catch (error) {
        console.error('Background token refresh failed:', error)
      }
    }, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAuthenticated, refreshAuth])

  return <>{children}</>
}
