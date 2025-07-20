import { Toaster } from 'sonner'
import {
  AuthProvider,
  QueryClientProvider,
  AuthRefreshProvider
} from '@providers'

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
