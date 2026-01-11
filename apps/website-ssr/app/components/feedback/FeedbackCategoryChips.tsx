import type { FeedbackCategories } from '@uni-feedback/api-client'
import { Loader2 } from 'lucide-react'
import { CategoryChip } from '~/components'

interface FeedbackCategoryChipsProps {
  categories: FeedbackCategories | null
  isLoading: boolean
  orientation?: 'horizontal' | 'vertical'
}

const CATEGORY_CONFIG: Record<keyof FeedbackCategories, { label: string }> = {
  hasTeaching: { label: 'Teaching' },
  hasAssessment: { label: 'Assessment' },
  hasMaterials: { label: 'Materials' },
  hasTips: { label: 'Tips' }
}

export function FeedbackCategoryChips({
  categories,
  isLoading,
  orientation = 'horizontal'
}: FeedbackCategoryChipsProps) {
  return (
    <div
      className={
        orientation === 'vertical'
          ? 'flex flex-col gap-2'
          : 'flex flex-wrap gap-2 items-center'
      }
      role="status"
      aria-live="polite"
      aria-label="Feedback categories"
    >
      {/* Show all category chips - active ones highlighted, inactive ones muted */}
      {(
        Object.entries(CATEGORY_CONFIG) as [
          keyof FeedbackCategories,
          { label: string }
        ][]
      ).map(([key, { label }]) => {
        const isActive = categories?.[key] ?? false
        return (
          <CategoryChip
            key={key}
            label={label}
            isActive={isActive}
            aria-label={`Category: ${label}${isActive ? ' (active)' : ''}`}
          />
        )
      })}

      {/* Show loading spinner when categorizing */}
      {isLoading && (
        <Loader2
          className="size-4 animate-spin text-gray-400"
          aria-label="Categorizing feedback"
        />
      )}
    </div>
  )
}
