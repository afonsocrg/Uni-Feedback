import { Markdown } from '@components'
import content from '@md/review-guidelines-short.md'
import { Dialog, DialogContent, DialogTitle } from '@ui'

interface FeedbackTipsDialogProps {
  isOpen: boolean
  onClose: () => void
}
export function FeedbackTipsDialog({
  isOpen,
  onClose
}: FeedbackTipsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="hidden">
        <DialogTitle>Feedback tips</DialogTitle>
      </div>
      <DialogContent className="!max-w-[600px] max-h-[80vh] flex flex-col">
        <div className="overflow-y-auto">
          <Markdown>{content}</Markdown>
        </div>
      </DialogContent>
    </Dialog>
  )
}
