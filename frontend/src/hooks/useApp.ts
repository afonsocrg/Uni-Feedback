import { AppContext, type AppContextType } from '@context'
import { useContext } from 'react'

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error(
      'useApp hook is deprecated in the URL-driven navigation architecture. ' +
      'Use useUrlNavigation hook instead for faculty/degree data from URL parameters.'
    )
  }
  return context
}
