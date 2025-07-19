import { type Degree, type Faculty } from '@services/meicFeedbackAPI'
import { createContext } from 'react'

export interface AppContextType {
  // The context stores both selectedId and selectedObject
  // selectedId is used as the source of truth because:
  // 1. It persists across page loads via localStorage
  // 2. It's available immediately, while selectedObject may be null
  //    until the object data is loaded from the API

  // Faculty selection
  selectedFacultyId: number | null
  setSelectedFacultyId: (facultyId: number | null) => void
  selectedFaculty: Faculty | null

  // Degree selection
  selectedDegreeId: number | null
  setSelectedDegreeId: (degreeId: number | null) => void
  selectedDegree: Degree | null
  isDegreeSelectorOpen: boolean
  setIsDegreeSelectorOpen: (isOpen: boolean) => void
}

export const AppContext = createContext<AppContextType | undefined>(undefined)
