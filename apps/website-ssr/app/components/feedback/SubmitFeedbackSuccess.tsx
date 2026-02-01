import { Link } from 'react-router'
import { MessagePage } from '~/components'

interface FeedbackSubmitSuccessProps {
  pointsEarned?: number
  courseId?: number
  feedbackId?: number
  onSubmitAnother: () => void
  browseLink: string
}

export function SubmitFeedbackSuccess({
  pointsEarned,
  courseId,
  feedbackId,
  onSubmitAnother,
  browseLink
}: FeedbackSubmitSuccessProps) {
  const hasPoints = pointsEarned !== undefined && pointsEarned > 0
  const feedbackUrl =
    courseId && feedbackId
      ? `/courses/${courseId}#feedback-${feedbackId}`
      : courseId
        ? `/courses/${courseId}`
        : undefined

  return (
    <MessagePage
      heading="Legend move 😎!"
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
      <p>
        Your feedback will help hundreds of students finding the right courses!!
      </p>

      {hasPoints && (
        <div>
          <div className="text-sm text-gray-600">You got</div>
          <div className="text-xl font-bold text-primaryBlue">
            +{pointsEarned} point{pointsEarned != 1 ? 's' : ''}
          </div>
          <Link
            to="/points"
            className="mt-2 inline-block text-sm text-gray-500 underline hover:text-primaryBlue"
          >
            How do points work?
          </Link>
        </div>
      )}
    </MessagePage>
  )
}
