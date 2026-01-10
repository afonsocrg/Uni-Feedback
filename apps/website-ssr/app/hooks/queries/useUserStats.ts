import { useQuery } from '@tanstack/react-query'
import { getUserFeedback, getUserStats } from '@uni-feedback/api-client'

export function useProfileStats() {
  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => getUserStats()
  })
}

export function useProfileFeedback() {
  return useQuery({
    queryKey: ['user', 'feedback'],
    queryFn: () => getUserFeedback()
  })
}
