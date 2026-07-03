import { Chip } from '@uni-feedback/ui'
import { BookOpen, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectionCard } from '~/components'

interface DegreeCardProps {
  degree: {
    name: string
    acronym: string
    type: string
    courseCount?: number
    feedbackCount?: number
  }
  href: string
  onClick?: () => void
}

export function DegreeCard({ degree, href, onClick }: DegreeCardProps) {
  const { t } = useTranslation('browse')
  return (
    <SelectionCard
      title={degree.name}
      subtitle={
        <div className="flex items-center gap-2">
          <span>{degree.acronym}</span>
          <Chip label={degree.type} />
        </div>
      }
      href={href}
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-auto">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>
            {t('browse_section.course_count', {
              count: degree.courseCount ?? 0
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          <span>
            {t('browse_section.feedback_count', {
              count: degree.feedbackCount ?? 0
            })}
          </span>
        </div>
      </div>
    </SelectionCard>
  )
}
