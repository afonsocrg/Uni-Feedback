import { ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router'
import { MessagePage } from '~/components'

export function NotFound() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <MessagePage
      heading="404 - Lost in space?"
      buttons={[
        {
          label: 'Go back',
          onClick: handleGoBack,
          variant: 'outline',
          icon: ArrowLeft
        },
        {
          label: 'Take me home',
          href: '/',
          icon: Home
        }
      ]}
    >
      <p>
        This page is nowhere to be found.
        <br />
        Good news: the rest of Uni Feedback is still here.
      </p>
    </MessagePage>
  )
}
