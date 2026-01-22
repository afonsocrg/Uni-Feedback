import {
  Button,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { Mail } from 'lucide-react'

export interface PollingStageProps {
  email: string
  onManualCheck: () => void
  onTryAgain: () => void
}

/**
 * @deprecated Magic links are being replaced by OTP authentication.
 * Use OtpInputStage instead. This component is kept for backward compatibility only.
 */
export function PollingStage({
  email,
  onManualCheck,
  onTryAgain
}: PollingStageProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Check your email</DialogTitle>
        <DialogDescription>
          We sent a verification link to
          <br />
          <span className="font-semibold">{email}</span>.
          <br />
          <span className="text-xs mt-2 block">
            Don't see the email? Check your spam folder or try searching for{' '}
            <span className="font-medium">@uni-feedback.com</span> in your
            inbox.
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative">
          <Mail className="size-16 text-primaryBlue" />
          <div className="absolute -top-1 -right-1">
            <div className="size-4 bg-primaryBlue rounded-full animate-ping" />
            <div className="absolute top-0 right-0 size-4 bg-primaryBlue rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onManualCheck}>
            I already clicked the link
          </Button>
          <Button size="sm" onClick={onTryAgain}>
            Use a different email
          </Button>
        </div>
      </div>
    </>
  )
}
