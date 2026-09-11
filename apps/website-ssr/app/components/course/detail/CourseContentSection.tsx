import type { CorrectionRequestField } from '@uni-feedback/api-client'
import { Button, Markdown } from '@uni-feedback/ui'
import { FilePlus2, PenLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { analytics } from '~/utils/analytics'
import { CorrectionRequestDialog, type CourseContentField } from '.'

interface CourseContentSectionProps {
  course: {
    id: number
    name: string
  }
  /** Which course field this section renders, also the correction field. */
  field: CourseContentField
  content?: string | null
  /**
   * Open the correction dialog on arrival, targeted at this field.
   *
   * Set by a `?correct=` deep link, which is how a chat answer that reported the
   * field as missing hands the student straight to the editor. The chat owns no
   * contribution UI of its own: everything it needs already lives here.
   */
  autoOpen?: boolean
}

/**
 * A long-form course section (description / assessment / bibliography). These
 * are crowd-maintained: when we have nothing the section asks students to write
 * it, and when we do it offers an edit, both through the correction dialog with
 * the field already chosen.
 */
export function CourseContentSection({
  course,
  field,
  content,
  autoOpen = false
}: CourseContentSectionProps) {
  const { t } = useTranslation('course')
  const [dialogOpen, setDialogOpen] = useState(false)
  // Sticks for the life of the dialog, so the submit event is attributed to the
  // link that opened it rather than to the section it happens to live in.
  const [fromDeepLink, setFromDeepLink] = useState(false)
  const hasContent = Boolean(content?.trim())

  // Inactive tabs aren't mounted, so a mount means the student opened this
  // section: the denominator for "did the CTA get clicked". Guarded so a
  // re-render can't inflate it.
  const promptTrackedRef = useRef(false)
  useEffect(() => {
    if (promptTrackedRef.current) return
    promptTrackedRef.current = true
    analytics.correction.contributePromptViewed({
      courseId: course.id,
      field,
      hasExistingContent: hasContent
    })
  }, [course.id, field, hasContent])

  const openDialog = (fromChat = false) => {
    analytics.correction.dialogOpened({
      courseId: course.id,
      entryPoint: fromChat ? 'chat_answer' : 'content_section',
      prefilledField: field,
      hasExistingContent: hasContent
    })
    setFromDeepLink(fromChat)
    setDialogOpen(true)
  }

  // Once, on arrival. Re-opening every time the component re-renders would trap
  // anyone who closes it.
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (!autoOpen || autoOpenedRef.current) return
    autoOpenedRef.current = true
    openDialog(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen])

  const getCurrentValue = (requestedField: CorrectionRequestField) =>
    requestedField === field ? (content ?? undefined) : undefined

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {t(`tabs.${field}`)}
        </h2>
        {hasContent && (
          <button
            onClick={() => openDialog()}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline cursor-pointer inline-flex items-center gap-1.5 flex-shrink-0"
          >
            <PenLine className="size-3.5" />
            {t('correction.suggest_edit')}
          </button>
        )}
      </div>

      {hasContent ? (
        <>
          <Markdown>{content ?? ''}</Markdown>
          <p className="mt-6 text-sm text-muted-foreground">
            {t(`${field}.outdated_help`)}{' '}
            <button
              onClick={() => openDialog()}
              className="text-primaryBlue hover:underline cursor-pointer font-medium"
            >
              {t('correction.suggest_edit')}
            </button>
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-tint-blue">
            <FilePlus2 className="size-5 text-tint-blue-fg" />
          </div>
          <p className="font-medium text-foreground">
            {t(`${field}.no_content`)}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t(`${field}.empty_help`)}
          </p>
          <Button
            onClick={() => openDialog()}
            className="mt-5 text-white max-sm:w-full"
          >
            <PenLine className="size-4" />
            {t(`${field}.empty_cta`)}
          </Button>
        </div>
      )}

      <CorrectionRequestDialog
        courseId={course.id}
        courseName={course.name}
        getCurrentValue={getCurrentValue}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entryPoint={fromDeepLink ? 'chat_answer' : 'content_section'}
        defaultField={field}
      />
    </div>
  )
}
