import { useQuery } from '@tanstack/react-query'
import { getUserFeedback, getUserStats } from '@uni-feedback/api-client'

export function useProfileStats() {
  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => getUserStats(),
    staleTime: 0,
    refetchOnMount: 'always'
  })
}

export function useProfileFeedback() {
  return useQuery({
    queryKey: ['user', 'feedback'],
    queryFn: () => getUserFeedback(),
    staleTime: 0,
    refetchOnMount: 'always'
  })
}
