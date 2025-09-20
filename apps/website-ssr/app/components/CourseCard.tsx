import { SelectionCard } from '.'
import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'

interface CourseCardProps {
  courseId: number
  acronym: string
  name: string
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
  useAcronymAsTitle?: boolean
  hasMandatoryExam?: boolean | null
  href?: string
}

export function CourseCard({
  courseId,
  acronym,
  name,
  averageRating,
  averageWorkload,
  totalFeedbackCount,
  useAcronymAsTitle = false,
  hasMandatoryExam,
  href
}: CourseCardProps) {
  const title = useAcronymAsTitle ? acronym : name
  const subtitle = useAcronymAsTitle ? name : acronym

  return (
    <SelectionCard
      title={title}
      subtitle={subtitle}
      href={href}
      className="flex flex-col"
    >
      <div className="flex flex-col mt-auto space-between">
        {/* Two-column layout for bottom section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column - Feedback Information */}
          <div className="flex flex-col justify-end">
            {totalFeedbackCount === 0 ? (
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.open(`/feedback/new?courseId=${courseId}`, '_blank')
                }}
                variant="link"
                className="p-0 h-auto text-xs justify-start"
              >
                Give the first
                <br />
                feedback!
              </Button>
            ) : (
              <div className="space-y-1">
                <span className="text-xs text-gray-500">
                  (
                  {totalFeedbackCount === 1
                    ? '1 review'
                    : `${totalFeedbackCount} reviews`}
                  )
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">
                    ({Number(averageRating || 0).toFixed(1)})
                  </span>
                  <StarRating value={Number(averageRating || 0)} size="sm" />
                </div>
                <div className="flex items-center gap-1">
                  {Number(averageWorkload || 0) > 0 ? (
                    <WorkloadRatingDisplay rating={Number(averageWorkload || 0)} />
                  ) : (
                    <span className="text-xs text-gray-500">
                      No workload data
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Right Column - Terms and Mandatory Exam */}
          <div className="flex flex-col gap-2 justify-end">
            {hasMandatoryExam && (
              <span className="text-xs text-gray-500 ml-auto text-right">
                📝 Exam
                <br />
                mandatory
              </span>
            )}
          </div>
        </div>
      </div>
    </SelectionCard>
  )
}