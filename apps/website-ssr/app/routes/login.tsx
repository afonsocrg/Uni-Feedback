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
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { OtpInputStage } from '~/components/AuthDialog/OtpInputStage'
import type { AuthUser } from '~/context/AuthContext'
import { useAuth, useOtpAuth } from '~/hooks'
import { STORAGE_KEYS } from '~/utils/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setUser } = useAuth()

  const { requestOtp } = useOtpAuth()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)

    try {
      const result = await requestOtp({ email, referralCode })

      if (result.success || result.retryAfterSeconds) {
        // Save email to localStorage for next time
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email)
        setShowOtpInput(true)
        toast.success('Check your email for the verification code!')
      } else {
        toast.error(result.error || 'Failed to send verification code')
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code'
      )
    }

    setIsLoading(false)
  }

  const handleOtpSuccess = (user: AuthUser) => {
    const redirectTo = searchParams.get('redirect') || '/'
    setUser(user)
    toast.success('Successfully logged in!')
    navigate(redirectTo)
  }

  const handleTryAgain = () => {
    setShowOtpInput(false)
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
          {showOtpInput ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  We sent a verification code to
                </p>
                <p className="font-semibold">{email}</p>
              </div>

              <OtpInputStage
                email={email}
                onSuccess={handleOtpSuccess}
                onChangeEmail={handleTryAgain}
                showHeader={false}
              />
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
                disabled={isLoading || !isValidEmail(email)}
              >
                {isLoading ? 'Sending...' : 'Send verification code'}
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
