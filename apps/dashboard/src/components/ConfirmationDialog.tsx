import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { useState } from 'react'

interface ConfirmationDialogProps {
  onConfirm: () => void | Promise<void>
  message: string
  title?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  children: (props: { open: () => void }) => React.ReactNode
}

export function ConfirmationDialog({
  onConfirm,
  message,
  title = 'Confirm Action',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  children
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch (error) {
      // Error handling is left to the onConfirm function
      console.error('Confirmation action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {children({ open: () => setOpen(true) })}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}