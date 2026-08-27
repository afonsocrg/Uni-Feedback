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
    | 'landing'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const hasContext = scope !== null
  const stream = useChatStream(activeChatId, hasContext)
  const { reset, abort, title } = stream

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
            content: m.content
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
        sidebar={<ChatSidebarShellOnly />}
        onOpenSidebar={() => undefined}
      >
        <ChatCoverageWall />
      </ChatShell>
    )
  }

  if (!noticeAccepted) {
    return (
      <ChatShell
        sidebar={<ChatSidebarShellOnly />}
        onOpenSidebar={() => undefined}
      >
        <ChatFirstUseNotice onAccept={() => setNoticeAccepted(true)} />
      </ChatShell>
    )
  }

  const showEmptyState = loaded && stream.messages.length === 0

  return (
    <ChatShell
      onOpenSidebar={() => setSidebarOpen(true)}
      sidebar={
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          open={sidebarOpen}
          onNewChat={() => {
            setSidebarOpen(false)
            startNewChat()
          }}
          onSelect={(id) => {
            setSidebarOpen(false)
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

/**
 * The sidebar with no conversations, for the states shown before a chat can
 * start. Keeps the shell whole so the way back to the site is always there.
 */
function ChatSidebarShellOnly() {
  return (
    <ChatSidebar
      chats={[]}
      activeChatId={null}
      open={false}
      onNewChat={() => undefined}
      onSelect={() => undefined}
      onDelete={() => undefined}
      onClose={() => undefined}
    />
  )
}
