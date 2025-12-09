import type { Feedback } from '@uni-feedback/db/schema'
import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'

interface LandingFeedbackCardProps {
  feedback: Feedback
}

export function LandingFeedbackCard({ feedback }: LandingFeedbackCardProps) {
  const maxCommentLength = 150

  const truncatedComment =
    feedback.comment && feedback.comment.length > maxCommentLength
      ? feedback.comment.slice(0, maxCommentLength).trim() + '...'
      : feedback.comment

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
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
    </div>
  )
}
