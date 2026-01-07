import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { ArrowRight, Check, X } from 'lucide-react'
import { Link } from 'react-router'

interface ReviewTipsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReviewTipsDialog({
  open,
  onOpenChange
}: ReviewTipsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>What makes a great feedback?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Do section */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Check className="size-4" />
              Do
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700 list-disc ml-4 pl-4">
              <li>Be specific: the more details, the better</li>
              <li>Share the good, the bad, and the just OK</li>
              <li>Tell us stuff you'd tell your friends</li>
              <li>Share a few tips and recommendations!</li>
            </ul>
          </div>

          {/* Don't section */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <X className="size-4" />
              Don't
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700 list-disc ml-4 pl-4">
              <li>Use profanity, threats, or personal insults</li>
              <li>Include personal info like email or phone numbers</li>
              <li>Write in ALL CAPS</li>
              {/* <li>Share someone else's experience</li> */}
            </ul>
          </div>
        </div>

        {/* Footer with link */}
        <div className="pt-2">
          <Link
            to="/guidelines"
            className="text-sm text-primaryBlue hover:text-primaryBlue/80 font-medium inline-flex items-center gap-1"
            onClick={() => onOpenChange(false)}
          >
            See more review tips
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
