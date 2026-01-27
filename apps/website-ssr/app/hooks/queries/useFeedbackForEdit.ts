import { useQuery } from '@tanstack/react-query'
import { getFeedbackForEdit } from '@uni-feedback/api-client'

export function useFeedbackForEdit(feedbackId: number | null) {
  return useQuery({
    queryKey: ['feedback', feedbackId, 'edit'],
    queryFn: () => {
      if (!feedbackId) {
        throw new Error('Feedback ID is required')
      }
      return getFeedbackForEdit(feedbackId)
    },
    enabled: !!feedbackId,
    staleTime: 0,
    refetchOnMount: 'always'
  })
}
