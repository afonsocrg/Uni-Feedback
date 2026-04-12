import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RichTextEditor
} from '@uni-feedback/ui'
import { useEffect, useState } from 'react'
import type { Control, FieldValues } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { ReviewTipsDialog } from '~/components'
import { useDebounce } from '~/hooks'
import { useFeedbackCategorization } from '~/hooks/useFeedbackCategorization'
import { FeedbackCategoryChips } from './FeedbackCategoryChips'

interface CommentSectionProps {
  control: Control<FieldValues>
  onDebouncedChange?: (comment: string) => void
}

export function CommentSection({
  control,
  onDebouncedChange
}: CommentSectionProps) {
  // Internal state for review tips dialog
  const [showReviewTips, setShowReviewTips] = useState(false)

  // Only this component watches the comment field - uses useWatch not form.watch
  const comment = useWatch({ control, name: 'comment' }) || ''

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
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              Share your experience
            </FormLabel>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">
                Sharing your thoughts helps others the most! Here are some
                aspects to consider:
              </p>
              <FeedbackCategoryChips
                categories={categories}
                isLoading={isCategorizing}
                onHelpClick={() => setShowReviewTips(true)}
              />
            </div>
            <FormControl>
              <RichTextEditor
                placeholder="What should other students know? (e.g., tips for the exam, how to handle the labs...)"
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
