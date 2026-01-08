import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
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
import { Lightbulb } from 'lucide-react'
import { FeedbackCategoryChips } from './FeedbackCategoryChips'
import { useFeedbackCategorization } from '~/hooks/useFeedbackCategorization'

interface CommentSectionProps {
  control: Control<any>
  showReviewTips: boolean
  setShowReviewTips: (show: boolean) => void
}

export function CommentSection({
  control,
  showReviewTips,
  setShowReviewTips
}: CommentSectionProps) {
  // Only this component watches the comment field - uses useWatch not form.watch
  const comment = useWatch({ control, name: 'comment' }) || ''

  // Categorize with 1000ms debounce
  const { categories, isLoading: isCategorizing } = useFeedbackCategorization(
    comment,
    { debounceMs: 1000, minCharacters: 5 }
  )

  // Memoize word count to avoid recalculation
  const wordCount = useMemo(() => countWords(comment), [comment])

  return (
    <FormField
      name="comment"
      control={control}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Write your feedback</FormLabel>
            <button
              type="button"
              onClick={() => setShowReviewTips(true)}
              className="text-sm text-primaryBlue hover:text-primaryBlue/80 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Lightbulb className="size-4" />
              Feedback tips
            </button>
          </div>
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
            <div className="flex items-start justify-between gap-4 w-full">
              <p className="text-xs text-gray-700 mb-2 flex-1 text-start">
                This field is optional, but it's the one that helps other
                students the most ❤️
              </p>

              <p className="text-xs text-gray-700 whitespace-nowrap flex-shrink-0">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </p>
            </div>
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
