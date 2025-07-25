import { useAuthRefresh } from '@hooks/useAuthRefresh'

interface AuthRefreshProviderProps {
  children: React.ReactNode
}

export function AuthRefreshProvider({ children }: AuthRefreshProviderProps) {
  useAuthRefresh()
  return <>{children}</>
}
