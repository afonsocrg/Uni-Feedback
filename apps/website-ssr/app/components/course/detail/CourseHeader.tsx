import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { Share2 } from 'lucide-react'
import { useCallback } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { CopyButton, Tooltip } from '~/components'
import { addUtmParams, openWhatsapp } from '~/utils'
import { analytics } from '~/utils/analytics'
import type { CourseDetail } from './CourseDetailContent'

export interface CourseHeaderProps {
  course: CourseDetail
}
export function CourseHeader({ course }: CourseHeaderProps) {
  const handleWhatsapp = useCallback(() => {
    analytics.course.shareClicked({
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
    analytics.course.shareClicked({
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
        <p className="text-muted-foreground">{course.acronym}</p>
        {course.degree && (
          <Tooltip content={course.degree.name}>
            <Chip label={course.degree.acronym} />
          </Tooltip>
        )}
        {course.offerings.length > 0 && (
          <div className="flex items-center gap-2">
            {Array.from(
              new Set(course.offerings.map((o) => o.academicTerm.name))
            ).map((name) => (
              <Chip key={name} label={name} />
            ))}
          </div>
        )}
        {course.totalFeedbackCount > 0 && (
          <div className="flex items-center">
            <span className="text-rating mr-1">★</span>
            <span className="text-foreground">
              {(course.averageRating ?? 0).toFixed(1)}
            </span>
            <span className="text-muted-foreground ml-2">
              ({course.totalFeedbackCount} reviews)
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
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Share2 className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-2">
                <Button popoverTrigger variant="ghost" onClick={handleWhatsapp}>
                  <FaWhatsapp className="size-4" />
                  WhatsApp
                </Button>
                {navigator.clipboard && (
                  <CopyButton
                    popoverTrigger
                    variant="ghost"
                    onClick={handleCopyUrl}
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  )
}
