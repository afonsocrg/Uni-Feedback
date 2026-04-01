import type { FeedbackCategories } from '@uni-feedback/api-client'
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Loader2,
  type LucideIcon
} from 'lucide-react'
import { CategoryChip } from '~/components'

interface FeedbackCategoryChipsProps {
  categories: FeedbackCategories | null
  isLoading: boolean
  orientation?: 'horizontal' | 'vertical'
  onHelpClick?: () => void
}

const CATEGORY_CONFIG: Record<
  keyof FeedbackCategories,
  { label: string; icon: LucideIcon }
> = {
  hasTeaching: { label: 'Teaching', icon: GraduationCap },
  hasAssessment: { label: 'Assessment', icon: ClipboardCheck },
  hasMaterials: { label: 'Materials', icon: BookOpen },
  hasTips: { label: 'Tips', icon: Lightbulb }
}

export function FeedbackCategoryChips({
  categories,
  isLoading,
  orientation = 'horizontal',
  onHelpClick
}: FeedbackCategoryChipsProps) {
  return (
    <div
      className={
        orientation === 'vertical'
          ? 'flex flex-col gap-0.5'
          : 'flex flex-wrap gap-1 items-center'
      }
      role="status"
      aria-live="polite"
      aria-label="Feedback categories"
    >
      {/* Show all category chips - active ones highlighted, inactive ones muted */}
      {(
        Object.entries(CATEGORY_CONFIG) as [
          keyof FeedbackCategories,
          { label: string; icon: LucideIcon }
        ][]
      ).map(([key, { label, icon }]) => {
        const isActive = categories?.[key] ?? false
        return (
          <CategoryChip
            key={key}
            label={label}
            icon={icon}
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

      {/* Help icon at the end */}
      {onHelpClick && (
        <button
          type="button"
          onClick={onHelpClick}
          className="text-gray-400 hover:text-gray-500 cursor-pointer transition-colors ml-0.5"
          aria-label="Feedback tips"
        >
          <HelpCircle className="size-3.5" />
        </button>
      )}
    </div>
  )
}
