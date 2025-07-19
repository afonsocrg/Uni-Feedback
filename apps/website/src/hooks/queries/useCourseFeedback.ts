import { getCourseFeedback } from '@services/meicFeedbackAPI'
import { useQuery } from '@tanstack/react-query'
import { frequentDataConfig } from './config'

export function useCourseFeedback(courseId: number) {
  return useQuery({
    ...frequentDataConfig,
    queryKey: ['course', courseId, 'feedback'],
    queryFn: () => getCourseFeedback(courseId)
  })
}
