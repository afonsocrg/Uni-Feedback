import {
  getFaculties,
  getFacultyDetails,
  getFacultyDegrees
} from '@services/meicFeedbackAPI'
import { useQuery } from '@tanstack/react-query'
import { infrequentDataConfig } from './config'

export function useFaculties() {
  return useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties(),
    ...infrequentDataConfig
  })
}

export function useFacultyDetails(facultyId: number | null) {
  return useQuery({
    queryKey: ['faculties', facultyId],
    queryFn: () => (facultyId ? getFacultyDetails(facultyId) : null),
    enabled: !!facultyId,
    ...infrequentDataConfig
  })
}

export function useFacultyDegrees(facultyId: number | null) {
  return useQuery({
    queryKey: ['faculties', facultyId, 'degrees'],
    queryFn: () => {
      if (!facultyId) {
        return Promise.resolve([])
      }
      return getFacultyDegrees(facultyId)
    },
    ...infrequentDataConfig
  })
}
