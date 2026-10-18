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

type AskChatInputProps = {
  className?: string
  /** 'lg' for a section of its own, where the box is the whole call to action. */
  size?: 'default' | 'lg'
} & (
  | { source: 'course_page'; name: string; courseId: number }
  /** Unscoped: the chat opens with no course, and the model asks if it needs to. */
  | { source: 'landing'; placeholder: string }
)

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
export function AskChatInput(props: AskChatInputProps) {
  const { className, size = 'default' } = props
  const { t } = useTranslation('chat')
  const lang = useLang()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, setUser } = useAuth()
  const showChatEntryPoints = useShowChatEntryPoints()
  const [value, setValue] = useState('')
  const [wallOpen, setWallOpen] = useState(false)

  // Same switch as AskChatButton: no entry point outlives it.
  if (!showChatEntryPoints) return null

  // What the chat page sees as `source`, so each box is its own entry point.
  const chatSource = `${props.source}_inline` as const
  const course = props.source === 'course_page' ? props : null
  const placeholder = course
    ? t('ask_input_placeholder', { name: course.name })
    : props.source === 'landing'
      ? props.placeholder
      : ''

  const submit = () => {
    const question = value.trim()
    if (!question) return

    analytics.chat.inlinePromptSubmitted({
      source: props.source,
      courseId: course?.courseId ?? null,
      isAuthenticated,
      messageLength: question.length
    })

    if (!authLoading && !isAuthenticated) {
      setWallOpen(true)
      analytics.chat.loginWallShown({
        hasContext: course !== null,
        source: chatSource
      })
      return
    }
    openChat(question)
  }

  const openChat = (question: string) => {
    const params = new URLSearchParams({ source: chatSource })
    if (course) {
      params.set('courseId', String(course.courseId))
      params.set('scopeLabel', course.name)
    }
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
          'flex min-w-0 items-center gap-2 rounded-md border border-border bg-card pr-1 focus-within:border-primaryBlue focus-within:ring-2 focus-within:ring-primaryBlue/30',
          size === 'lg' ? 'h-12 rounded-lg pl-4 pr-1.5' : 'h-9 pl-3',
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
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={2000}
          // text-base below md: iOS zooms into any input under 16px on focus.
          className={cn(
            'min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground',
            size === 'default' && 'md:text-sm'
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={value.trim().length === 0}
          aria-label={t('send')}
          className={cn('shrink-0', size === 'lg' ? 'size-9' : 'size-7')}
        >
          <ArrowUp className={size === 'lg' ? 'size-4' : 'size-3.5'} />
        </Button>
      </form>

      <ChatLoginWall
        open={wallOpen}
        source={chatSource}
        question={value.trim() || null}
        onSuccess={onSignedIn}
        onClose={() => setWallOpen(false)}
      />
    </>
  )
}
