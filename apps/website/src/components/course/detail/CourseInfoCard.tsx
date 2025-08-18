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
import { Clock, ExternalLink, Share2, Users } from 'lucide-react'
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
        {/* Header with title and action buttons - Mobile-first responsive layout */}
        <div className="space-y-3 sm:flex sm:items-start sm:justify-between sm:space-y-0 sm:gap-4">
          {/* Title section - full width on mobile, constrained on larger screens */}
          <div className="sm:flex-1 sm:min-w-0 sm:max-w-[calc(100%-200px)]">
            <h1 className="text-3xl font-bold text-primaryBlue leading-tight">
              {course.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg text-gray-500 font-medium">
                {course.acronym}
              </span>
              {course.ects && <Chip label={`${course.ects} ECTS`} />}
            </div>
          </div>

          {/* Action buttons - full width on mobile, fixed width on larger screens */}
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            {course.url && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="size-4" />
                  Course Page
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
                  Share
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
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Course Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left Column - Primary Information */}
          <div className="space-y-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
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
                    <div className="flex items-center gap-1 mt-2">
                      <span>
                        <Clock className="inline size-4 mr-1" />
                        Workload:
                      </span>
                      {averageWorkload ? (
                        <WorkloadRatingDisplay rating={averageWorkload} />
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory Exam */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Exam</span>
              <div className="flex items-center gap-2">
                {course.hasMandatoryExam === null ? (
                  <Chip
                    label="Not specified"
                    color="gray"
                    className="text-sm"
                  />
                ) : course.hasMandatoryExam ? (
                  <Chip label="Mandatory" color="red" className="text-sm" />
                ) : (
                  <Chip
                    label="Not Mandatory"
                    color="green"
                    className="text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Secondary Information */}
          <div className="space-y-4">
            {/* Degree */}
            {course.degree && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Degree
                </span>
                <div className="flex flex-wrap gap-1">
                  <Chip
                    label={`${course.degree.acronym} - ${course.degree.name}`}
                    color="gray"
                  />
                  {/* <Tooltip content={course.degree.name}>
                    <div className="flex items-center gap-2">
                      <Chip label={course.degree.acronym} />
                    </div>
                  </Tooltip> */}
                </div>
              </div>
            )}

            {/* Terms */}
            {course.terms && course.terms.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Terms</span>
                <div className="flex flex-wrap gap-1">
                  {course.terms.map((term) => (
                    <Chip key={term} label={term} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
