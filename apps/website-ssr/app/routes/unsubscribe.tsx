import { unsubscribeFromReminders } from '@uni-feedback/api-client'
import { CheckCircle, Home, Loader2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MessagePage } from '~/components'

type UnsubscribeStatus = 'loading' | 'success' | 'error' | 'no-token'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<UnsubscribeStatus>(
    token ? 'loading' : 'no-token'
  )
  const [message, setMessage] = useState('')

  // Prevent double execution in React Strict Mode
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current || !token) {
      return
    }

    const processUnsubscribe = async () => {
      hasProcessed.current = true

      try {
        const response = await unsubscribeFromReminders({ token })
        setMessage(response.message)
        setStatus('success')
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'Failed to unsubscribe'
        )
        setStatus('error')
      }
    }

    processUnsubscribe()
  }, [token])

  if (status === 'no-token') {
    return (
      <MessagePage
        heading="Invalid Link"
        buttons={[
          {
            label: 'Go to Home',
            href: '/',
            icon: Home
          }
        ]}
      >
        <div className="flex justify-center">
          <XCircle className="size-16 text-red-500" />
        </div>
        <p>
          This unsubscribe link is invalid.
          <br />
          Please use the link from your email.
        </p>
      </MessagePage>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="size-16 text-primary animate-spin" />
            <h1 className="text-2xl font-bold text-center">
              Processing your request...
            </h1>
            <p className="text-center text-muted-foreground">
              Please wait a moment
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <MessagePage
        heading="Unsubscribe Failed"
        buttons={[
          {
            label: 'Go to Home',
            href: '/',
            icon: Home
          }
        ]}
      >
        <div className="flex justify-center">
          <XCircle className="size-16 text-red-500" />
        </div>
        <p>{message}</p>
      </MessagePage>
    )
  }

  return (
    <MessagePage
      heading="Unsubscribed"
      buttons={[
        {
          label: 'Go to Home',
          href: '/',
          icon: Home
        }
      ]}
    >
      <div className="flex justify-center">
        <CheckCircle className="size-16 text-green-500" />
      </div>
      <p>{message}</p>
      {/* <p className="text-sm">
        Changed your mind? You can always log in and update your preferences.
      </p> */}
    </MessagePage>
  )
}
