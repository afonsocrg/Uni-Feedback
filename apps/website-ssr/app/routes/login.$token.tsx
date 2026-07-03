import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { CheckCircle, Home, Loader2, User, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { MessagePage } from '~/components'
import { useAuth, useLang, useMagicLinkAuth } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

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
  const lang = useLang()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  )
  const [errorMessage, setErrorMessage] = useState('')

  const { useMagicLink: callMagicLink } = useMagicLinkAuth()

  // Prevent double execution in React Strict Mode (development)
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) {
      return
    }

    if (!token) {
      setStatus('error')
      setErrorMessage('No token provided')
      return
    }

    const verify = async () => {
      hasVerified.current = true

      try {
        const response = await callMagicLink({ token })
        setUser(response.user)
        setStatus('success')
      } catch (error) {
        if (error instanceof MeicFeedbackAPIError && error.requestId) {
          toast.info(error.message)
          navigate(getLocalePath('login', lang))
          return
        }

        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Verification failed'
        )
      }
    }

    verify()
  }, [token, setUser, navigate, callMagicLink, lang])

  if (status === 'success') {
    return (
      <MessagePage
        heading="You're logged in!"
        buttons={[
          {
            label: 'Go to Home',
            href: getLocalePath('home', lang),
            icon: Home
          },
          {
            label: 'View Profile',
            href: getLocalePath('profile', lang),
            variant: 'outline',
            icon: User
          }
        ]}
      >
        <div className="flex justify-center">
          <CheckCircle className="size-16 text-success" />
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
            <XCircle className="size-16 text-destructive" />
            <h1 className="text-2xl font-bold text-center">
              Verification failed
            </h1>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{errorMessage}</p>
              <Link
                to={getLocalePath('login', lang)}
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
