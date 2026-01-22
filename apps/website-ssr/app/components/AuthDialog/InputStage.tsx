import {
  Button,
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
import { Loader2, Mail } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

export interface EmailFormData {
  email: string
}
export interface InputStageProps {
  form: UseFormReturn<EmailFormData>
  modalState: { stage: 'input'; isSubmitting: boolean }
  onSubmit: (values: EmailFormData) => Promise<void>
  allowedEmailSuffixes?: string[]
  universityName?: string
  title?: string
  description?: string
}
export function InputStage({
  form,
  modalState,
  onSubmit,
  allowedEmailSuffixes,
  universityName,
  title,
  description
}: InputStageProps) {
  const email = form.watch('email')
  const isValidEmail =
    email !== undefined && email !== null && email.includes('@')

  // Check if email domain matches allowed suffixes
  const validateEmailDomain = (email: string): boolean => {
    if (!allowedEmailSuffixes?.length) return true
    const emailDomain = email.split('@')[1]?.toLowerCase()
    if (!emailDomain) return false
    return allowedEmailSuffixes.some(
      (suffix) => emailDomain === suffix.toLowerCase()
    )
  }
  const isValidDomain = validateEmailDomain(email)
  const showDomainError = isValidEmail && !isValidDomain

  // Format allowed suffixes for display
  const formattedSuffixes = allowedEmailSuffixes?.length
    ? allowedEmailSuffixes.map((s) => `@${s}`).join(' or ')
    : null

  // Default descriptions based on whether universityName is provided
  const defaultDescription = universityName
    ? `Enter your ${universityName} email to verify you're a student.`
    : "Please verify you're a student with your university email."

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title ?? 'Verify your email'}</DialogTitle>
        <DialogDescription>
          {description ?? defaultDescription}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.stopPropagation()
            form.handleSubmit(onSubmit)(e)
          }}
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
                    placeholder={
                      allowedEmailSuffixes?.length
                        ? `your.email@${allowedEmailSuffixes[0]}`
                        : 'your.email@university.edu'
                    }
                    {...field}
                    disabled={modalState.isSubmitting}
                  />
                </FormControl>
                {showDomainError && formattedSuffixes && (
                  <p className="text-sm text-amber-600">
                    Please use an email ending with {formattedSuffixes}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={modalState.isSubmitting || showDomainError}
          >
            {modalState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Mail className="size-4" />
                <span>Send verification code</span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </>
  )
}
