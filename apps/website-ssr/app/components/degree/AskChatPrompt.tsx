import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAuth, useLang, useShowChatEntryPoints } from '~/hooks'
import { analytics, type DegreeSectionId } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'
import type { ChatPrefillState } from '../chat/AskChatInput'

export type DegreePromptTemplate =
  | 'heaviest_year'
  | 'hardest_course'
  | 'best_courses'

/**
 * "Qual é o ano mais pesado de LEIC? Pergunta-nos": a question the chat can
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
  section
}: {
  template: DegreePromptTemplate
  question: string
  degreeId: number
  scopeLabel: string
  section: DegreeSectionId
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
    <p className="mt-4 text-sm text-muted-foreground">
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
          navigate(href, { state })
        }}
        className="font-semibold text-primaryBlue hover:underline"
      >
        {t('degree_page.ask.link')}
      </a>
    </p>
  )
}
