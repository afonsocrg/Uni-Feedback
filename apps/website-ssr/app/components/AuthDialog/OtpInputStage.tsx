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
import { useEffect, useState } from 'react'
import { OTP_CONFIG } from '~/utils/constants'

export interface OtpInputStageProps {
  email: string
  isVerifying: boolean
  error?: string
  attemptsRemaining?: number
  cooldownSeconds: number
  onVerify: (otp: string) => void
  onResend: () => void
  onChangeEmail: () => void
  showHeader?: boolean
}

export function OtpInputStage({
  email,
  isVerifying,
  error,
  attemptsRemaining,
  cooldownSeconds,
  onVerify,
  onResend,
  onChangeEmail,
  showHeader = true
}: OtpInputStageProps) {
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(cooldownSeconds)

  // Update countdown when cooldownSeconds changes
  useEffect(() => {
    setCountdown(cooldownSeconds)
  }, [cooldownSeconds])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_CONFIG.CODE_LENGTH && !isVerifying) {
      onVerify(otp)
    }
  }, [otp, isVerifying, onVerify])

  const handleResend = () => {
    setOtp('')
    onResend()
  }

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
            disabled={countdown > 0 || isVerifying}
          >
            {countdown > 0 ? `Resend code (${countdown}s)` : 'Resend code'}
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
