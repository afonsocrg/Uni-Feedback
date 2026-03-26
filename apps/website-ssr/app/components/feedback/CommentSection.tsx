import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RichTextEditor
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
            <FormLabel className="text-base font-medium text-gray-900">
              Share your experience
            </FormLabel>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">
                What might be helpful to mention:
              </p>
              <FeedbackCategoryChips
                categories={categories}
                isLoading={isCategorizing}
              />
            </div>
            <FormControl>
              <RichTextEditor
                placeholder="What should other students know? (e.g., tips for the exam, how to handle the labs...)"
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormDescription className="text-[11px] text-gray-400 text-right flex gap-2">
              <span className="flex items-start justify-between gap-4 w-full">
                <span className="flex-1 text-start">
                  This field is optional, but it's the one that helps other
                  students the most ❤️
                </span>

                <button
                  type="button"
                  onClick={() => setShowReviewTips(true)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer transition-colors flex-shrink-0"
                  aria-label="Feedback tips"
                >
                  <HelpCircle className="size-3.5" />
                </button>
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
