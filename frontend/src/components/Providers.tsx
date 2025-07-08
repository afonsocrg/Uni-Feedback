import { Layout } from '@components'
import { AppProvider } from '@context'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { Toaster } from '@ui'
import { PostHogProvider } from 'posthog-js/react'
import { BrowserRouter as Router } from 'react-router-dom'

const posthogProps = {
  apiKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
  options: {
    api_host: 'https://eu.i.posthog.com',
    debug: false
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false
    }
  }
})

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage
})
persistQueryClient({
  queryClient,
  persister: localStoragePersister
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MaybePostHogProvider>
      <QueryClientProvider client={queryClient}>
        {/* AppProvider needs to be inside Router because it uses useSearchParams */}
        <Router future={{ v7_startTransition: true }}>
          <AppProvider>
            <Layout>
              <ReactQueryDevtools initialIsOpen={false} />
              <Toaster position="top-right" />
              {children}
            </Layout>
          </AppProvider>
        </Router>
      </QueryClientProvider>
    </MaybePostHogProvider>
  )
}

function MaybePostHogProvider({ children }: { children: React.ReactNode }) {
  if (import.meta.env.MODE === 'development') {
    return children
  }
  return <PostHogProvider {...posthogProps}>{children}</PostHogProvider>
}
