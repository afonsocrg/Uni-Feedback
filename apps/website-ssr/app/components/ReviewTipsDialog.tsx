import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { ArrowRight, Check, X } from 'lucide-react'
import { Link } from 'react-router'
import { FEEDBACK_CATEGORIES } from '~/utils/constants'

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

          {/* Feedback Categories */}
          <div className="pt-6 mt-2 border-t">
            <h3 className="font-semibold mb-3">What to cover</h3>
            <p className="text-sm text-gray-600 mb-3">
              Try to mention these four topics naturally in your feedback. Cover
              all four to earn bonus points!
            </p>
            <div className="space-y-3">
              {FEEDBACK_CATEGORIES.map((category) => (
                <div key={category.title} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <category.icon className="size-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{category.title}</h4>
                    <p className="text-xs text-gray-600">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
