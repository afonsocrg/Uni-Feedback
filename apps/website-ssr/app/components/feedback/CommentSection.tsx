import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  MarkdownTextarea
} from '@uni-feedback/ui'
import { countWords } from '@uni-feedback/utils'
import { HelpCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Control } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { ReviewTipsDialog } from '~/components'
import { useDebounce } from '~/hooks'
import { useFeedbackCategorization } from '~/hooks/useFeedbackCategorization'
import { FeedbackCategoryChips } from './FeedbackCategoryChips'

interface CommentSectionProps {
  control: Control<any>
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

  // Memoize word count to avoid recalculation
  const wordCount = useMemo(() => countWords(comment), [comment])

  return (
    <>
      <FormField
        name="comment"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Tell us about the course.
              <button
                type="button"
                onClick={() => setShowReviewTips(true)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer ml-1"
                aria-label="Feedback tips"
              >
                <HelpCircle className="size-4" />
              </button>
            </FormLabel>
            <FeedbackCategoryChips
              categories={categories}
              isLoading={isCategorizing}
            />
            <FormControl>
              <MarkdownTextarea
                placeholder="What should others know about this course?"
                previewPlaceholder="This is how your feedback will appear on the website"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-700 text-right flex gap-2">
              <span className="flex items-start justify-between gap-4 w-full">
                <span className="text-xs text-gray-700 mb-2 flex-1 text-start">
                  This field is optional, but it's the one that helps other
                  students the most ❤️
                </span>

                <span className="text-xs text-gray-700 whitespace-nowrap flex-shrink-0">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              </span>
            </FormDescription>
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
