import {
  Button,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@uni-feedback/ui'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthUser } from '~/context/AuthContext'
import { useOtpAuth } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { OTP_CONFIG } from '~/utils/constants'

export interface OtpInputStageProps {
  email: string
  onSuccess: (user: AuthUser) => void
  onChangeEmail: () => void
  showHeader?: boolean
}

export function OtpInputStage({
  email,
  onSuccess,
  onChangeEmail,
  showHeader = true
}: OtpInputStageProps) {
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string>()
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>()
  const [cooldownSeconds, setCooldownSeconds] = useState(
    OTP_CONFIG.COOLDOWN_SECONDS
  )
  const lastSubmittedOtp = useRef<string>('')

  const { verifyOtp, requestOtp } = useOtpAuth()

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const handleVerifyOtp = useCallback(
    async (otpCode: string) => {
      setIsVerifying(true)
      setError(undefined)

      // Track OTP entered
      analytics.auth.otpEntered()

      try {
        const result = await verifyOtp({
          email,
          otp: otpCode
        })

        if (result.success && result.user) {
          onSuccess(result.user)
        } else {
          // Track OTP verification failure
          analytics.auth.failed({
            step: 'otp_verification',
            errorType: 'invalid_code'
          })

          setError(result.error)
          setAttemptsRemaining(result.attemptsRemaining)
          setTimeout(() => setOtp(''), 400)
        }
      } catch (error) {
        console.error('OTP verification error:', error)

        // Track OTP verification failure
        analytics.auth.failed({
          step: 'otp_verification',
          errorType: 'network'
        })

        setError('Verification failed. Please try again.')
      } finally {
        setIsVerifying(false)
      }
    },
    [email, verifyOtp, onSuccess]
  )

  // Auto-submit when OTP is complete (with a small delay for UX)
  useEffect(() => {
    if (
      otp.length === OTP_CONFIG.CODE_LENGTH &&
      !isVerifying &&
      otp !== lastSubmittedOtp.current
    ) {
      const timer = setTimeout(() => {
        lastSubmittedOtp.current = otp
        handleVerifyOtp(otp)
      }, 400)

      return () => clearTimeout(timer)
    }
  }, [otp, isVerifying, handleVerifyOtp])

  const handleResend = useCallback(async () => {
    setOtp('')
    lastSubmittedOtp.current = ''
    setError(undefined)
    setAttemptsRemaining(undefined)

    try {
      const result = await requestOtp({ email })

      if (result.success) {
        setCooldownSeconds(OTP_CONFIG.COOLDOWN_SECONDS)
      } else if (result.retryAfterSeconds) {
        setCooldownSeconds(result.retryAfterSeconds)
        setError(result.error)
      }
    } catch (error) {
      console.error('OTP resend error:', error)
    }
  }, [email, requestOtp])

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    // Extract only digits and limit to OTP length
    const cleanedData = pastedData
      .replace(/\D/g, '')
      .slice(0, OTP_CONFIG.CODE_LENGTH)
    if (cleanedData.length > 0) {
      setOtp(cleanedData)
    }
  }

  return (
    <>
      {showHeader && (
        <DialogHeader>
          <DialogTitle>Enter verification code</DialogTitle>
          <DialogDescription>
            We sent a 6-digit code to
            <br />
            <span className="font-semibold">{email}</span>
          </DialogDescription>
        </DialogHeader>
      )}

      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <InputOTP
          maxLength={OTP_CONFIG.CODE_LENGTH}
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
          autoComplete="one-time-code"
          onPaste={handlePaste}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        {isVerifying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Verifying...</span>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm text-destructive">{error}</p>
            {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''}{' '}
                remaining
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || isVerifying}
          >
            {cooldownSeconds > 0
              ? `Resend code (${cooldownSeconds}s)`
              : 'Resend code'}
          </Button>
          <Button size="sm" onClick={onChangeEmail} disabled={isVerifying}>
            Use a different email
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Don't see the email? Check your spam folder or search for{' '}
          <span className="font-medium">@uni-feedback.com</span> in your inbox
        </p>
      </div>
    </>
  )
}
