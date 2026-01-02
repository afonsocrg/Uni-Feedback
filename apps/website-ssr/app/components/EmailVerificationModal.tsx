import { zodResolver } from '@hookform/resolvers/zod'
import { MeicFeedbackAPIError } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@uni-feedback/ui'
import { Check, Loader2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { AuthUser } from '~/context/AuthContext'
import { useMagicLinkAuth } from '~/hooks'
import { STORAGE_KEYS, VERIFICATION_CONFIG } from '~/utils/constants'

type ModalState =
  | { stage: 'input'; isSubmitting: boolean }
  | { stage: 'polling'; email: string }
  | { stage: 'success'; user: AuthUser }
  | { stage: 'error'; error: string }

interface EmailVerificationModalProps {
  open: boolean
  onSuccess: (user: AuthUser) => void
  onError?: (error: string) => void
  onClose?: () => void
}

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type EmailFormData = z.infer<typeof emailSchema>

export function EmailVerificationModal({
  open,
  onSuccess,
  onError,
  onClose
}: EmailVerificationModalProps) {
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
        'Something went wrong. Please contact support@uni-feedback.com'

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
          <>
            <DialogHeader>
              <DialogTitle>You're almost there!</DialogTitle>
              <DialogDescription>
                To keep our feedback authentic, we need to verify you're a
                student with your university email.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleEmailSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className="text-sm"
                          placeholder="your.email@university.edu"
                          {...field}
                          disabled={modalState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={modalState.isSubmitting}
                >
                  {modalState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" />
                      <span>Send verification link</span>
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}

        {modalState.stage === 'polling' && (
          <>
            <DialogHeader>
              <DialogTitle>Check your email</DialogTitle>
              <DialogDescription>
                We sent a verification link to
                <br />
                <span className="font-semibold">{modalState.email}</span>.
                <br />
                Please check your email and click the link.
                <br />
                <span className="text-xs mt-2 block">
                  Don't see the email? Check your spam folder or trash bin.
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualPollCheck}
                >
                  I already clicked the link
                </Button>
                <Button variant="outline" size="sm" onClick={handleTryAgain}>
                  Try again
                </Button>
              </div>
            </div>
          </>
        )}

        {modalState.stage === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>Email verified!</DialogTitle>
              <DialogDescription>Submitting your feedback...</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="size-8 text-green-600" />
              </div>
            </div>
          </>
        )}

        {modalState.stage === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>Verification failed</DialogTitle>
              <DialogDescription>{modalState.error}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col space-y-2">
              <Button onClick={handleTryAgain} className="w-full">
                Try again
              </Button>
              {onError && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onError(modalState.error)
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
