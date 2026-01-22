import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { CheckCircle, Home, Loader2, User, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { MessagePage } from '~/components'
import { useAuth, useMagicLinkAuth } from '~/hooks'

/**
 * Client-side magic link verification (SPA approach)
 *
 * Why fully client-side?
 * - Public pages use SSR for SEO (courses, feedback)
 * - Auth pages are SPA for simplicity and dynamic UX
 * - No SSR complexity for auth state
 * - Clean separation: public = SSR, private = SPA
 *
 * @deprecated Magic links are being replaced by OTP authentication.
 * This route is kept for backward compatibility only.
 */
export default function LoginToken() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  )
  const [errorMessage, setErrorMessage] = useState('')

  const { useMagicLink } = useMagicLinkAuth()

  // Prevent double execution in React Strict Mode (development)
  const hasVerified = useRef(false)

  useEffect(() => {
    // Skip if already verified (prevents Strict Mode double execution)
    if (hasVerified.current) {
      return
    }

    if (!token) {
      setStatus('error')
      setErrorMessage('No token provided')
      return
    }

    const verify = async () => {
      // Mark as verified before async call to prevent race conditions
      hasVerified.current = true

      try {
        // Call API directly from browser - cookies will be set correctly
        const response = await useMagicLink({ token })

        // Update client-side auth context
        setUser(response.user)
        setStatus('success')
      } catch (error) {
        // Check if this is an expired token with requestId
        if (error instanceof MeicFeedbackAPIError && error.requestId) {
          // Redirect to login page to continue polling
          toast.info(error.message)
          navigate('/login')
          return
        }

        // Handle other errors
        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Verification failed'
        )
      }
    }

    verify()
  }, [token, setUser, navigate, useMagicLink])

  if (status === 'success') {
    return (
      <MessagePage
        heading="You're logged in!"
        buttons={[
          {
            label: 'Go to Home',
            href: '/',
            icon: Home
          },
          {
            label: 'View Profile',
            href: '/profile',
            variant: 'outline',
            icon: User
          }
        ]}
      >
        <div className="flex justify-center">
          <CheckCircle className="size-16 text-green-500" />
        </div>
        <p>
          You have successfully logged in.
          <br />
          You can safely close this page.
        </p>
      </MessagePage>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {status === 'verifying' && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="size-16 text-primary animate-spin" />
            <h1 className="text-2xl font-bold text-center">
              Verifying your link...
            </h1>
            <p className="text-center text-muted-foreground">
              Please wait a moment
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="size-16 text-red-500" />
            <h1 className="text-2xl font-bold text-center">
              Verification failed
            </h1>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{errorMessage}</p>
              <Link
                to="/login"
                className="text-primary hover:underline inline-block"
              >
                Request a new link
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
