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
import { useAuth, useOtpAuth } from '~/hooks'
import { OTP_CONFIG, STORAGE_KEYS } from '~/utils/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<
    number | undefined
  >()
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setUser } = useAuth()

  const { requestOtp, verifyOtp } = useOtpAuth()

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

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)

    try {
      const result = await requestOtp({ email, referralCode })

      if (result.success) {
        // Save email to localStorage for next time
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email)
        setCooldownSeconds(OTP_CONFIG.COOLDOWN_SECONDS)
        setShowOtpInput(true)
        setOtpError(null)
        setAttemptsRemaining(undefined)
        toast.success('Check your email for the verification code!')
      } else if (result.retryAfterSeconds) {
        setCooldownSeconds(result.retryAfterSeconds)
        toast.error(
          result.error || 'Please wait before requesting another code.'
        )
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

  const handleVerifyOtp = async (otp: string) => {
    if (otp.length !== OTP_CONFIG.CODE_LENGTH) return

    setIsVerifying(true)
    setOtpError(null)

    try {
      const redirectTo = searchParams.get('redirect') || '/'
      const result = await verifyOtp({ email, otp })

      if (result.success && result.user) {
        setUser(result.user)
        toast.success('Successfully logged in!')
        navigate(redirectTo)
      } else {
        setOtpError(result.error || 'Invalid code')
        setAttemptsRemaining(result.attemptsRemaining)
      }
    } catch (error) {
      setOtpError('Verification failed. Please try again.')
    }

    setIsVerifying(false)
  }

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return

    setOtpError(null)
    setAttemptsRemaining(undefined)

    try {
      const result = await requestOtp({ email, referralCode })

      if (result.success) {
        setCooldownSeconds(OTP_CONFIG.COOLDOWN_SECONDS)
        toast.success('New verification code sent!')
      } else if (result.retryAfterSeconds) {
        setCooldownSeconds(result.retryAfterSeconds)
        toast.error(
          result.error || 'Please wait before requesting another code.'
        )
      }
    } catch (error) {
      toast.error('Failed to resend code')
    }
  }

  const handleTryAgain = () => {
    setShowOtpInput(false)
    setOtpError(null)
    setAttemptsRemaining(undefined)
    setCooldownSeconds(0)
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
                isVerifying={isVerifying}
                error={otpError || undefined}
                attemptsRemaining={attemptsRemaining}
                cooldownSeconds={cooldownSeconds}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onChangeEmail={handleTryAgain}
                showHeader={false}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {cooldownSeconds > 0 && (
                <div className="mt-2 px-4 text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Hold on a sec
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can request another code in{' '}
                  </p>
                  <div className="font-bold text-gray-700">
                    {cooldownSeconds}s
                  </div>
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
                  isLoading || !isValidEmail(email) || cooldownSeconds > 0
                }
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
