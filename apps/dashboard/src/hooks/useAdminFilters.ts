import { useLocalStorage } from '@uidotdev/usehooks'
import { STORAGE_KEYS } from '../utils'

export interface AdminFilters {
  facultyId: number | null
  degreeId: number | null
  courseId: number | null
}

export interface UseAdminFiltersReturn extends AdminFilters {
  setFaculty: (facultyId: number | null) => void
  setDegree: (degreeId: number | null) => void
  setCourse: (courseId: number | null) => void
  resetAll: () => void
}

const DEFAULT_FILTERS: AdminFilters = {
  facultyId: null,
  degreeId: null,
  courseId: null
}

export function useAdminFilters(): UseAdminFiltersReturn {
  const [filters, setFilters] = useLocalStorage<AdminFilters>(
    STORAGE_KEYS.ADMIN_FILTERS,
    DEFAULT_FILTERS
  )

  const setFaculty = (facultyId: number | null) => {
    setFilters({
      facultyId,
      degreeId: null,
      courseId: null
    })
  }

  const setDegree = (degreeId: number | null) => {
    setFilters({
      ...filters,
      degreeId,
      courseId: null
    })
  }

  const setCourse = (courseId: number | null) => {
    setFilters({
      ...filters,
      courseId
    })
  }

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return {
    facultyId: filters.facultyId,
    degreeId: filters.degreeId,
    courseId: filters.courseId,
    setFaculty,
    setDegree,
    setCourse,
    resetAll
  }
}
