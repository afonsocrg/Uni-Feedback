import { getCourse } from '@services/meicFeedbackAPI'
import { useQuery } from '@tanstack/react-query'
import { infrequentDataConfig } from './config'

export function useCourseDetails(courseId: number) {
  return useQuery({
    ...infrequentDataConfig,
    queryKey: ['courseDetails', courseId],
    queryFn: () => getCourse(courseId)
  })
}
