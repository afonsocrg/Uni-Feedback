import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { useLang } from '~/hooks'
import { stripMarkdown } from '~/lib/textUtils'
import { getFeedbackAnchor } from '~/utils/i18n-routes'
import { FeedbackCardFooter } from './FeedbackCardFooter'

interface LandingFeedbackCardProps {
  feedback: {
    id: number
    courseId: number
    rating: number
    workloadRating: number | null
    comment: string | null
    createdAt: Date | null
    course: {
      name: string
      degree: { faculty: { shortName: string } } | null
    }
  }
}

export function LandingFeedbackCard({ feedback }: LandingFeedbackCardProps) {
  const lang = useLang()
  const href = getFeedbackAnchor(lang, feedback.courseId, feedback.id)
  const plainComment = feedback.comment ? stripMarkdown(feedback.comment) : null
  const faculty = feedback.course.degree?.faculty.shortName ?? null

  return (
    <a
      href={href}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all flex flex-col"
    >
      {/* Header: stars + workload badge */}
      <div className="flex items-center justify-between mb-3">
        <StarRating value={feedback.rating} size="sm" />
        {feedback.workloadRating && (
          <WorkloadRatingDisplay rating={feedback.workloadRating} />
        )}
      </div>

      {/* Comment with bottom fade */}
      <div
        className="flex-1 mb-3"
        style={{
          maxHeight: '5.5em',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 60%, transparent 100%)'
        }}
      >
        {plainComment ? (
          <p className="text-sm text-gray-500 leading-snug whitespace-pre-line">
            {plainComment}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No comment left</p>
        )}
      </div>

      <FeedbackCardFooter
        courseName={feedback.course.name}
        facultyShortName={faculty}
        createdAt={feedback.createdAt}
      />
    </a>
  )
}
