import { useLocalStorage } from '@uidotdev/usehooks'
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  LoginRequest,
  LoginResponse,
  MeicFeedbackAPIError,
  User
} from '@uni-feedback/api-client'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext, AuthContextType } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

const AUTH_STORAGE_KEY = 'uni-feedback-user'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useLocalStorage<User | null>(AUTH_STORAGE_KEY, null)
  // A cached user is a claim, not a session. Until the API confirms it on
  // load, the guard shows "Loading..." rather than a page whose every request
  // is about to 401. Starts true only when there is something to verify.
  const [isLoading, setIsLoading] = useState(() => user !== null)
  const verified = useRef(false)

  const isAuthenticated = !!user

  const expireSession = useCallback(() => {
    setUser(null)
  }, [setUser])

  useEffect(() => {
    // Once per page load, guarded by a ref rather than an effect cleanup:
    // StrictMode runs effects twice in dev, and a cleanup-based cancel would
    // leave the second run with nothing to do and `isLoading` stuck on.
    if (verified.current) return
    verified.current = true
    if (user === null) return

    // Success keeps the cached user: the point is the verdict, not the payload.
    apiRefreshToken()
      .catch((error: unknown) => {
        // Only a 401 means the session is gone. A network error or a 5xx says
        // nothing about the session, and logging out on it would bounce a user
        // to login every time the API hiccups.
        if (error instanceof MeicFeedbackAPIError && error.status === 401) {
          setUser(null)
        }
      })
      .finally(() => setIsLoading(false))
    // The cached user is read on mount; later changes to it come from
    // login/logout, which already know whether the session is real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true)
    try {
      const response: LoginResponse = await apiLogin(credentials)
      setUser(response.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout failed:', error)
      // Continue with local logout even if API call fails
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  const refreshAuth = async (): Promise<void> => {
    try {
      const response: LoginResponse = await apiRefreshToken()
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
    login,
    logout,
    refreshAuth,
    expireSession,
    setUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
