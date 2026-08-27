import { MeicFeedbackAPIError, sendChatMessage } from '@uni-feedback/api-client'
import { useCallback, useRef, useState } from 'react'
import type { DisplayMessage } from '~/components/chat/ChatMessages'
import { analytics } from '~/utils/analytics'

/**
 * Owns one conversation's message list and the answer stream.
 *
 * The server sends progress events rather than tokens, because a turn is
 * several provider calls with tool execution between them and its guards can
 * restart it. So this hook tracks "which tool is running" instead of appending
 * characters.
 */
export function useChatStream(
  chatId: string | null,
  hasContext: boolean,
  options: { scope?: ChatScope | null; language?: 'pt' | 'en' } = {}
) {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [workingTool, setWorkingTool] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** HTTP status behind the error, so callers can tell a refusal from a fault. */
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [quotaReached, setQuotaReached] = useState(false)
  const [title, setTitle] = useState<string | null>(null)
  /** Set when this turn created the chat, so the caller can move the URL. */
  const [createdChatId, setCreatedChatId] = useState<string | null>(null)

  // Negative ids for optimistic messages, so they never collide with real ones.
  const optimisticId = useRef(-1)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback((initial: DisplayMessage[]) => {
    setMessages(initial)
    setWorkingTool(null)
    setError(null)
    setErrorStatus(null)
    setQuotaReached(false)
    setCreatedChatId(null)
  }, [])

  const send = useCallback(
    async (content: string, sendOptions: { usedSuggestion?: boolean } = {}) => {
      // chatId null is valid now: the first message creates the conversation.
      if (workingTool !== null) return

      const isFirstMessage = messages.length === 0
      setError(null)
      setErrorStatus(null)
      setMessages((prev) => [
        ...prev,
        { id: optimisticId.current--, role: 'user', content }
      ])
      setWorkingTool('search_courses')

      analytics.chat.messageSent({
        chatId: chatId ?? 'new',
        isFirstMessage,
        hasContext,
        messageLength: content.length,
        usedSuggestion: sendOptions.usedSuggestion ?? false
      })

      const controller = new AbortController()
      abortRef.current = controller
      const startedAt = Date.now()
      let answered = false

      try {
        for await (const event of sendChatMessage(chatId, content, {
          scope: options.scope ?? undefined,
          language: options.language,
          signal: controller.signal
        })) {
          switch (event.type) {
            case 'working':
              setWorkingTool(event.tool)
              break

            case 'answer':
              answered = true
              setWorkingTool(null)
              setMessages((prev) => [
                ...prev,
                {
                  id: event.messageId,
                  role: 'assistant',
                  content: event.content
                }
              ])
              break

            case 'done':
              analytics.chat.answerReceived({
                chatId: chatId ?? 'new',
                latencyMs: event.latencyMs,
                toolsUsed: event.toolsUsed,
                guardsFired: event.guardsFired,
                answerLength: 0
              })
              if (event.remainingMessages <= 0) {
                setQuotaReached(true)
                analytics.chat.quotaReached({ chatId: chatId ?? 'new' })
              }
              break

            case 'created':
              // The chat exists now. Only at this point is there a URL to move
              // to, which is why nothing navigates before the first answer.
              setCreatedChatId(event.chatId)
              if (event.title) setTitle(event.title)
              break

            case 'title':
              setTitle(event.title)
              break

            case 'error':
              setError(event.message)
              analytics.chat.errorShown({
                chatId: chatId ?? 'new',
                message: event.message
              })
              break
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          // They navigated away or closed mid-answer. Worth recording: a turn
          // takes seconds, and abandonment is the drop-off we most want to see.
          analytics.chat.abandoned({
            chatId: chatId ?? 'new',
            waitedMs: Date.now() - startedAt
          })
        } else {
          const message =
            caught instanceof MeicFeedbackAPIError
              ? caught.message
              : 'error_generic'
          if (caught instanceof MeicFeedbackAPIError) {
            setErrorStatus(caught.status ?? null)
          }
          setError(message)
          analytics.chat.errorShown({ chatId: chatId ?? 'new', message })
        }
      } finally {
        abortRef.current = null
        setWorkingTool(null)
        if (!answered) {
          // Drop the optimistic user message that never got an answer, so a
          // retry does not read as a duplicate question.
          setMessages((prev) =>
            prev.filter((m) => m.id !== optimisticId.current + 1)
          )
        }
      }
    },
    [
      chatId,
      hasContext,
      messages.length,
      options.language,
      options.scope,
      workingTool
    ]
  )

  const abort = useCallback(() => abortRef.current?.abort(), [])

  return {
    messages,
    workingTool,
    error,
    errorStatus,
    quotaReached,
    title,
    createdChatId,
    isStreaming: workingTool !== null,
    reset,
    send,
    abort
  }
}
