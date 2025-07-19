import { getDegreeCourses } from '@services/meicFeedbackAPI'
import { useQuery } from '@tanstack/react-query'
import { infrequentDataConfig } from './config'

export function useDegreeCourses(degreeId: number | null = null) {
  const options = {
    ...infrequentDataConfig,
    queryKey: ['degrees', degreeId, 'courses'],
    queryFn: () => (degreeId ? getDegreeCourses(degreeId) : Promise.resolve([]))
  }
  return useQuery(options)
}
