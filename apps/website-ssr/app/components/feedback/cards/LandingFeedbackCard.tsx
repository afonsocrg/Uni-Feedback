import type { Feedback } from '@uni-feedback/db/schema'
import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getFeedbackPermalink, getRelativeTime } from '@uni-feedback/utils'
import { FeedbackMarkdown } from '~/components'
import { getTruncatedText } from '~/lib/textUtils'

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

  const href = getFeedbackPermalink(feedback.courseId, feedback.id)

  return (
    <a
      href={href}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all flex flex-col"
    >
      {/* Ratings row */}
      <div className="flex items-center justify-between mb-3">
        <StarRating value={feedback.rating} size="sm" />
        {feedback.workloadRating && (
          <WorkloadRatingDisplay rating={feedback.workloadRating} />
        )}
      </div>

      {/* Comment */}
      <div>
        {truncatedComment ? (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed line-clamp-4 text-start">
            <FeedbackMarkdown>{truncatedComment}</FeedbackMarkdown>
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">No comment left</p>
        )}
      </div>

      {/* Footer: course + faculty + timestamp */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700 truncate">
          {feedback.course.name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-400">
            {feedback.course.degree?.faculty.shortName ?? 'University'}
          </p>
          <p className="text-xs text-gray-400">
            {getRelativeTime(feedback.createdAt)}
          </p>
        </div>
      </div>
    </a>
  )
}
