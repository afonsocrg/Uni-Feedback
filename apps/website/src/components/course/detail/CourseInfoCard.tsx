import { addUtmParams } from '@/utils/routes'
import { openWhatsapp } from '@/utils/whatsapp'
import { CopyButton } from '@components'
import { type CourseDetail } from '@services/meicFeedbackAPI'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { ExternalLink, Share2, Users } from 'lucide-react'
import posthog from 'posthog-js'
import { useCallback } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

export interface CourseInfoCardProps {
  course: CourseDetail
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const handleWhatsapp = useCallback(() => {
    posthog.capture('share_course', {
      medium: 'whatsapp',
      course_id: course.id,
      course_acronym: course.acronym
    })

    const shareUrl = addUtmParams(window.location.toString(), 'whatsapp')
    openWhatsapp({
      text: `Check out this course on Uni Feedback: ${shareUrl}`
    })
  }, [course])

  const handleCopyUrl = useCallback(() => {
    posthog.capture('share_course', {
      medium: 'copy_url',
      course_id: course.id,
      course_acronym: course.acronym
    })
    const shareUrl = addUtmParams(window.location.toString(), 'copy_url')
    navigator.clipboard.writeText(shareUrl)
  }, [course])

  const averageWorkload = course.averageWorkload

  return (
    <Card className="mb-8 shadow-sm border border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          {/* First row: Acronym and action buttons */}
          <div className="flex items-end justify-between gap-2">
            <span className="text-lg text-gray-500 font-medium">
              {course.acronym}
            </span>

            <div className="flex items-center gap-2">
              {course.url && (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="size-4" />
                    <span className="hidden sm:block">Course Page</span>
                  </a>
                </Button>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-gray-500"
                  >
                    <Share2 className="size-4" />
                    {/* Share */}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="flex flex-col gap-2">
                    <Button popover variant="ghost" onClick={handleWhatsapp}>
                      <FaWhatsapp className="size-4" />
                      WhatsApp
                    </Button>
                    {navigator.clipboard && (
                      <CopyButton
                        popover
                        variant="ghost"
                        onClick={handleCopyUrl}
                      />
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Second row: Course name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-primaryBlue leading-tight">
            {course.name}
          </h1>

          {/* Third row: Degree chip */}
          <div className="flex flex-wrap gap-2">
            {course.ects && (
              <Chip label={`${course.ects} ECTS`} size="xs" color="gray" />
            )}
            {course.degree && (
              <div className="flex items-center text-xs text-gray-500">
                {course.degree.acronym} - {course.degree.name}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Course Information */}
        <div className="space-y-4 px-2 sm:px-4">
          {/* First row: Feedback Workload and Exam*/}
          {/* <div className="flex flex-col sm:flex-row gap-4"> */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Feedback */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-md font-medium text-gray-700">
                  Feedback
                </span>
                {course.totalFeedbackCount > 0 && (
                  <span className="text-sm text-gray-500">
                    (
                    {course.totalFeedbackCount === 1
                      ? `${course.totalFeedbackCount} review`
                      : `${course.totalFeedbackCount} reviews`}
                    )
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {course.totalFeedbackCount === 0 ? (
                  <>
                    <Users className="size-4" />
                    <span className="text-sm">No feedback yet</span>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center gap-1">
                      <StarRating value={course.averageRating ?? 0} />
                      <span>({course.averageRating.toFixed(1)})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-md font-medium text-gray-700">
                  Workload
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {averageWorkload ? (
                  <>
                    <WorkloadRatingDisplay rating={averageWorkload} />
                  </>
                ) : (
                  <span className="text-gray-500">--</span>
                )}
              </div>
            </div>

            {/* Exam */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-md font-medium text-gray-700">Exam</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {course.hasMandatoryExam !== null ? (
                  course.hasMandatoryExam ? (
                    <Chip label="Mandatory Exam" color="red" size="md" />
                  ) : (
                    <Chip
                      size="md"
                      label="Not Mandatory exam"
                      color="green"
                      className="text-sm"
                    />
                  )
                ) : (
                  <span>
                    <Chip
                      label="Not specified"
                      size="md"
                      color="gray"
                      className="text-sm"
                    />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Second row: Terms */}
          {course.terms && course.terms.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Terms</span>
              <div className="flex flex-wrap gap-1">
                {course.terms.map((term) => (
                  <Chip key={term} label={term} color="gray" />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
