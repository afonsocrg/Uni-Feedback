import {
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  getProfile,
  type ProfileResponse
} from '@uni-feedback/api-client'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLocalStorage } from '~/hooks'
import { STORAGE_KEYS } from '~/utils/constants'
import {
  AuthContext,
  type AuthContextType,
  type AuthUser
} from '../context/AuthContext'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useLocalStorage<AuthUser | null>(
    STORAGE_KEYS.AUTH_USER,
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Track previous pathname to detect actual navigation changes
  const prevPathnameRef = useRef(location.pathname)

  // Fetch user from session on mount (client-side only)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response: ProfileResponse = await getProfile()
        setUser(response.user)
      } catch (error) {
        // Not logged in or session expired
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [setUser])

  // Reset isLoggingOut flag when location actually changes (not just on re-render)
  useEffect(() => {
    if (isLoggingOut && prevPathnameRef.current !== location.pathname) {
      setIsLoggingOut(false)
    }
    prevPathnameRef.current = location.pathname
  }, [location.pathname, isLoggingOut])

  const isAuthenticated = !!user
  console.log({ location })

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    setIsLoggingOut(true)

    // Check if currently on a protected route (within auth-layout)
    // Protected routes: /profile, /feedback/:id/edit
    // Public routes that should NOT redirect: /feedback/new
    const isOnProtectedRoute =
      location.pathname === '/profile' ||
      location.pathname.match(/^\/feedback\/\d+\/edit\/?.*$/) !== null

    console.log({ isOnProtectedRoute })

    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setIsLoading(false)

      // Navigate away from protected routes after clearing auth state
      if (isOnProtectedRoute) {
        navigate('/')
      }

      // isLoggingOut will be reset by the useEffect watching location.pathname
    }
  }

  const refreshAuth = async (): Promise<void> => {
    try {
      const response = await apiRefreshToken()
      setUser(response.user)
    } catch (error) {
      console.error('Token refresh failed:', error)
      setUser(null)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isLoggingOut,
    logout,
    refreshAuth,
    setUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
