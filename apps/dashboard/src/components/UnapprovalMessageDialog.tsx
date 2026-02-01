import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea
} from '@uni-feedback/ui'
import { useEffect, useState } from 'react'

interface UnapprovalMessageDialogProps {
  open: boolean
  onConfirm: (message: string) => void | Promise<void>
  onCancel: () => void
  courseName?: string
  feedback: { id: number; comment?: string | null }
}

const DEFAULT_TEMPLATE = `Hello!

Thank you for submitting feedback for [Course Name].

After reviewing your feedback, we've decided to remove it from our website because

<REASON>

If you'd like to update your feedback, you can do so at the link below:

[Link]

Thank you for your understanding and have a great day!
Afonso`

const title = 'Unapprove Feedback'
const description =
  'Provide a message that will be sent to the student via email.'

export function UnapprovalMessageDialog({
  open,
  onConfirm,
  onCancel,
  courseName,
  feedback
}: UnapprovalMessageDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let template = DEFAULT_TEMPLATE
    if (courseName) {
      template = DEFAULT_TEMPLATE.replace('[Course Name]', courseName)
    }
    if (feedback.id) {
      template = template.replace(
        '[Link]',
        `https://uni-feedback.com/feedback/${feedback.id}/edit`
      )
    }
    setMessage(template)
  }, [courseName, feedback])

  const handleConfirm = async () => {
    if (!message.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(message)
    } catch (error) {
      // Error handling is left to the onConfirm function
      console.error('Unapproval action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {feedback.comment && (
            <div>
              <Label className="mb-2 block">Original Comment</Label>
              <Textarea
                value={feedback.comment}
                disabled
                className="h-[120px] text-sm bg-muted resize-none"
              />
            </div>
          )}

          <div>
            <Label htmlFor="unapproval-message" className="mb-2 block">
              Message *
            </Label>
            <Textarea
              id="unapproval-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the message to send to the student..."
              className="min-h-[200px] font-mono text-sm"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              This message will be sent via email. You can edit the message
              above before sending.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? 'Sending...' : 'Send & Unapprove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
