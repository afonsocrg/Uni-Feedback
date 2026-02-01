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
  const feedbackUrl =
    courseId && feedbackId
      ? `/courses/${courseId}#feedback-${feedbackId}`
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

      {points !== undefined && (
        <>
          <div className="text-sm text-gray-600">
            Your feedback is now worth
          </div>
          <div className="text-xl font-bold text-primaryBlue">
            {points} point{points !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </MessagePage>
  )
}
