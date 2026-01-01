import {
  Button,
  Card,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { isValidEmail } from '@uni-feedback/utils'
import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useMagicLinkAuth } from '~/hooks'
import { STORAGE_KEYS, VERIFICATION_CONFIG } from '~/utils/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { requestMagicLink, verifyMagicLinkByRequestId } = useMagicLinkAuth()

  // Load saved email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL)
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Polling logic - runs when email is sent
  useEffect(() => {
    if (!emailSent) return

    const startTime = Date.now()
    const redirectTo = searchParams.get('redirect') || '/'

    const poll = async () => {
      try {
        const result = await verifyMagicLinkByRequestId()

        if (result.user) {
          clearInterval(pollInterval)
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
  }, [emailSent, verifyMagicLinkByRequestId, navigate, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)

    try {
      await requestMagicLink({ email, enablePolling: true })
      // Save email to localStorage for next time
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email)
      setEmailSent(true)
      toast.success('Check your email for the login link!')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send login link'
      )
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
                  onClick={() => setEmailSent(false)}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                        <Info className="size-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <p className="text-sm text-muted-foreground">
                        We require a university email to ensure only verified
                        students can submit feedback.
                      </p>
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
                disabled={isLoading || !isValidEmail(email)}
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
