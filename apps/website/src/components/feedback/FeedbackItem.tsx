import { getTruncatedText } from '@/lib/textUtils'
import { Tooltip } from '@components'
import { Feedback } from '@services/meicFeedbackAPI'
import {
  Button,
  Markdown,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { useState } from 'react'

interface FeedbackItemProps {
  feedback: Feedback
  variants?: {
    hidden: { opacity: number; y: number }
    visible: {
      opacity: number
      y: number
      transition: { type: string; stiffness: number }
    }
  }
}

export function FeedbackItem({ feedback, variants }: FeedbackItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const characterLimit = 600
  const isLongComment =
    feedback.comment && feedback.comment.length > characterLimit

  return (
    <motion.div
      variants={variants}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 hover:shadow-md transition-shadow"
    >
      {/* Header with rating and date */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={feedback.rating} />
            {feedback.workloadRating && (
              <div className="inline-flex items-center px-3 py-1 text-xs text-gray-500 font-medium">
                <span className="mr-1">Workload:</span>
                <WorkloadRatingDisplay rating={feedback.workloadRating} />
              </div>
            )}
            {feedback.isFromDifferentCourse && (
              <Tooltip
                content={`Feedback submitted by a student from ${feedback.degree.name}`}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                  <GraduationCap className="w-3 h-3 mr-1.5" />
                  {feedback.degree.acronym}
                </div>
              </Tooltip>
            )}
          </div>
          <span className="text-gray-400 text-sm">
            {new Date(feedback.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Comment section */}
      {feedback.comment ? (
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <div className="transition-all duration-300 ease-in-out">
            <Markdown
              components={{
                h1: ({ ...props }) => (
                  <h1
                    {...props}
                    className="text-xl font-semibold text-gray-900 mt-4 mb-3"
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    {...props}
                    className="text-lg font-semibold text-gray-900 mt-3 mb-2"
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    {...props}
                    className="text-lg font-semibold text-gray-900 mt-2 mb-1"
                  />
                )
              }}
            >
              {isLongComment && !isExpanded
                ? getTruncatedText(feedback.comment, characterLimit) + '...'
                : feedback.comment}
            </Markdown>
          </div>
          {isLongComment && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 p-0 h-auto text-sm"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm">
          This user did not leave any comment
        </p>
      )}
    </motion.div>
  )
}
