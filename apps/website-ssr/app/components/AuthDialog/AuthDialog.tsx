import { zodResolver } from '@hookform/resolvers/zod'
import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { Dialog, DialogContent } from '@uni-feedback/ui'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { AuthUser } from '~/context/AuthContext'
import { useMagicLinkAuth } from '~/hooks'
import { STORAGE_KEYS, VERIFICATION_CONFIG } from '~/utils/constants'
import { ErrorStage } from './ErrorStage'
import type { EmailFormData } from './InputStage'
import { InputStage } from './InputStage'
import { PollingStage } from './PollingStage'
import { SuccessStage } from './SuccessStage'

export type ModalState =
  | { stage: 'input'; isSubmitting: boolean }
  | { stage: 'polling'; email: string }
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

  const { requestMagicLink, verifyMagicLinkByRequestId } = useMagicLinkAuth()

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
      // Load saved email from localStorage when modal opens
      const savedEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL)
      if (savedEmail) {
        form.setValue('email', savedEmail)
      }
    }
  }, [open, form])

  // Polling logic
  useEffect(() => {
    if (modalState.stage !== 'polling') return

    const startTime = Date.now()

    const poll = async () => {
      try {
        const result = await verifyMagicLinkByRequestId()

        if (result.user) {
          clearInterval(pollInterval)
          setModalState({ stage: 'success', user: result.user })
          setTimeout(() => {
            onSuccess(result.user!)
          }, VERIFICATION_CONFIG.SUCCESS_DISPLAY_MS)
        }

        // Check timeout
        if (Date.now() - startTime > VERIFICATION_CONFIG.MAX_POLL_DURATION_MS) {
          clearInterval(pollInterval)
          // setModalState({
          //   stage: 'error',
          //   error: 'Verification timed out. Please request a new link.'
          // })
        }
      } catch (error) {
        clearInterval(pollInterval)
        console.error('Polling error:', error)
        setModalState({
          stage: 'error',
          error: 'Network error during verification. Please try again.'
        })
      }
    }

    const pollInterval = setInterval(poll, VERIFICATION_CONFIG.POLL_INTERVAL_MS)
    poll() // Initial poll

    return () => clearInterval(pollInterval)
  }, [modalState, onSuccess, verifyMagicLinkByRequestId])

  const handleEmailSubmit = async (values: EmailFormData) => {
    setModalState({ stage: 'input', isSubmitting: true })

    try {
      const response = await requestMagicLink({
        email: values.email,
        enablePolling: true
      })

      if (response.requestId) {
        // Save email to localStorage for next time
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, values.email)
        // Hook automatically stored the requestId, just transition to polling
        setModalState({
          stage: 'polling',
          email: values.email
        })
      } else {
        setModalState({
          stage: 'error',
          error: 'Failed to request verification link. Please try again.'
        })
      }
    } catch (error) {
      console.error('Magic link request error:', error)

      let errorMessage =
        'Something went wrong. Please contact help@uni-feedback.com'

      if (error instanceof MeicFeedbackAPIError) {
        errorMessage = error.message
      }

      setModalState({ stage: 'error', error: errorMessage })
    }
  }

  const handleTryAgain = () => {
    setModalState({ stage: 'input', isSubmitting: false })
  }

  const handleManualPollCheck = async () => {
    if (modalState.stage !== 'polling') return

    try {
      const result = await verifyMagicLinkByRequestId()

      if (result.user) {
        setModalState({ stage: 'success', user: result.user })
        setTimeout(() => {
          onSuccess(result.user!)
        }, VERIFICATION_CONFIG.SUCCESS_DISPLAY_MS)
      }
    } catch (error) {
      console.error('Manual poll check error:', error)
    }
  }

  // Determine if modal should be closable
  const canClose = modalState.stage !== 'polling'

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

        {modalState.stage === 'polling' && (
          <PollingStage
            email={modalState.email}
            onManualCheck={handleManualPollCheck}
            onTryAgain={handleTryAgain}
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
