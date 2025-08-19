import { STORAGE_KEYS } from '@/utils'
import { useLocalStorage } from '@uidotdev/usehooks'
import { ReactNode, useCallback } from 'react'
import {
  NavigationContext,
  type NavigationContextType,
  type SortOption
} from './NavigationContext'

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  // localStorage-backed state
  const [selectedFacultyId, setSelectedFacultyIdStorage] = useLocalStorage<
    number | null
  >(STORAGE_KEYS.SELECTED_FACULTY_ID, null)

  const [selectedDegreeId, setSelectedDegreeIdStorage] = useLocalStorage<
    number | null
  >(STORAGE_KEYS.SELECTED_DEGREE_ID, null)

  const [selectedTerm, setSelectedTermStorage] = useLocalStorage<string | null>(
    STORAGE_KEYS.FILTER_TERM,
    null
  )

  const [selectedCourseGroupId, setSelectedCourseGroupIdStorage] =
    useLocalStorage<number | null>(STORAGE_KEYS.FILTER_COURSE_GROUP_ID, null)

  const [mandatoryExamFilter, setMandatoryExamFilterStorage] = useLocalStorage<
    boolean | null
  >(STORAGE_KEYS.FILTER_HAS_MANDATORY_EXAM, null)

  const [sortBy, setSortByStorage] = useLocalStorage<SortOption>(
    STORAGE_KEYS.FILTER_SORT_BY,
    'reviews'
  )

  // Smart setter: changing faculty clears degree + all course filters
  const setFacultyId = useCallback(
    (facultyId: number | null) => {
      setSelectedFacultyIdStorage(facultyId)
      setSelectedDegreeIdStorage(null)
      setSelectedTermStorage(null)
      setSelectedCourseGroupIdStorage(null)
    },
    [
      setSelectedFacultyIdStorage,
      setSelectedDegreeIdStorage,
      setSelectedTermStorage,
      setSelectedCourseGroupIdStorage
    ]
  )

  // Smart setter: changing degree clears course filters only
  const setDegreeId = useCallback(
    (degreeId: number | null) => {
      setSelectedDegreeIdStorage(degreeId)
      setSelectedCourseGroupIdStorage(null)
    },
    [setSelectedDegreeIdStorage, setSelectedCourseGroupIdStorage]
  )

  const contextValue: NavigationContextType = {
    // State
    selectedFacultyId,
    selectedDegreeId,
    selectedTerm,
    selectedCourseGroupId,
    mandatoryExamFilter,
    sortBy,

    // Smart setters
    setFacultyId,
    setDegreeId,

    // Individual course filter setters
    setSelectedTerm: setSelectedTermStorage,
    setSelectedCourseGroupId: setSelectedCourseGroupIdStorage,
    setMandatoryExamFilter: setMandatoryExamFilterStorage,
    setSortBy: setSortByStorage
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}
