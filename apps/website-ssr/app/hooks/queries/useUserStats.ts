import { useQuery } from '@tanstack/react-query'
import {
  getProfile,
  getUserFeedback,
  getUserStats
} from '@uni-feedback/api-client'

export function useProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => getProfile(),
    staleTime: 0,
    refetchOnMount: 'always'
  })
}

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
