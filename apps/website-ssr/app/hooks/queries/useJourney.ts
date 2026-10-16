import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addJourneyDegree,
  dismissInferredDegree,
  getJourney,
  type JourneyDegreeInput,
  removeJourneyDegree,
  updateJourneyDegree
} from '@uni-feedback/api-client'

export const JOURNEY_QUERY_KEY = ['user', 'journey'] as const

/**
 * "O meu percurso". Shared by the profile tab, the chat prompt and the account
 * menu dot, so one fetch serves all three and a save in one updates the others.
 */
export function useJourney({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: JOURNEY_QUERY_KEY,
    queryFn: () => getJourney(),
    enabled,
    // The query cache is persisted to localStorage and defaults to never
    // refetching on mount, so without these a journey cached before a change
    // made elsewhere (another tab, the chat prompt) would be served forever.
    // Same as the other per-user queries in useUserStats.
    staleTime: 0,
    refetchOnMount: 'always'
  })
}

function useJourneyMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: JOURNEY_QUERY_KEY })
  })
}

export function useAddJourneyDegree() {
  return useJourneyMutation((input: JourneyDegreeInput) =>
    addJourneyDegree(input)
  )
}

export function useUpdateJourneyDegree() {
  return useJourneyMutation(
    ({ id, input }: { id: number; input: JourneyDegreeInput }) =>
      updateJourneyDegree(id, input)
  )
}

export function useRemoveJourneyDegree() {
  return useJourneyMutation((id: number) => removeJourneyDegree(id))
}

export function useDismissInferredDegree() {
  return useJourneyMutation(() => dismissInferredDegree())
}
