import { zodResolver } from '@hookform/resolvers/zod'
import {
  CORRECTION_REQUEST_FIELDS,
  submitCorrectionRequest,
  type CorrectionRequestField
} from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@uni-feedback/ui'
import { Loader2, PenLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthenticatedButton } from '~/components'
import { analytics } from '~/utils/analytics'

const correctionFormSchema = z.object({
  field: z.enum(CORRECTION_REQUEST_FIELDS),
  notes: z.string().min(1)
})

type CorrectionFormData = z.infer<typeof correctionFormSchema>

interface CorrectionRequestDialogProps {
  courseId: number
  courseName: string
  getCurrentValue: (field: CorrectionRequestField) => string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CorrectionRequestDialog({
  courseId,
  courseName,
  getCurrentValue,
  open,
  onOpenChange
}: CorrectionRequestDialogProps) {
  const { t } = useTranslation('course')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Built here rather than at module scope so the validation message is
  // translated, and re-translated when the user switches language.
  const localizedSchema = useMemo(
    () =>
      correctionFormSchema.extend({
        notes: z.string().min(1, t('correction.notes_required'))
      }),
    [t]
  )

  const form = useForm<CorrectionFormData>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      field: undefined,
      notes: ''
    }
  })

  const handleSubmit = async (data: CorrectionFormData) => {
    setIsSubmitting(true)
    try {
      await submitCorrectionRequest(courseId, {
        field: data.field,
        notes: data.notes,
        currentValue: getCurrentValue(data.field)
      })
      analytics.correction.submitted({ courseId, field: data.field })
      setIsSuccess(true)
    } catch {
      analytics.correction.submissionFailed({
        courseId,
        field: data.field,
        errorType: 'api_error'
      })
      toast.error(t('correction.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Closing the success screen is a completed flow, not an abandonment.
    if (!isSuccess) {
      const { field, notes } = form.getValues()
      analytics.correction.dialogDismissed({
        courseId,
        fieldSelected: Boolean(field),
        hasNotes: Boolean(notes?.trim())
      })
    }
    onOpenChange(false)
    setTimeout(() => {
      setIsSuccess(false)
      form.reset()
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-5 text-primaryBlue" />
            {t('correction.title')}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/15 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {t('correction.success_title')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('correction.success_description')}
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              {t('correction.close')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              <Trans
                i18nKey="correction.description"
                ns="course"
                values={{ courseName }}
                components={{
                  name: <span className="font-medium text-foreground" />
                }}
              />
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('correction.field_label')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t('correction.field_placeholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CORRECTION_REQUEST_FIELDS.map((value) => (
                            <SelectItem key={value} value={value}>
                              {t(`correction.fields.${value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('correction.notes_label')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('correction.notes_placeholder')}
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {t('correction.cancel')}
                  </Button>
                  <AuthenticatedButton
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{t('correction.submitting')}</span>
                      </>
                    ) : (
                      t('correction.submit')
                    )}
                  </AuthenticatedButton>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
