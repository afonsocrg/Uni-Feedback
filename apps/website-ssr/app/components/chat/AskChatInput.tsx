import { Button, cn } from '@uni-feedback/ui'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { AuthUser } from '~/context/AuthContext'
import { useAuth, useLang, useShowChatEntryPoints } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'
import { ChatLoginWall } from './ChatLoginWall'

interface AskChatInputProps {
  name: string
  courseId: number
  className?: string
}

/** Router state the chat page reads to send the question on arrival. */
export interface ChatPrefillState {
  question: string
}

/**
 * "Ask the chat about this course", typed in place.
 *
 * Replaced a button that opened an empty chat. Week 1 showed students
 * arriving at an empty chat and leaving without typing, so the question is
 * now asked here and the chat page sends it on arrival.
 *
 * Signed out, the login wall opens here, over the course page, and the chat
 * opens only once they are in: ask, sign in, answer. It is the chat's own wall
 * (`ChatLoginWall`), so the funnel is the same one with a different `source`.
 *
 * This component never talks to the chat API. The request, the stream and the
 * remaining refusals (quota, resting) stay on the chat page, which already
 * handles them. The question travels in router state rather than the URL: a
 * query string would put it in PostHog's captured `$current_url`, server logs
 * and browser history.
 */
export function AskChatInput({ name, courseId, className }: AskChatInputProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, setUser } = useAuth()
  const showChatEntryPoints = useShowChatEntryPoints()
  const [value, setValue] = useState('')
  const [wallOpen, setWallOpen] = useState(false)

  // Same switch as AskChatButton: no entry point outlives it.
  if (!showChatEntryPoints) return null

  const submit = () => {
    const question = value.trim()
    if (!question) return

    analytics.chat.inlinePromptSubmitted({
      source: 'course_page',
      courseId,
      isAuthenticated,
      messageLength: question.length
    })

    if (!authLoading && !isAuthenticated) {
      setWallOpen(true)
      analytics.chat.loginWallShown({
        hasContext: true,
        source: 'course_page_inline'
      })
      return
    }
    openChat(question)
  }

  const openChat = (question: string) => {
    const params = new URLSearchParams({
      source: 'course_page_inline',
      courseId: String(courseId),
      scopeLabel: name
    })
    const state: ChatPrefillState = { question }
    navigate(`${getLocalePath('chat', lang)}?${params.toString()}`, { state })
  }

  const onSignedIn = (user: AuthUser) => {
    setUser(user)
    setWallOpen(false)
    const question = value.trim()
    if (question) openChat(question)
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          'flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-card pl-3 pr-1 focus-within:border-primaryBlue focus-within:ring-2 focus-within:ring-primaryBlue/30',
          className
        )}
      >
        <MessageCircle
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('ask_input_placeholder', { name })}
          aria-label={t('ask_input_placeholder', { name })}
          maxLength={2000}
          // text-base below md: iOS zooms into any input under 16px on focus.
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <Button
          type="submit"
          size="icon"
          disabled={value.trim().length === 0}
          aria-label={t('send')}
          className="size-7 shrink-0"
        >
          <ArrowUp className="size-3.5" />
        </Button>
      </form>

      <ChatLoginWall
        open={wallOpen}
        source="course_page_inline"
        question={value.trim() || null}
        onSuccess={onSignedIn}
        onClose={() => setWallOpen(false)}
      />
    </>
  )
}
