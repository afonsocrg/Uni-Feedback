import {
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  getProfile,
  type ProfileResponse
} from '@uni-feedback/api-client'
import React, { useEffect, useState } from 'react'
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
  const [user, setUser] = useLocalStorage<AuthUser | null>(
    STORAGE_KEYS.AUTH_USER,
    null
  )
  const [isLoading, setIsLoading] = useState(true)

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

  const isAuthenticated = !!user

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
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
    logout,
    refreshAuth,
    setUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
