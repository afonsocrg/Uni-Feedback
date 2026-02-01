import { MessagePage } from '~/components'

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
          label: 'Submit for another course',
          onClick: onSubmitAnother,
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
