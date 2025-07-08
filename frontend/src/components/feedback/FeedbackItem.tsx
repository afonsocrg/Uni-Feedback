import { Markdown, StarRating } from '@components'
import { Feedback } from '@services/meicFeedbackAPI'
import { getWorkloadColor, getWorkloadLabel } from '@/lib/workload'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

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
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(feedback.workloadRating)}`}
              >
                <Clock className="w-3 h-3 mr-1.5" />
                Workload: ({feedback.workloadRating}/5) {getWorkloadLabel(feedback.workloadRating)}
              </div>
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
            {feedback.comment}
          </Markdown>
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm">
          This user did not leave any comment
        </p>
      )}
    </motion.div>
  )
}
