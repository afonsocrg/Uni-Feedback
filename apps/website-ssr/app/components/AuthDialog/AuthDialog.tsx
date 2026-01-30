import { zodResolver } from '@hookform/resolvers/zod'
import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { Dialog, DialogContent } from '@uni-feedback/ui'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { AuthUser } from '~/context/AuthContext'
import { useOtpAuth } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { STORAGE_KEYS, VERIFICATION_CONFIG } from '~/utils/constants'
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

  const { requestOtp } = useOtpAuth()

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
      form.reset()
    } else {
      // Track auth dialog shown
      analytics.auth.dialogShown({ trigger: 'feedback_submission' })

      // Load saved email from localStorage when modal opens
      const savedEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL)
      if (savedEmail) {
        form.setValue('email', savedEmail)
      }
    }
  }, [open, form])

  const handleEmailSubmit = async (values: EmailFormData) => {
    setModalState({ stage: 'input', isSubmitting: true })

    // Track email entered
    const emailDomain = values.email.split('@')[1]
    analytics.auth.emailEntered({ emailDomain })

    try {
      const result = await requestOtp({ email: values.email })

      if (result.success || result.retryAfterSeconds) {
        // Track OTP requested successfully
        analytics.auth.otpRequested()

        // Save email to localStorage for next time
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, values.email)
        // Transition to OTP input (component will handle cooldown internally)
        setModalState({
          stage: 'otp_input',
          email: values.email
        })
      } else {
        // Track auth failure
        analytics.auth.failed({
          step: 'otp_request',
          errorType: 'api_error'
        })

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

      // Track auth failure
      analytics.auth.failed({
        step: 'otp_request',
        errorType: 'network'
      })

      setModalState({ stage: 'error', error: errorMessage })
    }
  }

  const handleOtpSuccess = (user: AuthUser) => {
    // Track successful authentication
    analytics.auth.completed({ authMethod: 'otp' })

    setModalState({ stage: 'success', user })
    setTimeout(() => {
      onSuccess(user)
    }, VERIFICATION_CONFIG.SUCCESS_DISPLAY_MS)
  }

  const handleTryAgain = () => {
    setModalState({ stage: 'input', isSubmitting: false })
  }

  const handleChangeEmail = () => {
    setModalState({ stage: 'input', isSubmitting: false })
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
            onSuccess={handleOtpSuccess}
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
