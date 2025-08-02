import { Button } from '@uni-feedback/ui'

interface QueryErrorProps {
  entityType: string
  error: Error | unknown
  onRetry: () => void
}

export function QueryError({ entityType, error, onRetry }: QueryErrorProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-lg font-semibold text-destructive">
          Failed to load {entityType} details
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
        <Button onClick={onRetry} className="mt-4">
          Try Again
        </Button>
      </div>
    </div>
  )
}
