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
import { useTranslation } from 'react-i18next'
import { CategoryChip } from '~/components'

interface FeedbackCategoryChipsProps {
  categories: FeedbackCategories | null
  isLoading: boolean
  orientation?: 'horizontal' | 'vertical'
  onHelpClick?: () => void
}

const CATEGORY_CONFIG: Record<
  keyof FeedbackCategories,
  { translationKey: string; icon: LucideIcon }
> = {
  hasTeaching: {
    translationKey: 'form.categories.teaching',
    icon: GraduationCap
  },
  hasAssessment: {
    translationKey: 'form.categories.assessment',
    icon: ClipboardCheck
  },
  hasMaterials: { translationKey: 'form.categories.materials', icon: BookOpen },
  hasTips: { translationKey: 'form.categories.tips', icon: Lightbulb }
}

export function FeedbackCategoryChips({
  categories,
  isLoading,
  orientation = 'horizontal',
  onHelpClick
}: FeedbackCategoryChipsProps) {
  const t = useTranslation('feedback').t as (key: string) => string
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
          { translationKey: string; icon: LucideIcon }
        ][]
      ).map(([key, { translationKey, icon }]) => {
        const isActive = categories?.[key] ?? false
        const label = t(translationKey)
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
          className="size-4 animate-spin text-muted-foreground"
          aria-label="Categorizing feedback"
        />
      )}

      {/* Help icon at the end */}
      {onHelpClick && (
        <button
          type="button"
          onClick={onHelpClick}
          className="text-muted-foreground hover:text-muted-foreground cursor-pointer transition-colors ml-0.5"
          aria-label="Feedback tips"
        >
          <HelpCircle className="size-3.5" />
        </button>
      )}
    </div>
  )
}
