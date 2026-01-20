import {
  Button,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'

export interface ErrorStageProps {
  error: string
  onTryAgain: () => void
  onCancel?: () => void
}
export function ErrorStage({ error, onTryAgain, onCancel }: ErrorStageProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Verification failed</DialogTitle>
        <DialogDescription>{error}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col space-y-2">
        <Button onClick={onTryAgain} className="w-full">
          Try again
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </div>
    </>
  )
}
