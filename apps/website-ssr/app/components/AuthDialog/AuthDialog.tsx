import { zodResolver } from '@hookform/resolvers/zod'
import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { Dialog, DialogContent } from '@uni-feedback/ui'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { AuthUser } from '~/context/AuthContext'
import { useOtpAuth } from '~/hooks'
import {
  OTP_CONFIG,
  STORAGE_KEYS,
  VERIFICATION_CONFIG
} from '~/utils/constants'
import { ErrorStage } from './ErrorStage'
import type { EmailFormData } from './InputStage'
import { InputStage } from './InputStage'
import { OtpInputStage } from './OtpInputStage'
import { SuccessStage } from './SuccessStage'

export type ModalState =
  | { stage: 'input'; isSubmitting: boolean }
  | {
      stage: 'otp_input'
      email: string
      referralCode?: string
      isVerifying: boolean
      error?: string
      attemptsRemaining?: number
    }
  | { stage: 'success'; user: AuthUser }
  | { stage: 'error'; error: string }

export interface AuthDialogProps {
  open: boolean
  onSuccess: (user: AuthUser) => void
  onError?: (error: string) => void
  onClose?: () => void
  /** If provided, only emails with these domain suffixes will be accepted */
  allowedEmailSuffixes?: string[]
  /** Name of the university/faculty for display purposes */
  universityName?: string
  /** Custom title for the input stage */
  title?: string
  /** Custom description for the input stage */
  description?: string
  /** Custom title for the success stage */
  successTitle?: string
  /** Custom description for the success stage */
  successDescription?: string
}

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export function AuthDialog({
  open,
  onSuccess,
  onError,
  onClose,
  allowedEmailSuffixes,
  universityName,
  title,
  description,
  successTitle,
  successDescription
}: AuthDialogProps) {
  const [modalState, setModalState] = useState<ModalState>({
    stage: 'input',
    isSubmitting: false
  })
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const { requestOtp, verifyOtp } = useOtpAuth()

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: ''
    }
  })

  // Reset modal state when closed, or load saved email when opened
  useEffect(() => {
    if (!open) {
      setModalState({ stage: 'input', isSubmitting: false })
      setCooldownSeconds(0)
      form.reset()
    } else {
      // Load saved email from localStorage when modal opens
      const savedEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL)
      if (savedEmail) {
        form.setValue('email', savedEmail)
      }
    }
  }, [open, form])

  const handleEmailSubmit = async (values: EmailFormData) => {
    setModalState({ stage: 'input', isSubmitting: true })

    try {
      const result = await requestOtp({ email: values.email })

      if (result.success) {
        // Save email to localStorage for next time
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, values.email)
        // Set initial cooldown
        setCooldownSeconds(OTP_CONFIG.COOLDOWN_SECONDS)
        // Transition to OTP input
        setModalState({
          stage: 'otp_input',
          email: values.email,
          isVerifying: false
        })
      } else if (result.retryAfterSeconds) {
        // Rate limited
        setCooldownSeconds(result.retryAfterSeconds)
        setModalState({
          stage: 'otp_input',
          email: values.email,
          isVerifying: false,
          error: result.error
        })
      } else {
        setModalState({
          stage: 'error',
          error: result.error || 'Failed to send verification code.'
        })
      }
    } catch (error) {
      console.error('OTP request error:', error)

      let errorMessage =
        'Something went wrong. Please contact help@uni-feedback.com'

      if (error instanceof MeicFeedbackAPIError) {
        errorMessage = error.message
      }

      setModalState({ stage: 'error', error: errorMessage })
    }
  }

  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      if (modalState.stage !== 'otp_input') return

      setModalState((prev) => {
        if (prev.stage !== 'otp_input') return prev
        return { ...prev, isVerifying: true, error: undefined }
      })

      try {
        const result = await verifyOtp({
          email: modalState.email,
          otp
        })

        if (result.success && result.user !== undefined) {
          setModalState({ stage: 'success', user: result.user })
          setTimeout(() => {
            onSuccess(result.user!)
          }, VERIFICATION_CONFIG.SUCCESS_DISPLAY_MS)
        } else {
          setModalState((prev) => {
            if (prev.stage !== 'otp_input') return prev
            return {
              ...prev,
              isVerifying: false,
              error: result.error,
              attemptsRemaining: result.attemptsRemaining
            }
          })
        }
      } catch (error) {
        console.error('OTP verification error:', error)
        setModalState((prev) => {
          if (prev.stage !== 'otp_input') return prev
          return {
            ...prev,
            isVerifying: false,
            error: 'Verification failed. Please try again.'
          }
        })
      }
    },
    [modalState, verifyOtp, onSuccess]
  )

  const handleResendOtp = useCallback(async () => {
    if (modalState.stage !== 'otp_input') return

    setModalState((prev) => {
      if (prev.stage !== 'otp_input') return prev
      return { ...prev, error: undefined, attemptsRemaining: undefined }
    })

    try {
      const result = await requestOtp({
        email: modalState.email,
        referralCode: modalState.referralCode
      })

      if (result.success) {
        setCooldownSeconds(OTP_CONFIG.COOLDOWN_SECONDS)
      } else if (result.retryAfterSeconds) {
        setCooldownSeconds(result.retryAfterSeconds)
        setModalState((prev) => {
          if (prev.stage !== 'otp_input') return prev
          return { ...prev, error: result.error }
        })
      }
    } catch (error) {
      console.error('OTP resend error:', error)
    }
  }, [modalState, requestOtp])

  const handleTryAgain = () => {
    setModalState({ stage: 'input', isSubmitting: false })
    setCooldownSeconds(0)
  }

  const handleChangeEmail = () => {
    setModalState({ stage: 'input', isSubmitting: false })
    setCooldownSeconds(0)
  }

  // Determine if modal should be closable
  const canClose =
    modalState.stage === 'input' ||
    modalState.stage === 'error' ||
    modalState.stage === 'success'

  return (
    <Dialog open={open} onOpenChange={canClose ? onClose : () => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (!canClose) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) e.preventDefault()
        }}
      >
        {modalState.stage === 'input' && (
          <InputStage
            form={form}
            modalState={modalState}
            onSubmit={handleEmailSubmit}
            allowedEmailSuffixes={allowedEmailSuffixes}
            universityName={universityName}
            title={title}
            description={description}
          />
        )}

        {modalState.stage === 'otp_input' && (
          <OtpInputStage
            email={modalState.email}
            isVerifying={modalState.isVerifying}
            error={modalState.error}
            attemptsRemaining={modalState.attemptsRemaining}
            cooldownSeconds={cooldownSeconds}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onChangeEmail={handleChangeEmail}
          />
        )}

        {modalState.stage === 'success' && (
          <SuccessStage title={successTitle} description={successDescription} />
        )}

        {modalState.stage === 'error' && (
          <ErrorStage
            error={modalState.error}
            onTryAgain={handleTryAgain}
            onCancel={onError ? () => onError(modalState.error) : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
