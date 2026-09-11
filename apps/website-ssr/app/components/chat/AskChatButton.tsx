import { Button } from '@uni-feedback/ui'
import { MessageCircleQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang, useShowChatEntryPoints } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

interface AskChatButtonProps {
  name: string
  courseId?: number
  degreeId?: number
  facultyId?: number
  source: 'course_page' | 'degree_page' | 'faculty_page' | 'browse_page'
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm'
  /** Overrides the "Perguntar sobre X" label, e.g. in a no-results state. */
  label?: string
  /**
   * Drops the label below `sm`, leaving the icon.
   *
   * For the copy that sits inside the search field: on a phone the field is
   * barely wider than the label, and the student is there to type.
   */
  compact?: boolean
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
  size = 'default',
  label,
  compact = false,
  className
}: AskChatButtonProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()
  const showChatEntryPoints = useShowChatEntryPoints()

  // Gated here rather than at each of the six call sites, so a page cannot
  // acquire a chat button that outlives the switch. Renders nothing at all:
  // these buttons sit inside headers and search fields where a disabled
  // control would just be a question the student cannot act on.
  if (!showChatEntryPoints) return null

  const params = new URLSearchParams({ source })
  if (courseId) params.set('courseId', String(courseId))
  if (degreeId) params.set('degreeId', String(degreeId))
  if (facultyId) params.set('facultyId', String(facultyId))
  // Display only, so the chat can name what it is scoped to before a chat row
  // exists. The scope itself is always the id: this is a label, never trusted.
  if (name) params.set('scopeLabel', name)

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a href={`${getLocalePath('chat', lang)}?${params.toString()}`}>
        <MessageCircleQuestion className="size-4" />
        <span className={compact ? 'hidden sm:inline' : undefined}>
          {label ?? t('ask_about', { name })}
        </span>
      </a>
    </Button>
  )
}
