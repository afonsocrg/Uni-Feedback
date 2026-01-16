import { MessagePage } from '~/components'

interface FeedbackSubmitSuccessProps {
  pointsEarned?: number
  onSubmitAnother: () => void
  browseLink: string
}

export function SubmitFeedbackSuccess({
  pointsEarned,
  onSubmitAnother,
  browseLink
}: FeedbackSubmitSuccessProps) {
  const hasPoints = pointsEarned !== undefined && pointsEarned > 0

  return (
    <MessagePage
      heading="Legend move 😎!"
      buttons={[
        {
          label: 'Submit Another Feedback',
          onClick: onSubmitAnother
        },
        {
          label: 'Back to Courses',
          href: browseLink,
          variant: 'outline'
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
        </div>
      )}
    </MessagePage>
  )
}
