import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import {
  Button,
  Card,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { isValidEmail } from '@uni-feedback/utils'
import { HelpCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useAuth, useLocalStorage, useMagicLinkAuth } from '~/hooks'
import { STORAGE_KEYS, VERIFICATION_CONFIG } from '~/utils/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [rateLimitResetAtISO, setRateLimitResetAtISO] = useLocalStorage<
    string | null
  >(STORAGE_KEYS.MAGIC_LINK_RATE_LIMIT_RESET, null)
  const [countdown, setCountdown] = useState<string>('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setUser } = useAuth()
  const verificationSucceeded = useRef(false)

  const { requestMagicLink, verifyMagicLinkByRequestId } = useMagicLinkAuth()

  // Extract referral code from URL
  const referralCode = searchParams.get('ref') || undefined

  // Redirect to profile if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/profile')
    }
  }, [user, navigate])

  // Load saved email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL)
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Compute rate limit date from stored ISO string
  const rateLimitResetAt =
    rateLimitResetAtISO && new Date(rateLimitResetAtISO).getTime() > Date.now()
      ? new Date(rateLimitResetAtISO)
      : null

  // Clear expired rate limit
  useEffect(() => {
    if (rateLimitResetAtISO && !rateLimitResetAt) {
      setRateLimitResetAtISO(null)
    }
  }, [rateLimitResetAtISO, rateLimitResetAt, setRateLimitResetAtISO])

  // Countdown timer for rate limit
  useEffect(() => {
    if (!rateLimitResetAt) {
      setCountdown('')
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const timeLeft = rateLimitResetAt.getTime() - now.getTime()

      if (timeLeft <= 0) {
        setRateLimitResetAtISO(null)
        setCountdown('')
        return
      }

      const minutes = Math.floor(timeLeft / 60000)
      const seconds = Math.floor((timeLeft % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [rateLimitResetAt, setRateLimitResetAtISO])

  // Polling logic - runs when email is sent
  useEffect(() => {
    if (!emailSent || verificationSucceeded.current) return

    const startTime = Date.now()
    const redirectTo = searchParams.get('redirect') || '/'

    const poll = async () => {
      try {
        const result = await verifyMagicLinkByRequestId()

        if (result.user) {
          verificationSucceeded.current = true
          clearInterval(pollInterval)
          setUser(result.user)
          toast.success('Successfully logged in!')
          navigate(redirectTo)
        }

        // Check timeout
        if (Date.now() - startTime > VERIFICATION_CONFIG.MAX_POLL_DURATION_MS) {
          clearInterval(pollInterval)
        }
      } catch (error) {
        clearInterval(pollInterval)
        console.error('Polling error:', error)
      }
    }

    const pollInterval = setInterval(poll, VERIFICATION_CONFIG.POLL_INTERVAL_MS)
    poll() // Initial poll

    return () => clearInterval(pollInterval)
  }, [emailSent, verifyMagicLinkByRequestId, navigate, searchParams, setUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)

    try {
      await requestMagicLink({ email, enablePolling: true, referralCode })
      // Clear any previous rate limit state on success
      setRateLimitResetAtISO(null)
      // Save email to localStorage for next time
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email)
      setEmailSent(true)
      toast.success('Check your email for the login link!')
    } catch (error) {
      // Handle rate limit error with countdown
      if (error instanceof MeicFeedbackAPIError && error.status === 429) {
        const resetAt = error.data?.resetAt
        if (resetAt) {
          setRateLimitResetAtISO(resetAt)
        }
      } else {
        // Other errors - display message
        toast.error(
          error instanceof Error ? error.message : 'Failed to send login link'
        )
      }
    }

    setIsLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-xl font-semibold text-center">
            Login or Sign up
          </h1>
          {referralCode && (
            <p className="text-sm text-muted-foreground">
              You've been invited! Code: {referralCode}
            </p>
          )}
        </div>

        <Card className="p-6 shadow-lg border-border text-sm">
          {emailSent ? (
            <div className="text-center space-y-4 text-muted-foreground">
              <div className="space-y-2">
                <p>We've sent a login link to</p>
                <p className="font-semibold">{email}</p>
                <p className="text-xs mt-3">
                  Don't see the email? Check your spam folder or trash bin.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false)
                    verificationSucceeded.current = false
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {rateLimitResetAt && (
                <div className="mt-2 px-4 text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Hold on a sec ⏳
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You’ve requested too many links. Try again in{' '}
                  </p>
                  <div className="font-bold text-gray-700">{countdown}</div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    University Email
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <HelpCircle className="size-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium mb-1">
                            University Email Required
                          </p>
                          <p className="text-muted-foreground">
                            We require a university email to ensure only
                            verified students can submit feedback.
                          </p>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="font-medium mb-1">Need Help?</p>
                          <p className="text-muted-foreground">
                            Email us at{' '}
                            <a
                              href="mailto:help@uni-feedback.com"
                              className="underline hover:text-foreground transition-colors"
                            >
                              help@uni-feedback.com
                            </a>
                          </p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading || !isValidEmail(email) || !!rateLimitResetAt
                }
              >
                {isLoading ? 'Sending...' : 'Email me Login Link'}
              </Button>
            </form>
          )}
        </Card>

        {/* Terms & Privacy Notice */}
        <p className="text-xs text-center text-muted-foreground px-4">
          By continuing, you agree to our{' '}
          <a
            href="/terms"
            className="underline hover:text-foreground transition-colors"
          >
            Terms
          </a>
          {' & '}
          <a
            href="/privacy"
            className="underline hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
