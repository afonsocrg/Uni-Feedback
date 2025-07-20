import { createContext, useContext, useState, ReactNode } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  LoginRequest,
  LoginResponse,
  User
} from '@uni-feedback/api-client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const AUTH_STORAGE_KEY = 'uni-feedback-user'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useLocalStorage<User | null>(AUTH_STORAGE_KEY, null)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!user

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
    refreshAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
