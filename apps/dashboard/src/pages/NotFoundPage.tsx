import { Button } from '@uni-feedback/ui'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button onClick={() => navigate('/')} size="lg">
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}