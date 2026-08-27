import {
  MeicFeedbackAPIError,
  createChat,
  deleteChat,
  getChat,
  listChats,
  type ChatScope,
  type ChatSummary
} from '@uni-feedback/api-client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useChatStream, useLang, useLocalStorage } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { STORAGE_KEYS } from '~/utils/constants'
import { getLocalePath } from '~/utils/i18n-routes'
import { ChatComposer } from './ChatComposer'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatFirstUseNotice } from './ChatFirstUseNotice'
import { ChatMessages } from './ChatMessages'
import { ChatShell } from './ChatShell'
import { ChatSidebar } from './ChatSidebar'
import { ChatCoverageWall, ChatQuotaWall } from './ChatWalls'

interface ChatPageContentProps {
  /** From the URL when opening an existing conversation. */
  chatId: number | null
  /** From query params when arriving from a course, degree or faculty page. */
  scope: ChatScope | null
  source:
    | 'navbar'
    | 'footer'
    | 'landing'
    | 'browse_page'
    | 'course_page'
    | 'degree_page'
    | 'faculty_page'
    | 'direct'
}

export function ChatPageContent({
  chatId: initialChatId,
  scope,
  source
}: ChatPageContentProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()
  const navigate = useNavigate()

  const [noticeAccepted, setNoticeAccepted] = useLocalStorage(
    STORAGE_KEYS.CHAT_NOTICE_ACCEPTED,
    false
  )
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(initialChatId)
  const [coverageBlocked, setCoverageBlocked] = useState(false)
  const [loaded, setLoaded] = useState(false)
  // null means "never chosen", which lets the first client render pick a
  // default from the viewport instead of guessing during SSR: a sidebar that
  // defaults open would cover the whole conversation on a phone.
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean | null>(
    STORAGE_KEYS.CHAT_SIDEBAR_OPEN,
    null
  )

  const hasContext = scope !== null
  const stream = useChatStream(activeChatId, hasContext)
  const { reset, abort, title } = stream

  /**
   * Whether localStorage has been read yet.
   *
   * `useLocalStorage` is SSR-safe by returning its default on the first render
   * and hydrating in an effect, which means `noticeAccepted` is briefly false
   * for everyone, including students who accepted months ago. Rendering the
   * notice on that first frame is what made it flash.
   *
   * The fix is not to move the notice somewhere else: it is to not decide
   * before we know. Effects run in declaration order, and the hooks above are
   * declared first, so by the time this one runs their values are settled.
   */
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  useEffect(() => {
    if (sidebarOpen === null) {
      setSidebarOpen(window.matchMedia('(min-width: 768px)').matches)
    }
  }, [sidebarOpen, setSidebarOpen])

  const isSidebarOpen = sidebarOpen === true

  const trackedOpen = useRef(false)

  useEffect(() => {
    let cancelled = false
    listChats()
      .then(({ chats: loadedChats }) => {
        if (cancelled) return
        setChats(loadedChats)
        if (!trackedOpen.current) {
          trackedOpen.current = true
          analytics.chat.opened({
            source,
            hasContext,
            chatCount: loadedChats.length
          })
        }
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [hasContext, source])

  // Load an existing conversation when the URL points at one.
  useEffect(() => {
    if (initialChatId === null) {
      reset([])
      return
    }
    let cancelled = false
    getChat(initialChatId)
      .then((chat) => {
        if (cancelled) return
        setActiveChatId(chat.id)
        reset(
          chat.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            rating: m.rating
          }))
        )
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [initialChatId, reset])

  // The stream names the chat after its first exchange.
  useEffect(() => {
    if (!title || activeChatId === null) return
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, title } : c))
    )
  }, [title, activeChatId])

  // A turn takes seconds, so leaving mid-answer is a real case, not an edge one.
  useEffect(() => abort, [abort])

  const send = useCallback(
    async (content: string, usedSuggestion = false) => {
      let targetId = activeChatId

      if (targetId === null) {
        try {
          const created = await createChat({
            language: lang,
            scope: scope ?? undefined
          })
          targetId = created.id
          setActiveChatId(created.id)
          setChats((prev) => [
            {
              id: created.id,
              title: created.title,
              createdAt: created.createdAt,
              lastMessageAt: null
            },
            ...prev
          ])
          // Replace rather than push: a new chat should not leave an empty
          // /chat behind in the back stack.
          navigate(`${getLocalePath('chat', lang)}/${created.id}`, {
            replace: true
          })
        } catch (error) {
          // 403 here is the coverage wall: this student's university is not on.
          if (error instanceof MeicFeedbackAPIError && error.status === 403) {
            setCoverageBlocked(true)
            analytics.chat.coverageWallShown({
              facultyId: scope?.facultyId ?? null
            })
          }
          return
        }
      }

      await stream.send(content, { usedSuggestion })
    },
    [activeChatId, lang, navigate, scope, stream]
  )

  const startNewChat = () => {
    setActiveChatId(null)
    reset([])
    navigate(getLocalePath('chat', lang))
  }

  const removeChat = async (id: number) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    if (id === activeChatId) startNewChat()
    try {
      await deleteChat(id)
    } catch {
      // Soft delete on the server; a failure here just means it reappears on
      // the next load, which is better than blocking the UI on it.
    }
  }

  // Even the blocking states own the viewport: the chat is a surface, so a
  // student who cannot use it should not land on a half-page with no chrome.
  if (coverageBlocked) {
    return (
      <ChatShell
        sidebar={null}
        sidebarOpen={false}
        onToggleSidebar={() => undefined}
      >
        <ChatCoverageWall />
      </ChatShell>
    )
  }

  // Show nothing rather than the wrong thing. One empty frame is invisible; a
  // notice that appears and vanishes is not.
  if (!hydrated) {
    return (
      <ChatShell
        sidebar={null}
        sidebarOpen={false}
        onToggleSidebar={() => undefined}
      >
        <div className="min-h-0 flex-1" />
      </ChatShell>
    )
  }

  if (!noticeAccepted) {
    return (
      <ChatShell
        sidebar={null}
        sidebarOpen={false}
        onToggleSidebar={() => undefined}
      >
        <ChatFirstUseNotice onAccept={() => setNoticeAccepted(true)} />
      </ChatShell>
    )
  }

  const showEmptyState = loaded && stream.messages.length === 0

  return (
    <ChatShell
      sidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
      sidebar={
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          open={isSidebarOpen}
          onNewChat={startNewChat}
          onSelect={(id) => {
            // Only close on small screens: on desktop the sidebar is part of
            // the layout, and collapsing it on every click would be hostile.
            if (!window.matchMedia('(min-width: 768px)').matches) {
              setSidebarOpen(false)
            }
            navigate(`${getLocalePath('chat', lang)}/${id}`)
          }}
          onDelete={removeChat}
          onClose={() => setSidebarOpen(false)}
        />
      }
    >
      <>
        {showEmptyState ? (
          <ChatEmptyState onPick={(question) => send(question, true)} />
        ) : (
          <ChatMessages
            chatId={activeChatId ?? 0}
            messages={stream.messages}
            workingTool={stream.workingTool}
          />
        )}

        {stream.error && (
          <p className="border-t border-border bg-tint-red px-5 py-2.5 text-sm text-tint-red-fg">
            {stream.error === 'error_generic'
              ? t('error_generic')
              : stream.error}
          </p>
        )}

        {stream.quotaReached ? (
          <ChatQuotaWall />
        ) : (
          <ChatComposer onSend={send} disabled={stream.isStreaming} />
        )}
      </>
    </ChatShell>
  )
}
