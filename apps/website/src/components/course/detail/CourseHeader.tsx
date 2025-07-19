import { addUtmParams } from '@/utils/routes'
import { openWhatsapp } from '@/utils/whatsapp'
import { Chip, CopyButton, Tooltip } from '@components'
import { type CourseDetail } from '@services/meicFeedbackAPI'
import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Share2 } from 'lucide-react'
import posthog from 'posthog-js'
import { useCallback } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

export interface CourseHeaderProps {
  course: CourseDetail
}
export function CourseHeader({ course }: CourseHeaderProps) {
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

  return (
    <>
      <h1 className="text-3xl font-bold text-primaryBlue mb-4">
        {course.name}
      </h1>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <p className="text-gray-600">{course.acronym}</p>
        {course.degree && (
          <Tooltip content={course.degree.name}>
            <Chip label={course.degree.acronym} />
          </Tooltip>
        )}
        {course.terms && (
          <div className="flex items-center gap-2">
            {course.terms.map((t) => (
              <Chip key={t} label={t} />
            ))}
          </div>
        )}
        {course.feedbackCount > 0 && (
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">★</span>
            <span className="text-gray-700">
              {(course.rating ?? 0).toFixed(1)}
            </span>
            <span className="text-gray-500 ml-2">
              ({course.feedbackCount} reviews)
            </span>
          </div>
        )}
        {course.url && (
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primaryBlue hover:underline cursor-pointer"
          >
            Course page
          </a>
        )}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="gap-2 text-gray-500">
                <Share2 className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-2">
                <Button popover variant="ghost" onClick={handleWhatsapp}>
                  <FaWhatsapp className="size-4" />
                  WhatsApp
                </Button>
                {navigator.clipboard && (
                  <CopyButton popover variant="ghost" onClick={handleCopyUrl} />
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  )
}
