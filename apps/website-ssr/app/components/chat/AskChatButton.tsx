import { Button } from '@uni-feedback/ui'
import { MessageCircleQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

interface AskChatButtonProps {
  name: string
  courseId?: number
  degreeId?: number
  facultyId?: number
  source: 'course_page' | 'degree_page' | 'faculty_page'
  variant?: 'default' | 'outline'
  className?: string
}

/**
 * "Ask about this", from a course, degree or faculty page.
 *
 * This is the highest-leverage control in the chat, and not because of traffic.
 * Arriving here scopes the conversation, so "is this hard?" resolves with no
 * entity named at all. In the local runs that removed the entire class of
 * ambiguity failure that dominated the retrieval spike: no search, no "which
 * university did you mean?", straight to the reviews.
 */
export function AskChatButton({
  name,
  courseId,
  degreeId,
  facultyId,
  source,
  variant = 'default',
  className
}: AskChatButtonProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()

  const params = new URLSearchParams({ source })
  if (courseId) params.set('courseId', String(courseId))
  if (degreeId) params.set('degreeId', String(degreeId))
  if (facultyId) params.set('facultyId', String(facultyId))

  return (
    <Button variant={variant} className={className} asChild>
      <a href={`${getLocalePath('chat', lang)}?${params.toString()}`}>
        <MessageCircleQuestion className="size-4" />
        {t('ask_about', { name })}
      </a>
    </Button>
  )
}
