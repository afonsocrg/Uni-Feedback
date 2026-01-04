import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider
} from '@tanstack/react-query'
import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { useMemo } from 'react'
import { useAuth } from '@hooks'

interface QueryClientProviderProps {
  children: React.ReactNode
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  const { logout } = useAuth()

  const queryClient = useMemo(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          // Handle 401 errors globally by logging out
          if (error instanceof MeicFeedbackAPIError && error.status === 401) {
            logout()
          }
        }
      }),
      mutationCache: new MutationCache({
        onError: (error) => {
          // Handle 401 errors globally by logging out
          if (error instanceof MeicFeedbackAPIError && error.status === 401) {
            logout()
          }
        }
      }),
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false
        }
      }
    })
  }, [logout])

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  )
}
