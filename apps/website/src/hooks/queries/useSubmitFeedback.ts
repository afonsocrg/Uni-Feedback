import { GiveReviewFormValues } from '@/pages/GiveReview'
import { submitFeedback } from '@/services/meicFeedbackAPI'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useSubmitFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: GiveReviewFormValues) => submitFeedback(values),
    onSuccess: async (_, variables) => {
      // Invalidate and immediately refetch course details
      await queryClient.invalidateQueries({
        queryKey: ['courseDetails', variables.courseId],
        refetchType: 'all'
      })

      // Invalidate and immediately refetch course feedback
      await queryClient.invalidateQueries({
        queryKey: ['course', variables.courseId, 'feedback'],
        refetchType: 'all'
      })

      // Invalidate and immediately refetch degree courses list
      if (variables.degreeId) {
        await queryClient.invalidateQueries({
          queryKey: ['degrees', variables.degreeId, 'courses'],
          refetchType: 'all'
        })
      }
    }
  })
}
