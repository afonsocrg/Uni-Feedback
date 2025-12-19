import type { Feedback } from '@uni-feedback/db/schema'
import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'

interface LandingFeedbackCardProps {
  feedback: Feedback & {
    course: {
      name: string
      degree: {
        faculty: {
          shortName: string
        }
      } | null
    }
  }
}

export function LandingFeedbackCard({ feedback }: LandingFeedbackCardProps) {
  const maxCommentLength = 150

  const truncatedComment =
    feedback.comment && feedback.comment.length > maxCommentLength
      ? feedback.comment.slice(0, maxCommentLength).trim() + '...'
      : feedback.comment

  const relativeTime = getRelativeTime(feedback.createdAt)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Course and faculty info */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-700 text-sm truncate mb-1">
          {feedback.course.name}
        </h3>
        <p className="text-xs text-gray-500">
          {feedback.course.degree?.faculty.shortName || 'University'}
        </p>
      </div>

      {/* Header with rating and workload */}
      <div className="flex items-center justify-between mb-4">
        <StarRating value={feedback.rating} size="sm" />
        {feedback.workloadRating && (
          <WorkloadRatingDisplay rating={feedback.workloadRating} />
        )}
      </div>

      {/* Comment preview */}
      <div className="flex-1">
        {truncatedComment ? (
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 text-start">
            {truncatedComment}
          </p>
        ) : (
          <p className="text-gray-500 italic text-sm">
            This user did not leave any comment
          </p>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{relativeTime}</p>
      </div>
    </div>
  )
}
