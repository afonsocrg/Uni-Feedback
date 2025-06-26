import { DegreeSelector } from '@components'
import { useFaculties, useFacultyDegrees } from '@hooks'
import { useLocalStorage } from '@uidotdev/usehooks'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppContext } from './AppContext'

interface AppProviderProps {
  children: ReactNode
}

const STORAGE_KEYS = {
  SELECTED_FACULTY_ID: '__istFeedback_selectedFacultyId',
  SELECTED_DEGREE_ID: '__istFeedback_selectedDegreeId'
}

export function AppProvider({ children }: AppProviderProps) {
  const [searchParams] = useSearchParams()

  const [selectedFacultyId, setSelectedFacultyId] = useLocalStorage<
    number | null
  >(STORAGE_KEYS.SELECTED_FACULTY_ID, null)
  const [selectedDegreeId, setSelectedDegreeId] = useLocalStorage<
    number | null
  >(STORAGE_KEYS.SELECTED_DEGREE_ID, null)

  const { data: faculties } = useFaculties()
  const { data: degrees } = useFacultyDegrees(selectedFacultyId)
  const [isDegreeSelectorOpen, setIsDegreeSelectorOpen] = useState(false)

  const selectedFaculty = useMemo(() => {
    if (!faculties || !selectedFacultyId) return null
    return faculties.find((faculty) => faculty.id === selectedFacultyId) || null
  }, [faculties, selectedFacultyId])

  const selectedDegree = useMemo(() => {
    if (!degrees) return null
    return degrees.find((degree) => degree.id === selectedDegreeId) || null
  }, [degrees, selectedDegreeId])

  // Clear degree selection when faculty changes
  useEffect(() => {
    if (selectedFacultyId && selectedDegreeId && selectedDegree) {
      // Check if the selected degree belongs to the selected faculty
      // Note: We'll need to update this once we have faculty info in degrees
      // For now, just clear degree when faculty changes
      const prevFacultyId = localStorage.getItem('__prevFacultyId')
      if (prevFacultyId && parseInt(prevFacultyId) !== selectedFacultyId) {
        setSelectedDegreeId(null)
      }
      localStorage.setItem('__prevFacultyId', selectedFacultyId.toString())
    }
  }, [selectedFacultyId, selectedDegreeId, selectedDegree, setSelectedDegreeId])

  const paramsDegreeAcronym = searchParams.get('degree')

  useEffect(() => {
    if (!selectedDegreeId && paramsDegreeAcronym && degrees) {
      const matchingDegree = degrees.find(
        (degree) =>
          degree.acronym.toLowerCase() === paramsDegreeAcronym.toLowerCase()
      )
      if (matchingDegree) {
        setSelectedDegreeId(matchingDegree.id)
      }
    }
  }, [selectedDegreeId, paramsDegreeAcronym, setSelectedDegreeId, degrees])

  return (
    <AppContext.Provider
      value={{
        selectedFacultyId,
        setSelectedFacultyId,
        selectedFaculty,
        selectedDegreeId,
        setSelectedDegreeId,
        selectedDegree,
        isDegreeSelectorOpen,
        setIsDegreeSelectorOpen
      }}
    >
      <DegreeSelector
        isOpen={isDegreeSelectorOpen}
        onClose={() => setIsDegreeSelectorOpen(false)}
      />
      {children}
    </AppContext.Provider>
  )
}
