import { useContext } from 'react'
import { AuthContext, type AuthContextType, type AuthUser } from '../context/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook for components that require authentication (e.g., protected routes with AuthGuard).
 * Returns the same context as useAuth but with a guaranteed non-null user.
 *
 * @throws Error if user is null (which should never happen in AuthGuard-protected routes)
 */
export function useRequiredAuth(): Omit<AuthContextType, 'user'> & { user: AuthUser } {
  const context = useAuth()

  if (!context.user) {
    throw new Error('useRequiredAuth: user is null. This hook should only be used in AuthGuard-protected routes.')
  }

  return context as Omit<AuthContextType, 'user'> & { user: AuthUser }
}
