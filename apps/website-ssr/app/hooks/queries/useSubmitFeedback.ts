import { useMutation } from '@tanstack/react-query'
import { submitFeedback } from '@uni-feedback/api-client'

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback
  })
}
