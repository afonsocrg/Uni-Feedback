import type { Degree } from '@uni-feedback/db/schema'
import { Chip } from '@uni-feedback/ui'
import { BookOpen, MessageSquare } from 'lucide-react'
import { SelectionCard } from '../SelectionCard'

interface DegreeCardProps {
  degree: Degree & {
    courseCount?: number
    feedbackCount?: number
  }
  href: string
  onClick?: () => void
}

export function DegreeCard({ degree, href, onClick }: DegreeCardProps) {
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
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-auto">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{degree.courseCount ?? 0} courses</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          <span>
            {degree.feedbackCount ?? 0} feedback
            {(degree.feedbackCount ?? 0) == 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </SelectionCard>
  )
}
