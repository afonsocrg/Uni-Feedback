import { addUtmParams } from '@/utils/routes'
import { getAskForFeedbackMessage, openWhatsapp } from '@/utils/whatsapp'
import { CopyButton } from '@components'
import { useCourseDetails } from '@hooks'
import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Share2 } from 'lucide-react'
import posthog from 'posthog-js'
import { useCallback } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

interface AskForFeedbackProps {
  reviewFormUrl: string
  courseId: number
}
export function AskForFeedback({
  reviewFormUrl,
  courseId
}: AskForFeedbackProps) {
  const { data: course } = useCourseDetails(courseId)
  const handleWhatsapp = useCallback(() => {
    if (!course) return
    posthog.capture('request_feedback', {
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
    posthog.capture('request_feedback', {
      medium: 'copy_url',
      course_id: course.id,
      course_acronym: course.acronym
    })
    const url = addUtmParams(reviewFormUrl, 'copy_url')
    navigator.clipboard.writeText(url)
  }, [course, reviewFormUrl])

  if (!course) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 active:bg-gray-100 dark:active:bg-gray-800"
        >
          <Share2 className="size-4" />
          Ask for feedback
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
  )
}
