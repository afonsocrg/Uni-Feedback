import { MessagePage } from '~/components'
import { useLastVisitedPath } from '~/hooks'

interface UpdateFeedbackSuccessProps {
  points?: number
  onSubmitAnother: () => void
}

export function UpdateFeedbackSuccess({
  points,
  onSubmitAnother
}: UpdateFeedbackSuccessProps) {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'
  return (
    <MessagePage
      heading="🎉 All set!!"
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
      <p>Your feedback has been updated</p>

      {points !== undefined && (
        <>
          <div className="text-sm text-gray-600">
            Your feedback is now worth
          </div>
          <div className="text-xl font-bold text-primaryBlue">
            {points} points
          </div>
        </>
      )}
    </MessagePage>
  )
}
