import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAuth, useLang, useShowChatEntryPoints } from '~/hooks'
import { cn } from '~/utils'
import { analytics, type DegreeSectionId } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'
import type { ChatPrefillState } from '../chat/AskChatInput'

export type DegreePromptTemplate =
  | 'heaviest_year'
  | 'hardest_course'
  | 'best_courses'
  /** Under a curricular plan: an invitation, not a question (nothing prefilled) */
  | 'plan_question'

/**
 * "Qual é o ano mais pesado de LEIC? Pergunta ao nosso chat": a question the chat can
 * answer from our data, inline where it comes up (prds/content_rich_pages.md,
 * "AI chat entry points"). Opens the chat scoped to the degree with the
 * question in router state, like `AskChatInput`, so the chat page sends it on
 * arrival (or after its login wall) and it never lands in a URL.
 *
 * Only questions about courses: the chat has no admission, fee or outcome data
 * (see `chatPrompt.ts`), so the Ingresso section gets no prompt.
 */
export function AskChatPrompt({
  template,
  question,
  degreeId,
  scopeLabel,
  section,
  prefill = true,
  className
}: {
  template: DegreePromptTemplate
  question: string
  degreeId: number
  scopeLabel: string
  section: DegreeSectionId
  /**
   * Send `question` to the chat as the student's first message. Off for an
   * open invitation ("Tens alguma pergunta sobre este plano curricular?"):
   * the chat opens on the degree with an empty box.
   */
  prefill?: boolean
  /** Replaces the default top margin (mt-4) */
  className?: string
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const showChatEntryPoints = useShowChatEntryPoints()

  if (!showChatEntryPoints) return null

  const params = new URLSearchParams({
    source: 'degree_page_prompt',
    degreeId: String(degreeId),
    scopeLabel
  })
  const href = `${getLocalePath('chat', lang)}?${params.toString()}`

  return (
    <p className={cn('text-sm text-muted-foreground', className ?? 'mt-4')}>
      {question}{' '}
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault()
          analytics.chat.degreePromptClicked({
            degreeId,
            template,
            section,
            isAuthenticated
          })
          const state: ChatPrefillState = { question }
          navigate(href, prefill ? { state } : undefined)
        }}
        className="font-semibold text-primaryBlue hover:underline"
      >
        {t('degree_page.ask.link')}
      </a>
    </p>
  )
}
