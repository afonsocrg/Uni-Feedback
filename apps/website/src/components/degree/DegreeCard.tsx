import { SelectionCard } from '@components'
import { Degree } from '@services/meicFeedbackAPI'
import { Badge } from '@uni-feedback/ui'
import { motion } from 'framer-motion'
import { BookOpen, MessageSquare } from 'lucide-react'

interface DegreeCardProps {
  degree: Degree
  onClick: () => void
  className?: string
}

export function DegreeCard({ degree, onClick, className }: DegreeCardProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300 }
    }
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      <SelectionCard
        title={degree.name}
        subtitle={
          <div className="flex items-center gap-2">
            <span>{degree.acronym}</span>
            <Badge variant="default">{degree.type}</Badge>
          </div>
        }
        onClick={onClick}
      >
        {(degree.courseCount !== undefined ||
          degree.feedbackCount !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-auto">
            {degree.courseCount !== undefined && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{degree.courseCount} courses</span>
              </div>
            )}
            {degree.feedbackCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{degree.feedbackCount} feedback</span>
              </div>
            )}
          </div>
        )}
      </SelectionCard>
    </motion.div>
  )
}
