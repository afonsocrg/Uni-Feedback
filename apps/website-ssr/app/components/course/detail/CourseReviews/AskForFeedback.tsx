import type { Course } from '@uni-feedback/db/schema'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { Share2 } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FaWhatsapp } from 'react-icons/fa'
import { CopyButton } from '~/components'
import { addUtmParams, getAskForFeedbackMessage, openWhatsapp } from '~/utils'
import { analytics } from '~/utils/analytics'

interface AskForFeedbackProps {
  reviewFormUrl: string
  course: Course
}
export function AskForFeedback({ reviewFormUrl, course }: AskForFeedbackProps) {
  const { t } = useTranslation('course')
  const handleWhatsapp = useCallback(() => {
    if (!course) return
    analytics.course.feedbackRequested({
      medium: 'whatsapp',
      course_id: course.id,
      course_acronym: course.acronym
    })

    openWhatsapp({
      text: getAskForFeedbackMessage(course, reviewFormUrl)
    })
  }, [course, reviewFormUrl])

  const handleCopyUrl = useCallback(() => {
    if (!course) return
    analytics.course.feedbackRequested({
      medium: 'copy_url',
      course_id: course.id,
      course_acronym: course.acronym
    })
    const url = addUtmParams(reviewFormUrl, 'copy_url')
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url)
    }
  }, [course, reviewFormUrl])

  if (!course) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 active:bg-muted">
          <Share2 className="size-4" />
          {t('reviews.ask_for_feedback')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-2">
          <Button popoverTrigger variant="ghost" onClick={handleWhatsapp}>
            <FaWhatsapp className="size-4" />
            WhatsApp
          </Button>
          {typeof navigator !== 'undefined' && navigator.clipboard && (
            <CopyButton
              popoverTrigger
              variant="ghost"
              onClick={handleCopyUrl}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
