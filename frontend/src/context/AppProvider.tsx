import { ReactNode } from 'react'
import { AppContext } from './AppContext'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  // Simplified provider - URL-driven architecture doesn't need complex state management
  // Legacy AppContext maintained for components that still use it (like CourseExplorer)
  return (
    <AppContext.Provider
      value={{
        selectedFacultyId: null,
        setSelectedFacultyId: () => {},
        selectedFaculty: null,
        selectedDegreeId: null,
        setSelectedDegreeId: () => {},
        selectedDegree: null,
        isDegreeSelectorOpen: false,
        setIsDegreeSelectorOpen: () => {}
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
