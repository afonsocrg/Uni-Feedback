import { useAuth } from '@hooks'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider
} from '@tanstack/react-query'
import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { useMemo } from 'react'

interface QueryClientProviderProps {
  children: React.ReactNode
}

const isUnauthorized = (error: unknown) =>
  error instanceof MeicFeedbackAPIError && error.status === 401

// A 4xx is the API's verdict, not a flake: retrying a 401 or 403 only delays
// the redirect to login (or the "no access" state) by another round trip.
const isClientError = (error: unknown) =>
  error instanceof MeicFeedbackAPIError &&
  error.status !== undefined &&
  error.status >= 400 &&
  error.status < 500

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  const { expireSession } = useAuth()

  const queryClient = useMemo(() => {
    // The API already tried a token refresh before answering 401 (see
    // `fetchWithRefresh`), so the session is gone. Dropping the cached user is
    // what makes `ProtectedRoute` send the student to login with `returnTo`.
    const onError = (error: unknown) => {
      if (isUnauthorized(error)) expireSession()
    }

    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          retry: (failureCount, error) =>
            !isClientError(error) && failureCount < 1,
          refetchOnWindowFocus: false
        }
      }
    })
  }, [expireSession])

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  )
}
