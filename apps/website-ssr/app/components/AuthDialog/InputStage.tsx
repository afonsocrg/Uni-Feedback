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
  Input,
  cn
} from '@uni-feedback/ui'
import { Loader2, Mail } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { analytics } from '~/utils/analytics'

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
  /**
   * A way out for someone who has no university email.
   *
   * Shown before they type, not after a rejection: the address requirement is
   * unusual and it excludes people, so discovering it by being turned away is
   * discovering it too late. When the typed domain is one we cannot verify, the
   * explanation replaces the generic suffix line and this becomes the obvious
   * next step, because there is nothing else they can do.
   */
  noUniversityEmail?: {
    label: string
    onClick: () => void
    explanation: string
  }
  /** Where this sign-in was asked for, carried on the auth events. */
  trigger?: string
}
export function InputStage({
  form,
  modalState,
  onSubmit,
  allowedEmailSuffixes,
  universityName,
  title,
  description,
  noUniversityEmail,
  trigger
}: InputStageProps) {
  // Same `auth.*` keys the login page uses: these are the same strings shown in
  // the same flow, so they should not drift apart in two places.
  const { t } = useTranslation('feedback')
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

  /**
   * Someone we cannot serve, told us who they are.
   *
   * Reported once per distinct domain rather than on every keystroke, because
   * typing an address fires this component's render a dozen times and a dozen
   * events would make the number meaningless.
   */
  const reportedDomains = useRef(new Set<string>())
  useEffect(() => {
    if (!showDomainError) return
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain || reportedDomains.current.has(domain)) return
    reportedDomains.current.add(domain)
    analytics.auth.unsupportedDomain({ emailDomain: domain, trigger })
  }, [showDomainError, email, trigger])

  // Format allowed suffixes for display
  const formattedSuffixes = allowedEmailSuffixes?.length
    ? allowedEmailSuffixes.map((s) => `@${s}`).join(' or ')
    : null

  // Default descriptions based on whether universityName is provided
  const defaultDescription = universityName
    ? t('auth.email_required_desc_university', { university: universityName })
    : t('auth.email_required_desc')

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title ?? t('auth.title')}</DialogTitle>
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
                <FormLabel>{t('auth.email_label')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    className="text-sm"
                    placeholder={
                      // Only when there is one university in play. With the full
                      // whitelist passed in, naming the first one would read as
                      // "we only take IST".
                      allowedEmailSuffixes?.length === 1
                        ? `your.email@${allowedEmailSuffixes[0]}`
                        : t('auth.placeholder')
                    }
                    {...field}
                    disabled={modalState.isSubmitting}
                  />
                </FormControl>
                {showDomainError &&
                  (noUniversityEmail ? (
                    // Explanation only, no action. The way out already lives
                    // below and never moves, so putting a second copy of it here
                    // would show the same offer twice.
                    //
                    // Listing every accepted domain is also the wrong thing to
                    // say once there are more than a couple: the person is not
                    // mistyping, they are outside the set we cover.
                    <p className="text-sm text-warning">
                      {noUniversityEmail.explanation}
                    </p>
                  ) : (
                    formattedSuffixes && (
                      <p className="text-sm text-warning">
                        {t('auth.domain_error', {
                          suffixes: formattedSuffixes
                        })}
                      </p>
                    )
                  ))}
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
                <span>{t('auth.sending')}</span>
              </>
            ) : (
              <>
                <Mail className="size-4" />
                <span>{t('auth.submit')}</span>
              </>
            )}
          </Button>
        </form>
      </Form>

      {noUniversityEmail && (
        // One door, in one place, so it does not jump around as they type. It
        // only changes weight: quiet while they are typing something plausible,
        // and the obvious next step once we have said we cannot verify them.
        <button
          type="button"
          onClick={noUniversityEmail.onClick}
          className={cn(
            'cursor-pointer text-center text-sm underline underline-offset-2',
            showDomainError
              ? 'font-medium text-primaryBlue'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {noUniversityEmail.label}
        </button>
      )}
    </>
  )
}
