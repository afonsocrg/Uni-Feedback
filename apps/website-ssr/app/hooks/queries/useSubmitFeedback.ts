import { submitFeedback } from '@uni-feedback/api-client'
import { useMutation } from '@tanstack/react-query'

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback
  })
}
