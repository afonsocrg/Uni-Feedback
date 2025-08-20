import { createContext } from 'react'

export type SortOption = 'rating' | 'alphabetical' | 'reviews' | 'workload'

export interface NavigationState {
  // Faculty/Degree selection
  selectedFacultyId: number | null
  selectedDegreeId: number | null
  
  // Course filters
  selectedTerm: string | null
  selectedCourseGroupId: number | null
  mandatoryExamFilter: boolean | null
  sortBy: SortOption
}

export interface NavigationActions {
  // Smart setters that auto-clear dependent state
  setFacultyId: (facultyId: number | null) => void // clears degree + all course filters
  setDegreeId: (degreeId: number | null) => void   // clears course filters only
  
  // Individual course filter setters
  setSelectedTerm: (term: string | null) => void
  setSelectedCourseGroupId: (courseGroupId: number | null) => void
  setMandatoryExamFilter: (filter: boolean | null) => void
  setSortBy: (sortBy: SortOption) => void
}

export interface NavigationContextType extends NavigationState, NavigationActions {}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined)