import { LoginRequest, User } from '@uni-feedback/api-client'
import { createContext } from 'react'

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
