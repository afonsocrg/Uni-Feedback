import React from 'react'

export interface AuthUser {
  id: number
  email: string
  username: string
  role: string
  referralCode: string
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const AuthContext = React.createContext<AuthContextType | undefined>(
  undefined
)
