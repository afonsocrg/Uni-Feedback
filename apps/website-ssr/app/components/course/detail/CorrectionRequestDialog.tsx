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
import { RichTextEditor } from '@uni-feedback/ui/components/custom/RichTextEditor'
import { Loader2, PenLine } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthenticatedButton } from '~/components'
import { analytics, type CorrectionEntryPoint } from '~/utils/analytics'
import { isCourseContentField } from './courseContentFields'

const correctionFormSchema = z.object({
  field: z.enum(CORRECTION_REQUEST_FIELDS),
  notes: z.string()
})

type CorrectionFormData = z.infer<typeof correctionFormSchema>

interface CorrectionRequestDialogProps {
  courseId: number
  courseName: string
  getCurrentValue: (field: CorrectionRequestField) => string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Segments the funnel by where the dialog was opened from. */
  entryPoint: CorrectionEntryPoint
  /**
   * Pre-selects the field, for entry points that already know which piece of
   * course data the student is looking at.
   */
  defaultField?: CorrectionRequestField
}

export function CorrectionRequestDialog({
  courseId,
  courseName,
  getCurrentValue,
  open,
  onOpenChange,
  entryPoint,
  defaultField
}: CorrectionRequestDialogProps) {
  const { t } = useTranslation('course')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Built here rather than at module scope so the validation message is
  // translated, and re-translated when the user switches language. Refined on
  // the object so the message can depend on the field: for a content field the
  // box holds the section's text, not a description of what's wrong.
  const localizedSchema = useMemo(
    () =>
      correctionFormSchema.superRefine((data, ctx) => {
        if (data.notes.trim()) return
        ctx.addIssue({
          code: 'custom',
          path: ['notes'],
          message: isCourseContentField(data.field)
            ? t('correction.content_required')
            : t('correction.notes_required')
        })
      }),
    [t]
  )

  const form = useForm<CorrectionFormData>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      field: defaultField,
      notes: ''
    }
  })

  const selectedField = form.watch('field')
  const currentValue = selectedField
    ? getCurrentValue(selectedField)
    : undefined
  const hasExistingContent = Boolean(currentValue?.trim())
  // Narrowed rather than a boolean so the per-field prompt key stays typed.
  const contentField =
    selectedField && isCourseContentField(selectedField)
      ? selectedField
      : undefined
  // Nothing to correct yet, so the dialog asks for a contribution instead.
  const isContribution = Boolean(selectedField) && !hasExistingContent

  // Seeds the editor with what the page shows today so students edit in place
  // rather than retype. Reloading on every field change is what keeps one
  // field's text from being submitted against another; the cost is that
  // deliberately switching fields drops a draft. Deps deliberately exclude
  // `notes`, so this never fires while the student is writing.
  const seed =
    selectedField && isCourseContentField(selectedField)
      ? (currentValue ?? '')
      : ''
  useEffect(() => {
    if (!open) return
    form.setValue('notes', seed)
  }, [open, seed, form])

  const handleSubmit = async (data: CorrectionFormData) => {
    setIsSubmitting(true)
    try {
      await submitCorrectionRequest(courseId, {
        field: data.field,
        notes: data.notes,
        currentValue: getCurrentValue(data.field)
      })
      analytics.correction.submitted({
        courseId,
        field: data.field,
        entryPoint,
        hasExistingContent
      })
      setIsSuccess(true)
    } catch {
      analytics.correction.submissionFailed({
        courseId,
        field: data.field,
        entryPoint,
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
        entryPoint,
        fieldSelected: Boolean(field),
        // The seeded text is ours, not theirs, so it doesn't count as progress.
        // The editor normalizes the markdown it is handed, so an untouched seed
        // can still read as a small edit here.
        hasNotes: Boolean(notes?.trim()) && notes.trim() !== seed.trim()
      })
    }
    onOpenChange(false)
    setTimeout(() => {
      setIsSuccess(false)
      form.reset({ field: defaultField, notes: '' })
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-5 text-primaryBlue" />
            {isContribution
              ? t('correction.contribute_title')
              : t('correction.title')}
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
                i18nKey={
                  isContribution
                    ? 'correction.contribute_description'
                    : 'correction.description'
                }
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
                {/*
                  Entry points that pre-fill the field know about that one field
                  only, `getCurrentValue` included, so the choice is fixed: the
                  section this was opened from names itself on the editor label
                  below instead.
                */}
                {!defaultField && (
                  <FormField
                    control={form.control}
                    name="field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isContribution
                            ? t('correction.field_label_contribute')
                            : t('correction.field_label')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
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
                )}

                {/* Single-value fields aren't retyped, so show what we have. */}
                {!contentField && hasExistingContent && (
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t('correction.current_value_label')}
                    </p>
                    <p className="text-sm text-foreground break-words">
                      {currentValue}
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {defaultField
                          ? t(`correction.fields.${defaultField}`)
                          : contentField
                            ? t('correction.content_label')
                            : t('correction.notes_label')}
                      </FormLabel>
                      {/* The question that tells students what to write. */}
                      {contentField && (
                        <p className="text-xs text-muted-foreground">
                          {t(`correction.prompts.${contentField}`)}
                        </p>
                      )}
                      <FormControl>
                        {contentField ? (
                          // The section is markdown, so students get the same
                          // editor they write reviews in rather than raw syntax.
                          <RichTextEditor
                            placeholder={t('correction.content_placeholder')}
                            value={field.value}
                            onChange={field.onChange}
                            minHeight="180px"
                            className="max-h-[45vh] overflow-y-auto"
                            showBubbleMenu
                          />
                        ) : (
                          <Textarea
                            placeholder={t('correction.notes_placeholder')}
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        )}
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
