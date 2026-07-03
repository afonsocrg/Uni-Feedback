import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { HelpCircle } from 'lucide-react'
import { Link } from 'react-router'
import { MessagePage } from '~/components'
import { useLang } from '~/hooks'
import {
  getCoursePath,
  getFeedbackAnchor,
  getLocalePath
} from '~/utils/i18n-routes'

interface UpdateFeedbackSuccessProps {
  points?: number
  courseId?: number
  feedbackId?: number
  onSubmitAnother: () => void
}

export function UpdateFeedbackSuccess({
  points,
  courseId,
  feedbackId,
  onSubmitAnother
}: UpdateFeedbackSuccessProps) {
  const lang = useLang()

  const hasPoints = points !== undefined
  const feedbackUrl =
    courseId && feedbackId
      ? getFeedbackAnchor(lang, courseId, feedbackId)
      : courseId
        ? getCoursePath(lang, courseId)
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
          label: 'Submit for another course',
          onClick: onSubmitAnother,
          variant: 'outline' as const
        }
      ]}
    >
      <p>Your feedback has been updated</p>

      {hasPoints && (
        <div className="flex flex-col items-center gap-1 mt-6">
          <span className="text-sm text-muted-foreground font-medium">
            Your feedback is now worth
          </span>
          <span className="text-5xl md:text-6xl font-bold text-primaryBlue">
            {points}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-medium text-muted-foreground">
              point{points !== 1 ? 's' : ''}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={getLocalePath('points', lang)}
                    className="text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
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
