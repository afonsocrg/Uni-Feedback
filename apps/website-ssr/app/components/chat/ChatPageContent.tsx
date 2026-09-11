import {
  deleteChat,
  getChat,
  getFaculties,
  listChats,
  type ChatScope,
  type ChatSummary
} from '@uni-feedback/api-client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AuthDialog } from '~/components/AuthDialog'
import type { AuthUser } from '~/context/AuthContext'
import { useAuth, useChatStream, useLang, useLocalStorage } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { STORAGE_KEYS } from '~/utils/constants'
import { getLocalePath } from '~/utils/i18n-routes'
import { ChatAccessRequestDialog } from './ChatAccessRequestDialog'
import { ChatComposer } from './ChatComposer'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatFirstUseNotice } from './ChatFirstUseNotice'
import { ChatMessages } from './ChatMessages'
import { ChatShell } from './ChatShell'
import { ChatSidebar } from './ChatSidebar'
import { ChatQuotaWall, ChatRestingWall } from './ChatWalls'

interface ChatPageContentProps {
  /** From the URL when opening an existing conversation. */
  chatId: string | null
  /** From query params when arriving from a course, degree or faculty page. */
  scope: ChatScope | null
  /** Display name for the scope, so it can be shown before a chat exists. */
  scopeLabel?: string | null
  source:
    | 'navbar'
    | 'mobile_menu'
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
  scopeLabel,
  source
}: ChatPageContentProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, setUser } = useAuth()

  /**
   * The question waiting on a login.
   *
   * Login is OTP in the same tab and `AuthDialog` is a dialog, so nothing
   * navigates: the question lives here in state while they sign in, and is sent
   * the moment they are through. No redirect param, no localStorage draft.
   */
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)

  /**
   * Every domain we can verify, so the dialog can say "not one of ours" before
   * sending a code that was never going to arrive.
   *
   * Fetched only once the wall is actually needed. An empty list simply means no
   * client-side check and the API refuses as it always did.
   */
  const [emailSuffixes, setEmailSuffixes] = useState<string[]>([])
  useEffect(() => {
    if (!authOpen || emailSuffixes.length > 0) return
    getFaculties()
      .then((faculties) =>
        setEmailSuffixes(faculties.flatMap((f) => f.emailSuffixes ?? []))
      )
      .catch(() => undefined)
  }, [authOpen, emailSuffixes.length])

  const [noticeAccepted, setNoticeAccepted] = useLocalStorage(
    STORAGE_KEYS.CHAT_NOTICE_ACCEPTED,
    false
  )
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId)
  const [loaded, setLoaded] = useState(false)
  // null means "never chosen", which lets the first client render pick a
  // default from the viewport instead of guessing during SSR: a sidebar that
  // defaults open would cover the whole conversation on a phone.
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean | null>(
    STORAGE_KEYS.CHAT_SIDEBAR_OPEN,
    null
  )

  const hasContext = scope !== null
  const stream = useChatStream(activeChatId, hasContext, {
    scope,
    language: lang
  })
  const { reset, abort, title, createdChatId, answeredAt } = stream

  /**
   * The chat is off, either by the kill switch or the daily spend ceiling.
   *
   * Branching on the `code` rather than on the 403 itself. There is no coverage
   * gate any more, but there were once three different 403s rendering the same
   * wall, which is how an outage came to be reported as "we have no data about
   * your university".
   */
  const resting =
    stream.refusalCode === 'chat_resting' ||
    stream.refusalCode === 'spend_ceiling'

  useEffect(() => {
    if (resting && stream.refusalCode) {
      analytics.chat.restingShown({ code: stream.refusalCode })
    }
  }, [resting, stream.refusalCode])

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

  // `null` (never chosen) is handed straight to the sidebar, which resolves it
  // in CSS: visible from md up, hidden below. Resolving it here in an effect
  // meant every navigation rendered once with "closed" before correcting
  // itself, so the sidebar blinked shut each time a chat was opened.
  const isSidebarOpen = sidebarOpen !== false

  useEffect(() => {
    let cancelled = false
    listChats()
      .then(({ chats: loadedChats }) => !cancelled && setChats(loadedChats))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * The top of the funnel, fired for everyone.
   *
   * This used to live inside the `listChats().then()` above, which never runs
   * for a signed-out student because `GET /chat` is a 401 and the `.catch`
   * swallowed it. The first step of a *signup* funnel was therefore missing
   * exactly the people the funnel exists to measure, and `source` went with it,
   * so entry-point discovery could only ever be seen for students who were
   * already logged in.
   *
   * Waits on both settling rather than firing on mount: `authLoading` decides
   * which funnel this arrival belongs to, and `loaded` is what makes
   * `chatCount` true rather than a zero we happened to render first. `loaded`
   * is set in the `finally`, so a 401 settles it just as a success does.
   */
  const trackedOpen = useRef(false)
  useEffect(() => {
    if (!loaded || authLoading || trackedOpen.current) return
    trackedOpen.current = true
    analytics.chat.opened({
      source,
      hasContext,
      isAuthenticated,
      chatCount: isAuthenticated ? chats.length : null
    })
  }, [loaded, authLoading, isAuthenticated, chats.length, hasContext, source])

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

  // The list is ordered by most recent activity, and answering in an old chat
  // makes it the most recent. Without this it would keep its old position until
  // the next reload, which reads as the ordering being broken.
  useEffect(() => {
    if (!answeredAt || !activeChatId) return
    setChats((prev) => {
      const answered = prev.find((c) => c.id === activeChatId)
      if (!answered) return prev
      const stamped = { ...answered, lastMessageAt: new Date().toISOString() }
      return [stamped, ...prev.filter((c) => c.id !== activeChatId)]
    })
  }, [answeredAt, activeChatId])

  // The URL moves only when the chat exists, which is the moment the first
  // answer comes back. Until then the student stays on /chat and nothing has
  // been written, so a refused or failed first message leaves no trace.
  useEffect(() => {
    if (!createdChatId || createdChatId === activeChatId) return
    setActiveChatId(createdChatId)
    setChats((prev) => [
      {
        id: createdChatId,
        title: title ?? null,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString()
      },
      ...prev
    ])
    // Rewrite the URL without routing to it.
    //
    // `/chat` and `/chat/:chatId` are different routes, so navigating between
    // them unmounts this component and mounts a fresh one, which then refetches
    // the conversation it is already holding. That round trip is the flicker.
    //
    // The answer is already on screen and the state is already correct: the
    // only thing left to do is make the address bar agree, so that a refresh or
    // a shared link lands in the right place. replaceState rather than
    // pushState, so a new chat leaves no empty /chat behind in the back stack,
    // which is what `replace: true` was doing.
    window.history.replaceState(
      window.history.state,
      '',
      `${getLocalePath('chat', lang)}/${createdChatId}`
    )
  }, [createdChatId, activeChatId, title, lang])

  /**
   * Send, or ask them to sign in first.
   *
   * The wall goes up on the first send rather than on arrival: the question they
   * just typed is the strongest motivation this screen will ever have, and a
   * wall raised before they engage throws it away. That is only fair because the
   * requirement is stated above the composer before they type, and because
   * returning `false` here keeps what they wrote if the login does not complete.
   */
  const lastAttempt = useRef<string | null>(null)
  const send = useCallback(
    (content: string, usedSuggestion = false) => {
      if (!authLoading && !isAuthenticated) {
        setPendingQuestion(content)
        setAuthOpen(true)
        analytics.chat.loginWallShown({ hasContext, source })
        return false
      }
      lastAttempt.current = content
      stream.send(content, { usedSuggestion })
      return true
    },
    [authLoading, isAuthenticated, stream, hasContext, source]
  )

  /**
   * The session died while they were reading.
   *
   * The client already refreshed and retried, so a 401 arriving here means the
   * refresh token is gone too and they genuinely have to sign in again. Sending
   * them the same wall they saw the first time is the honest answer; the
   * alternative was a red "something went wrong" banner for what is simply an
   * expired login, with the question they typed thrown away by the stream's
   * cleanup.
   */
  useEffect(() => {
    if (stream.errorStatus !== 401) return
    setPendingQuestion(lastAttempt.current)
    setAuthOpen(true)
    analytics.chat.loginWallShown({ hasContext, source })
  }, [stream.errorStatus, hasContext, source])

  const onAuthSuccess = (user: AuthUser) => {
    setUser(user)
    setAuthOpen(false)
    analytics.chat.loginWallCompleted({ source })
    if (pendingQuestion) {
      const question = pendingQuestion
      setPendingQuestion(null)
      stream.send(question, { usedSuggestion: false })
    }
  }

  const startNewChat = () => {
    setActiveChatId(null)
    reset([])
    navigate(getLocalePath('chat', lang))
  }

  const removeChat = async (id: string) => {
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
  if (resting) {
    return (
      <ChatShell
        sidebar={null}
        sidebarOpen={false}
        onToggleSidebar={() => undefined}
      >
        <ChatRestingWall />
      </ChatShell>
    )
  }

  // Show nothing rather than the wrong thing. One empty frame is invisible; a
  // notice that appears and vanishes is not. `authLoading` is in here for the
  // same reason: the provider resolves the session in an effect, so deciding
  // logged-in versus logged-out before it settles is the same flash bug.
  if (!hydrated || authLoading) {
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
      onToggleSidebar={() => setSidebarOpen(sidebarOpen === false)}
      sidebar={
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          open={sidebarOpen}
          onNewChat={startNewChat}
          onSelect={(id) => {
            // Only dismiss the drawer on small screens. On desktop the sidebar
            // is part of the layout: closing it every time a chat is opened
            // would be actively hostile.
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
          <ChatEmptyState
            scopeLabel={scopeLabel}
            onPick={(question) => send(question, true)}
          />
        ) : (
          <ChatMessages
            chatId={activeChatId ?? 'new'}
            messages={stream.messages}
            workingTool={stream.workingTool}
          />
        )}

        {/* 401 is excluded on purpose: the dialog above is already handling it,
            and an error banner underneath would be telling the student that
            something broke while we ask them to sign in. */}
        {stream.error && stream.errorStatus !== 401 && (
          <p className="border-t border-border bg-tint-red px-5 py-2.5 text-sm text-tint-red-fg">
            {stream.error === 'error_generic'
              ? t('error_generic')
              : stream.error}
          </p>
        )}

        {stream.quotaReached ? (
          <ChatQuotaWall />
        ) : (
          <ChatComposer
            onSend={send}
            disabled={stream.isStreaming}
            footer={
              isAuthenticated ? undefined : (
                // Stated before they type, not sprung on them at send. The
                // university-email part is the half that needs explaining,
                // because it is unusual and it excludes people, so the second
                // door sits right next to it rather than behind a rejection.
                <span className="text-xs text-muted-foreground">
                  <Trans
                    t={t}
                    i18nKey="login_required"
                    components={{
                      request: (
                        <button
                          type="button"
                          onClick={() => setAccessOpen(true)}
                          className="cursor-pointer underline underline-offset-2 hover:text-foreground"
                        />
                      )
                    }}
                  />
                </span>
              )
            }
          />
        )}

        <AuthDialog
          open={authOpen}
          onSuccess={onAuthSuccess}
          onClose={() => {
            setAuthOpen(false)
            analytics.chat.loginWallAbandoned({ source })
          }}
          title={t('login_dialog_title')}
          description={t('login_dialog_description')}
          trigger="chat"
          allowedEmailSuffixes={
            emailSuffixes.length > 0 ? emailSuffixes : undefined
          }
          noUniversityEmail={{
            label: t('access.no_university_email'),
            explanation: t('access.wrong_domain'),
            // Swaps one dialog for the other. Keeping them separate components
            // means AuthDialog stays generic: it offers a door, it does not know
            // what is behind it.
            onClick: () => {
              setAuthOpen(false)
              setAccessOpen(true)
            }
          }}
        />

        <ChatAccessRequestDialog
          open={accessOpen}
          onOpenChange={setAccessOpen}
          source="login_wall"
          question={pendingQuestion}
        />
      </>
    </ChatShell>
  )
}
