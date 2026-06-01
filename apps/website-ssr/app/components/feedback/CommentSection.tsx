import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@uni-feedback/ui'
import { RichTextEditor } from '@uni-feedback/ui/components/custom/RichTextEditor'
import { useEffect, useState } from 'react'
import type { Control, FieldValues } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ReviewTipsDialog } from '~/components'
import { useDebounce } from '~/hooks'
import { useFeedbackCategorization } from '~/hooks/useFeedbackCategorization'
import { FeedbackCategoryChips } from './FeedbackCategoryChips'

type WithComment = FieldValues & { comment?: string }

interface CommentSectionProps<T extends WithComment> {
  control: Control<T>
  onDebouncedChange?: (comment: string) => void
}

export function CommentSection<T extends WithComment>({
  control,
  onDebouncedChange
}: CommentSectionProps<T>) {
  const { t } = useTranslation('feedback')
  const [showReviewTips, setShowReviewTips] = useState(false)

  // Narrowed to Control<FieldValues> so react-hook-form's useWatch/FormField accept
  // the literal string 'comment' as a valid Path — the generic T guarantees the field exists.
  const baseControl = control as Control<FieldValues>

  const comment =
    (useWatch({ control: baseControl, name: 'comment' }) as string) || ''

  // Debounce comment for draft saving (500ms)
  const debouncedComment = useDebounce(comment, 500)

  // Call the debounced change callback when debounced comment changes
  useEffect(() => {
    if (onDebouncedChange) {
      onDebouncedChange(debouncedComment)
    }
  }, [debouncedComment, onDebouncedChange])

  // Categorize with 1000ms debounce
  const { categories, isLoading: isCategorizing } = useFeedbackCategorization(
    comment,
    { debounceMs: 1000, minCharacters: 5 }
  )

  return (
    <>
      <FormField
        name="comment"
        control={baseControl}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              {t('form.comment_label')}
            </FormLabel>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">{t('form.comment_hint')}</p>
              <FeedbackCategoryChips
                categories={categories}
                isLoading={isCategorizing}
                onHelpClick={() => setShowReviewTips(true)}
              />
            </div>
            <FormControl>
              <RichTextEditor
                placeholder={t('form.comment_placeholder')}
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <ReviewTipsDialog
        open={showReviewTips}
        onOpenChange={setShowReviewTips}
      />
    </>
  )
}
