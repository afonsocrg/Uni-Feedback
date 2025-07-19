import { getCourseGroups } from '@services/meicFeedbackAPI'
import { useQuery } from '@tanstack/react-query'
import { infrequentDataConfig } from './config'

export function useDegreeCourseGroups(degreeId: number | null = null) {
  return useQuery({
    ...infrequentDataConfig,
    queryKey: ['degrees', degreeId, 'courseGroups'],
    queryFn: () => (degreeId ? getCourseGroups(degreeId) : Promise.resolve([]))
  })
}
