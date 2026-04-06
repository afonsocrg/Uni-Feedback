import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { getFeedbackPermalink } from '@uni-feedback/utils'
import { HelpCircle } from 'lucide-react'
import { Link } from 'react-router'
import { MessagePage } from '~/components'

interface EditFeedbackSuccessProps {
  points?: number
  courseId?: number
  feedbackId?: number
  onBackToProfile: () => void
}

export function EditFeedbackSuccess({
  points,
  courseId,
  feedbackId,
  onBackToProfile
}: EditFeedbackSuccessProps) {
  const hasPoints = points !== undefined
  const feedbackUrl =
    courseId && feedbackId
      ? getFeedbackPermalink(courseId, feedbackId)
      : courseId
        ? `/courses/${courseId}`
        : undefined

  return (
    <MessagePage
      heading="🎉 All set!!"
      buttons={[
        ...(feedbackUrl
          ? [
              {
                label: 'View your feedback',
                href: feedbackUrl
              }
            ]
          : []),
        {
          label: 'Back to Profile',
          onClick: onBackToProfile,
          variant: 'outline' as const
        }
      ]}
    >
      <p>Your feedback has been updated</p>

      {hasPoints && (
        <div className="flex flex-col items-center gap-1 mt-6">
          <span className="text-sm text-gray-600 font-medium">
            Your feedback is now worth
          </span>
          <span className="text-5xl md:text-6xl font-bold text-primaryBlue">
            {points}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-medium text-gray-600">
              point{points !== 1 ? 's' : ''}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/points"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="text-white border-gray-900"
                >
                  <p>How do points work?</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </MessagePage>
  )
}
