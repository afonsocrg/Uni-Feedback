import type { Feedback } from '@uni-feedback/db/schema'
import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { getTruncatedText } from '~/lib/textUtils'
import { FeedbackMarkdown } from './FeedbackMarkdown'

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
      ? getTruncatedText(feedback.comment, maxCommentLength) + '...'
      : feedback.comment

  const relativeTime = getRelativeTime(feedback.createdAt)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Course and faculty info */}
      <div className="mb-3">
        <a
          href={`/courses/${feedback.courseId}`}
          className="font-medium text-gray-700 text-sm truncate mb-1 hover:text-primary hover:underline transition-colors block"
        >
          {feedback.course.name}
        </a>
        <p className="text-xs text-gray-500">
          {feedback.course.degree?.faculty.shortName || 'University'}
        </p>
      </div>

      {/* Header with rating and workload */}
      <div className="flex flex-wrap items-center mb-4 gap-2">
        <StarRating value={feedback.rating} size="sm" />
        {feedback.workloadRating && (
          <div className="inline-flex items-center text-xs text-gray-500 font-medium">
            <span className="mr-1">Workload:</span>
            <WorkloadRatingDisplay rating={feedback.workloadRating} />
          </div>
        )}
      </div>

      {/* Comment preview */}
      <div className="flex-1">
        {truncatedComment ? (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed line-clamp-4 text-start">
            <FeedbackMarkdown>{truncatedComment}</FeedbackMarkdown>
          </div>
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
