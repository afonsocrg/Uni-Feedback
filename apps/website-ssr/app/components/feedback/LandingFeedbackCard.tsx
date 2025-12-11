import type { Feedback } from '@uni-feedback/db/schema'
import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'

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

function getRelativeTime(date: Date | null): string {
  if (!date) return 'Recently'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60) return '1 month ago'
  return `${Math.floor(diffDays / 30)} months ago`
}

export function LandingFeedbackCard({ feedback }: LandingFeedbackCardProps) {
  const maxCommentLength = 150

  const truncatedComment =
    feedback.comment && feedback.comment.length > maxCommentLength
      ? feedback.comment.slice(0, maxCommentLength).trim() + '...'
      : feedback.comment

  const relativeTime = getRelativeTime(feedback.approvedAt)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Course and faculty info */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
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
