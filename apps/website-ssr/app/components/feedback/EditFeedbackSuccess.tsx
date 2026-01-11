import { MessagePage } from '~/components'

interface EditFeedbackSuccessProps {
  points: number
  onBackToProfile: () => void
}

export function EditFeedbackSuccess({
  points,
  onBackToProfile
}: EditFeedbackSuccessProps) {
  return (
    <MessagePage
      heading="🎉 All set!!"
      buttons={[
        {
          label: 'Back to Profile',
          onClick: onBackToProfile
        }
      ]}
    >
      <p>Your feedback has been updated</p>

      <div className="text-sm text-gray-600"> Your feedback is now worth</div>
      <div className="text-xl font-bold text-primaryBlue">{points} points</div>
    </MessagePage>
  )
}
