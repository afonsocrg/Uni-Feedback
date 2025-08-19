import { NavigationContext, type NavigationContextType } from '@/context/NavigationContext'
import { useContext } from 'react'

export function useNavigationState(): NavigationContextType {
  const context = useContext(NavigationContext)
  
  if (context === undefined) {
    throw new Error('useNavigationState must be used within a NavigationProvider')
  }
  
  return context
}