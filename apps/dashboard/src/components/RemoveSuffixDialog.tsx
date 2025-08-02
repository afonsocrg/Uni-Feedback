import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'

interface RemoveSuffixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suffix: string
  onConfirm: () => void
  isLoading?: boolean
}

export function RemoveSuffixDialog({
  open,
  onOpenChange,
  suffix,
  onConfirm,
  isLoading = false
}: RemoveSuffixDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Email Suffix</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove "@{suffix}" from this faculty's
            email suffixes? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}