import { ReactNode } from 'react'
import { AppContext } from './AppContext'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  // Minimal provider for URL-driven architecture
  // Only keeping the structure for any remaining legacy components
  // All state is now managed through URL parameters
  return (
    <AppContext.Provider value={undefined}>
      {children}
    </AppContext.Provider>
  )
}
