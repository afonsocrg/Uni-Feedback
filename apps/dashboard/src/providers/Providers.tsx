import { Toaster } from 'sonner'
import { AuthProvider } from './AuthProvider'
import { AuthRefreshProvider } from './AuthRefreshProvider'
import { QueryClientProvider } from './QueryClientProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <AuthRefreshProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthRefreshProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
